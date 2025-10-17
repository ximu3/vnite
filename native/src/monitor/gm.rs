use napi::threadsafe_function::ThreadsafeFunctionCallMode;
use regex::Regex;
use std::{collections::HashMap, sync::LazyLock};
use tokio::sync::Mutex;

use crate::{
  log,
  monitor::{ProcessMessage, ProcessStatus},
  napi_monitor::ProcessEvent,
  napi_monitor::ProcessEventType,
  utils::types::NapiWeakThreadsafeFunction,
};

struct KnownGameProcessInfo {
  pid: u32,
  status: ProcessStatus,
  path: String,
  game_id: String,
}

pub struct GameManager {
  /// A full list of local games (path - game_id pair).
  ///
  /// May contains 3 kinds of game process information (file, folder, executable name)
  known_games: HashMap<String, String>,

  /// All currently running known game processes.
  /// The key is always "{full_path}-{pid}" of the process, not the folder or executable name.
  ///
  /// Only processes contained in `known_games` will be inserted into this hashmap.
  /// When a running process is terminated, it will be remove from this hashmap.
  /// Typically there is only 1 entry stored in this hashmap, unless a user is playing 2 or more games simultaneously.
  running_process: HashMap<String, KnownGameProcessInfo>,

  /// Threadsafe NodeJS callback get invoked when a known process get created or terminated
  callback: Option<NapiWeakThreadsafeFunction<ProcessEvent, ()>>,
}

impl GameManager {
  fn new() -> Self {
    Self {
      known_games: HashMap::new(),
      running_process: HashMap::new(),
      callback: None,
    }
  }

  pub fn init(
    &mut self,
    pathes: Vec<String>,
    ids: Vec<String>,
    callback: Option<NapiWeakThreadsafeFunction<ProcessEvent, ()>>,
  ) {
    self.init_known_games(pathes, ids);
    self.set_callback(callback);
  }

  pub fn init_known_games(&mut self, pathes: Vec<String>, ids: Vec<String>) {
    self.known_games.clear();
    // allocate enough memory in advance to avoid reallocation
    let size = pathes.len();
    self.known_games.reserve(size);
    for (path, id) in pathes.into_iter().zip(ids.into_iter()) {
      let l_path = path.to_lowercase();
      self.known_games.insert(l_path, id);
    }
  }

  pub fn set_callback(&mut self, callback: Option<NapiWeakThreadsafeFunction<ProcessEvent, ()>>) {
    self.callback = callback;
  }

  pub fn add_known_game(&mut self, path: String, id: String) {
    self.known_games.insert(path.to_lowercase(), id);
  }

  pub fn remove_known_game(&mut self, path: &str) {
    let l_path = path.to_lowercase();
    self.known_games.remove(&l_path);
  }

  pub fn get_known_game_id_exact(&self, l_path: &str) -> Option<&String> {
    self.known_games.get(l_path)
  }

  pub fn get_known_game_id(&self, l_path: &str) -> Option<&String> {
    let (l_dir, l_exe) = match l_path.rsplit_once("\\") {
      Some((l, r)) => (l, r),
      None => return self.get_known_game_id_exact(l_path),
    };
    self
      .get_known_game_id_exact(l_dir)
      .or_else(|| self.get_known_game_id_exact(l_path))
      .or_else(|| self.get_known_game_id_exact(l_exe))
  }

  pub fn is_running(&self, path: &str) -> bool {
    let mut is_running = false;
    for (k, _) in &self.running_process {
      let re = Regex::new(format!(r"^{}-\d+$", path).as_str());
      match re {
        Ok(re) => {
          if re.is_match(k) {
            is_running = true;
            break;
          }
        }
        Err(_) => {
          continue;
        }
      }
    }
    is_running
  }

