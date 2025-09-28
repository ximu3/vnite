use std::sync::LazyLock;
use tokio::sync::Mutex;

use crate::{
  monitor::wmi_monitor::WmiMonitor, napi_monitor::ProcessEvent,
  utils::types::NapiWeakThreadsafeFunction,
};

mod gm;
mod wmi_monitor;

#[derive(PartialEq)]
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
  local_games: Vec<String>,
  callback: Option<NapiWeakThreadsafeFunction<ProcessEvent, ()>>,
) {
  let mut guard_monitor = WMI_MONITOR.lock().await;
  // stop monitoring if already existed
  if let Some(monitor) = guard_monitor.take() {
    monitor.stop_monitoring().await;
  }

  // initialize known games
  gm::get().lock().await.init(local_games, callback);

  // initialize a monitor and start monitoring
  let monitor = WmiMonitor::new();
  monitor.start_monitoring().await;
  *guard_monitor = Some(monitor);
}

pub async fn stop_monitoring() {
  if let Some(monitor) = WMI_MONITOR.lock().await.take() {
    monitor.stop_monitoring().await;
  }
}

pub async fn add_known_game(path: String) {
  gm::get().lock().await.add_known_game(path);
}

pub async fn remove_known_game(path: String) {
  gm::get().lock().await.remove_known_game(&path);
}

pub async fn is_running(path: String) -> bool {
  gm::get().lock().await.is_running(&path)
}
