use napi::threadsafe_function::ThreadsafeFunctionCallMode;
use std::{collections::HashMap, sync::LazyLock};
use tokio::sync::Mutex;

use crate::{
  log,
  monitor::{ProcessInfo, ProcessStatus},
  napi_monitor::ProcessEvent,
  napi_monitor::ProcessEventType,
  utils::types::NapiWeakThreadsafeFunction,
};

pub struct GameManager {
  /// A full list of local games (path - game_id pair).
  ///
  /// May contains 3 kinds of game process information (file, folder, executable name)
  known_games: HashMap<String, String>,

  /// All currently running known game processes.
  /// The key is always fullpath of the process, not the folder or executable name.
  ///
  /// Only processes contained in `known_games` will be inserted into this hashmap.
  /// When a running process is terminated, it will be remove from this hashmap.
  /// Typically there is only 1 entry stored in this hashmap, unless a user is playing 2 or more games simultaneously.
  running_games: HashMap<String, ProcessInfo>,

  /// Threadsafe NodeJS callback get invoked when a known process get created or terminated
  callback: Option<NapiWeakThreadsafeFunction<ProcessEvent, ()>>,
}

impl GameManager {
  fn new() -> Self {
    Self {
      known_games: HashMap::new(),
      running_games: HashMap::new(),
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
    self.running_games.remove(&l_path);
    // should we invoke callback?
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
    self.running_games.contains_key(&path.to_lowercase())
  }

  pub fn handle_message(&mut self, msg: ProcessInfo) {
    let l_path = msg.path.to_lowercase();
    // check directory & fullpath & process name
    let game_id = match self.get_known_game_id(&l_path) {
      Some(id) => id.clone(),
      None => return,
    };
    let pid = msg.pid;
    match msg.status {
      ProcessStatus::Started => {
        // handle race condition
        if let Some(prev) = self.running_games.get(&l_path) {
          if prev.status == ProcessStatus::Terminated && prev.pid == msg.pid {
            // process termination notification is received before creation, remove it and return
            self.running_games.remove(&l_path);
            return;
          }
        }
        self.running_games.insert(l_path.clone(), msg);
        log::info(format!("game started: {}, pid: {}", l_path, pid).as_str());
        if let Some(callback) = &self.callback {
          callback.call(
            Ok(ProcessEvent {
              event_type: ProcessEventType::Creation,
              full_path: l_path,
              pid: pid,
              id: game_id,
            }),
            ThreadsafeFunctionCallMode::NonBlocking,
          );
        }
      }
      ProcessStatus::Terminated => {
        if let Some(prev) = self.running_games.remove(&l_path) {
          if prev.status == ProcessStatus::Started && prev.pid == msg.pid {
            // ...multiple processes?

            // normal case, we have removed the process, just invoke the callback
            log::info(format!("game stopped: {}, pid: {}", l_path, pid).as_str());
            if let Some(callback) = &self.callback {
              callback.call(
                Ok(ProcessEvent {
                  event_type: ProcessEventType::Termination,
                  full_path: l_path,
                  pid: pid,
                  id: game_id,
                }),
                ThreadsafeFunctionCallMode::NonBlocking,
              );
            }
            return;
          }
        }
        // unsual case, maybe a race condition, insert the message
        self.running_games.insert(l_path, msg);
      }
    }
  }
}

static GAME_MANAGER: LazyLock<Mutex<GameManager>> =
  LazyLock::new(|| Mutex::new(GameManager::new()));

pub fn get() -> &'static Mutex<GameManager> {
  &GAME_MANAGER
}