  pub fn handle_wmi_message(&mut self, msg: ProcessMessage) {
    let l_path = msg.path.to_lowercase();
    // check directory & fullpath & process name
    let game_id = match self.get_known_game_id(&l_path) {
      Some(id) => id.clone(),
      None => return,
    };
    let pid = msg.pid;
    let key = format!("{l_path}-{}", msg.pid);
    match msg.status {
      ProcessStatus::Started => {
        // handle race condition
        if let Some(prev) = self.running_process.get(&key) {
          if prev.status == ProcessStatus::Terminated {
            // process termination notification is received before creation, remove it and return
            self.running_process.remove(&key);
            return;
          } else if prev.status == ProcessStatus::Started {
            // a process which has the same full path and pid with current message is already traced,
            // may be a duplication delivery, ignore it
            return;
          }
        }
        self.running_process.insert(
          key,
          KnownGameProcessInfo {
            pid: msg.pid,
            status: msg.status,
            path: l_path.clone(),
            game_id: game_id.clone(),
          },
        );
        log::info(format!("game started: {}, pid: {}", l_path, pid).as_str());
        if let Some(callback) = &self.callback {
          callback.call(
            Ok(ProcessEvent {
              event_type: ProcessEventType::Creation,
              full_path: l_path,
              pid: pid,
              id: game_id,
            }),
            ThreadsafeFunctionCallMode::Blocking,
          );
        }
      }
      ProcessStatus::Terminated => {
        if let Some(prev) = self.running_process.get(&key) {
          if prev.status == ProcessStatus::Started {
            self.running_process.remove(&key);
            log::info(format!("game stopped: {}, pid: {}", l_path, pid).as_str());
            if let Some(callback) = &self.callback {
              callback.call(
                Ok(ProcessEvent {
                  event_type: ProcessEventType::Termination,
                  full_path: l_path,
                  pid: pid,
                  id: game_id,
                }),
                ThreadsafeFunctionCallMode::Blocking,
              );
            }
            return;
          } else if prev.status == ProcessStatus::Terminated {
            // a process which has the same full path and pid with current message is already traced,
            // may be a duplication delivery, ignore it
            return;
          }
        }
        // unsual case, maybe a race condition, insert the message
        self.running_process.insert(
          key,
          KnownGameProcessInfo {
            pid: msg.pid,
            status: msg.status,
            path: l_path,
            game_id: game_id,
          },
        );
      }
    }
  }

  pub fn handle_etw_message(&mut self, msg: ProcessMessage) {
    match msg.status {
      ProcessStatus::Started => {
        let l_path = msg.path.to_lowercase();
        // check directory & fullpath & process name
        let game_id = match self.get_known_game_id(&l_path) {
          Some(id) => id.clone(),
          None => return,
        };
        // create a unique key using path and pid combination, to handle multiple instances case
        let key = format!("{l_path}-{}", msg.pid);
        // if already have it, may be a dulplication event
        if self.running_process.get(&key).is_some() {
          return;
        }

        self.running_process.insert(
          key,
          KnownGameProcessInfo {
            pid: msg.pid,
            status: msg.status,
            path: l_path.clone(),
            game_id: game_id.clone(),
          },
        );
        log::info(format!("game started: {}, pid: {}", l_path, msg.pid).as_str());
        if let Some(callback) = &self.callback {
          callback.call(
            Ok(ProcessEvent {
              event_type: ProcessEventType::Creation,
              full_path: l_path,
              pid: msg.pid,
              id: game_id,
            }),
            ThreadsafeFunctionCallMode::Blocking,
          );
        }
      }
      ProcessStatus::Terminated => {
        for (_, game_info) in self.running_process.extract_if(|_, v| v.pid == msg.pid) {
          log::info(format!("game stopped: {}, pid: {}", game_info.path, game_info.pid).as_str());
          if let Some(callback) = &self.callback {
            callback.call(
              Ok(ProcessEvent {
                event_type: ProcessEventType::Termination,
                full_path: game_info.path,
                pid: game_info.pid,
                id: game_info.game_id,
              }),
              ThreadsafeFunctionCallMode::Blocking,
            );
          }
        }
      }
    }
  }
}

static GAME_MANAGER: LazyLock<Mutex<GameManager>> =
  LazyLock::new(|| Mutex::new(GameManager::new()));

pub fn get() -> &'static Mutex<GameManager> {
  &GAME_MANAGER
}
