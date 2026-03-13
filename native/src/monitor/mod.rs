use std::sync::LazyLock;
use tokio::sync::Mutex;

use crate::{
  log,
  monitor::{etw_monitor::EtwMonitor, wmi_monitor::WmiMonitor},
  napi_monitor::ProcessEvent,
  utils::types::NapiWeakThreadsafeFunction,
  win32,
};

pub mod gm;

mod etw_monitor;
mod wmi_monitor;

trait WinProcessMonitor: Send {
  fn start_monitoring(&mut self) -> windows_core::Result<()>;
  fn stop_monitoring(&mut self);
}

#[derive(Debug, PartialEq)]
enum ProcessStatus {
  Started,
  Terminated,
}

pub struct ProcessMessage {
  pid: u32,
  status: ProcessStatus,
  path: String,
}

static PROCESS_MONITOR: LazyLock<Mutex<Option<Box<dyn WinProcessMonitor + Send>>>> =
  LazyLock::new(|| Mutex::new(None));

pub async fn start_monitoring(
  local_game_pathes: Vec<String>,
  local_game_ids: Vec<String>,
  callback: Option<NapiWeakThreadsafeFunction<ProcessEvent, ()>>,
) {
  let mut guard_monitor = PROCESS_MONITOR.lock().await;

  // stop monitoring if already existed
  if let Some(mut monitor) = guard_monitor.take() {
    monitor.stop_monitoring();
  }

  // initialize known games
  gm::get()
    .lock()
    .await
    .init(local_game_pathes, local_game_ids, callback);

  // initialize a monitor and start monitoring
  let mut monitor: Box<dyn WinProcessMonitor> = if win32::is_elevated_privilege() {
    log::info("application is running with elevated privilege, using ETW process monitor");
    Box::new(EtwMonitor::new())
  } else {
    log::info("application is running with normal privilege, using WMI process monitor");
    Box::new(WmiMonitor::new())
  };

  let result = monitor.start_monitoring();
  if result.is_err() {
    log::error("failed to start native monitor");
    return;
  }

  *guard_monitor = Some(monitor);
  // drop mutex guard immediately after using to avoid potential dead lock
  drop(guard_monitor);

  // fire and forget a background concurrency to check games at startup
  tokio::spawn(async {
    tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
    startup_process_check().await;
  });
}

pub async fn stop_monitoring() {
  if let Some(mut monitor) = PROCESS_MONITOR.lock().await.take() {
    monitor.stop_monitoring();
    // yield back control to tokio runtime to do cleanups (...or wait for a short duration?)
    tokio::task::yield_now().await;
  }
}

pub async fn add_known_game(path: String, id: String) {
  gm::get().lock().await.add_known_game(path, id);
}

pub async fn remove_known_game_by_id(game_id: String) {
  gm::get().lock().await.remove_known_game_by_id(&game_id);
}

pub async fn replace_known_games(local_game_pathes: Vec<String>, local_game_ids: Vec<String>) {
  gm::get()
    .lock()
    .await
    .init_known_games(local_game_pathes, local_game_ids);
}

pub async fn is_running(path: String, is_folder: Option<bool>) -> bool {
  gm::get().lock().await.is_running(&path, is_folder)
}

/// Check if there are any known games already running at startup
async fn startup_process_check() {
  let all_process = win32::get_all_process();
  let mut gm_guard = gm::get().lock().await;
  for proc in all_process {
    gm_guard.handle_wmi_message(ProcessMessage {
      pid: proc.pid,
      status: ProcessStatus::Started,
      path: proc.full_path,
    });
  }
}
