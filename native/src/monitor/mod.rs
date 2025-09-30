use std::sync::LazyLock;
use tokio::sync::Mutex;

use crate::{
  monitor::wmi_monitor::WmiMonitor, napi_monitor::ProcessEvent,
  utils::types::NapiWeakThreadsafeFunction, win32,
};

mod gm;
mod wmi_monitor;

#[derive(Debug, PartialEq)]
enum ProcessStatus {
  Started,
  Terminated,
}
struct ProcessInfo {
  pid: u32,
  status: ProcessStatus,
  path: String,
}

static WMI_MONITOR: LazyLock<Mutex<Option<WmiMonitor>>> = LazyLock::new(|| Mutex::new(None));

pub async fn start_monitoring(
  local_game_pathes: Vec<String>,
  local_game_ids: Vec<String>,
  callback: Option<NapiWeakThreadsafeFunction<ProcessEvent, ()>>,
) {
  let mut guard_monitor = WMI_MONITOR.lock().await;
  // stop monitoring if already existed
  if let Some(monitor) = guard_monitor.take() {
    monitor.stop_monitoring().await;
  }

  // initialize known games
  gm::get()
    .lock()
    .await
    .init(local_game_pathes, local_game_ids, callback);

  // initialize a monitor and start monitoring
  let monitor = WmiMonitor::new();
  monitor.start_monitoring().await;
  *guard_monitor = Some(monitor);

  // fire and forget a background concurrency to check games at startup
  tokio::spawn(async {
    tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
    startup_process_check().await;
  });
}

/// Check if there are any known games already running at startup
pub async fn startup_process_check() {
  let all_process = win32::get_all_process();
  let mut gm_guard = gm::get().lock().await;
  for proc in all_process {
    gm_guard.handle_message(ProcessInfo {
      pid: proc.pid,
      status: ProcessStatus::Started,
      path: proc.full_path,
    });
  }
}

pub async fn stop_monitoring() {
  if let Some(monitor) = WMI_MONITOR.lock().await.take() {
    monitor.stop_monitoring().await;
  }
}

pub async fn add_known_game(path: String, id: String) {
  gm::get().lock().await.add_known_game(path, id);
}

pub async fn remove_known_game(path: String) {
  gm::get().lock().await.remove_known_game(&path);
}

pub async fn replace_known_games(local_game_pathes: Vec<String>, local_game_ids: Vec<String>) {
  gm::get()
    .lock()
    .await
    .init_known_games(local_game_pathes, local_game_ids);
}

pub async fn is_running(path: String) -> bool {
  gm::get().lock().await.is_running(&path)
}
