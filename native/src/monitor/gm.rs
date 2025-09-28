use napi::threadsafe_function::ThreadsafeFunctionCallMode;
use std::{
  collections::{HashMap, HashSet},
  sync::LazyLock,
};
use tokio::sync::Mutex;

use crate::{
  log,
  monitor::{ProcessInfo, ProcessStatus},
  napi_monitor::ProcessEvent,
  napi_monitor::ProcessEventType,
  utils::types::NapiWeakThreadsafeFunction,
};

pub struct GameManager {
  /// A full list of local games
  known_games: HashSet<String>,

  /// All currently running known game processes.
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
      known_games: HashSet::new(),
      running_games: HashMap::new(),
      callback: None,
    }
  }

  pub fn init(
    &mut self,
    games: Vec<String>,
    callback: Option<NapiWeakThreadsafeFunction<ProcessEvent, ()>>,
  ) {
    self.init_known_games(games);
    self.set_callback(callback);
  }

  pub fn init_known_games(&mut self, games: Vec<String>) {
    self.known_games.clear();
    // allocate enough memory in advance to avoid reallocation
    self.known_games.reserve(games.len());
    for game in games {
      self.known_games.insert(game);
    }
  }

  pub fn set_callback(&mut self, callback: Option<NapiWeakThreadsafeFunction<ProcessEvent, ()>>) {
    self.callback = callback;
  }

  pub fn add_known_game(&mut self, path: String) {
    self.known_games.insert(path);
  }

  pub fn remove_known_game(&mut self, path: &str) {
    self.known_games.remove(path);
    self.running_games.remove(path);
    // should we invoke callback?
  }

  pub fn is_known_game(&self, l_path: &str) -> bool {
    self.known_games.contains(l_path)
  }

  pub fn is_running(&self, path: &str) -> bool {
    self.running_games.contains_key(path)
  }

  pub fn handle_message(&mut self, msg: ProcessInfo) {
    let l_path = msg.path.to_lowercase();
    let pid = msg.pid;
    if !self.is_known_game(&l_path) {
      return;
    }
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
            }),
            ThreadsafeFunctionCallMode::NonBlocking,
          );
        }
      }
      ProcessStatus::Terminated => {
        if let Some(prev) = self.running_games.remove(&l_path) {
          if prev.status == ProcessStatus::Started && prev.pid == msg.pid {
            // normal case, we have removed the process, just invoke the callback
            log::info(format!("game stopped: {}, pid: {}", l_path, pid).as_str());
            if let Some(callback) = &self.callback {
              callback.call(
                Ok(ProcessEvent {
                  event_type: ProcessEventType::Termination,
                  full_path: l_path,
                  pid: pid,
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
