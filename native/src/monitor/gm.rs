use napi::threadsafe_function::ThreadsafeFunctionCallMode;
use regex::Regex;
use std::{collections::HashMap, sync::LazyLock};
use tokio::sync::Mutex;

use crate::{
  log,
  monitor::{ProcessMessage, ProcessStatus},
  napi_monitor::{ProcessEvent, ProcessEventType},
  utils::types::NapiWeakThreadsafeFunction,
  win32,
};

/// Threadsafe NodeJS callback get invoked when a foreground window is changed
static FOREGROUND_CALLBACK: std::sync::Mutex<Option<NapiWeakThreadsafeFunction<String, ()>>> =
  std::sync::Mutex::new(None);

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
  /// When a running process is terminated, it is designed to be remove from this hashmap.
  /// Typically there is only 1 entry stored in this hashmap, unless a user is playing 2 or more games simultaneously.
  running_process: HashMap<String, KnownGameProcessInfo>,

  /// Threadsafe NodeJS callback get invoked when a known process get created or terminated
  process_callback: Option<NapiWeakThreadsafeFunction<ProcessEvent, ()>>,

  /// Current Foreground process PID only if the process is a known game, otherwise 0
  foreground_pid: u32,
  foreground_wait_time: u64,
  foreground_timeout_handle: Option<tokio::task::JoinHandle<()>>,
}

impl GameManager {
  fn new() -> Self {
    Self {
      known_games: HashMap::new(),
      running_process: HashMap::new(),
      process_callback: None,
      foreground_pid: 0,
      foreground_wait_time: 10,
      foreground_timeout_handle: None,
    }
  }

  pub fn init(
    &mut self,
    pathes: Vec<String>,
    ids: Vec<String>,
    callback: Option<NapiWeakThreadsafeFunction<ProcessEvent, ()>>,
  ) {
    self.init_known_games(pathes, ids);
    self.set_process_callback(callback);
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

  pub fn set_foreground_callback(&self, callback: Option<NapiWeakThreadsafeFunction<String, ()>>) {
    if let Ok(mut callback_guard) = FOREGROUND_CALLBACK.lock() {
      *callback_guard = callback;
    }
  }

  pub fn unset_foreground_callback(&self) {
    if let Ok(mut callback_guard) = FOREGROUND_CALLBACK.lock() {
      *callback_guard = None;
    }
  }

  pub fn set_foreground_wait_time(&mut self, wait_time: u64) {
    self.foreground_wait_time = wait_time;
  }

  pub fn set_process_callback(
    &mut self,
    callback: Option<NapiWeakThreadsafeFunction<ProcessEvent, ()>>,
  ) {
    self.process_callback = callback;
  }

  pub fn add_known_game(&mut self, path: String, id: String) {
    self.known_games.insert(path.to_lowercase(), id);
  }

  pub fn remove_known_game_by_id(&mut self, game_id: &str) {
    self
      .running_process
      .retain(|_, info| info.game_id != game_id);
    self.known_games.retain(|_, id| id != game_id);
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

  pub fn is_running(&self, path: &str, is_folder: Option<bool>) -> bool {
    let mut is_running = false;
    let lower_path = path.to_ascii_lowercase();
    let normalized_path = lower_path.trim_end_matches(['/', '\\']);
    let escaped_path = regex::escape(normalized_path);

    for (k, _) in &self.running_process {
      let re = if is_folder.is_some_and(|x| x) {
        Regex::new(format!(r"^{}[/\\][^/\\]+-\d+$", escaped_path).as_str())
      } else {
        Regex::new(format!(r"^{}-\d+$", escaped_path).as_str())
      };
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

  pub fn is_magpie_pid(pid: u32) -> bool {
    let mut full_path = win32::get_process_full_path_by_pid(pid);
    full_path.make_ascii_lowercase();
    if full_path.ends_with("magpie.exe") {
      return true;
    }
    false
  }

  /// Handle a foreground change message.
  /// Note the `msg` can be 0 if current process has insufficient privilege to retrieve the target window.
  pub fn handle_foreground_message(&mut self, msg: u32) {
    if self.running_process.len() == 0 || Self::is_magpie_pid(msg) {
      return;
    }
    for (_, info) in &self.running_process {
      // if the incoming foreground pid is not a running game's pid, proceeds to the next iteration
      if info.pid != msg {
        continue;
      }
      // if the incoming foreground pid equals the previous foreground pid, do nothing
      // (this happens if a game has multiple windows and the user is switching between those windows)
      if self.foreground_pid == msg {
        return;
      }
      // a game window comes into foreground, send the message to Node
      self.foreground_pid = msg;
      let game_id = info.game_id.clone();
      let timeout = self.foreground_wait_time;
      if let Some(handle) = self.foreground_timeout_handle.take() {
        handle.abort();
      }
      self.foreground_timeout_handle = Some(tokio::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(timeout)).await;
        if let Ok(callback_guard) = FOREGROUND_CALLBACK.lock() {
          if let Some(callback) = &*callback_guard {
            callback.call(Ok(game_id), ThreadsafeFunctionCallMode::Blocking);
          }
        }
      }));
      return;
    }
    // no running games pid matched, user switched foreground window to a non game window

    // if the previous foreground window pid is already a non game window pid, do nothing
    if self.foreground_pid == 0 {
      return;
    }
    // otherwise, user switched from a game window, send the message to Node
    self.foreground_pid = 0;
    let timeout = self.foreground_wait_time;
    if let Some(handle) = self.foreground_timeout_handle.take() {
      handle.abort();
    }
    self.foreground_timeout_handle = Some(tokio::spawn(async move {
      tokio::time::sleep(tokio::time::Duration::from_secs(timeout)).await;
      if let Ok(callback_guard) = FOREGROUND_CALLBACK.lock() {
        if let Some(callback) = &*callback_guard {
          callback.call(Ok(String::new()), ThreadsafeFunctionCallMode::Blocking);
        }
      }
    }));
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
        self.foreground_pid = msg.pid;
        log::info(format!("game started: {}, pid: {}", l_path, pid).as_str());
        if let Some(callback) = &self.process_callback {
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
            self.foreground_pid = 0;
            log::info(format!("game stopped: {}, pid: {}", l_path, pid).as_str());
            if let Some(callback) = &self.process_callback {
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
        self.foreground_pid = msg.pid;
        log::info(format!("game started: {}, pid: {}", l_path, msg.pid).as_str());
        if let Some(callback) = &self.process_callback {
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
          self.foreground_pid = 0;
          log::info(format!("game stopped: {}, pid: {}", game_info.path, game_info.pid).as_str());
          if let Some(callback) = &self.process_callback {
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
