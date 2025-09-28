use napi::bindgen_prelude::Status;
use napi::threadsafe_function::ThreadsafeFunction;
use napi_derive::napi;

use crate::monitor;

#[napi]
pub enum ProcessEventType {
  Creation,
  Termination,
}

#[napi(object)]
pub struct ProcessEvent {
  pub event_type: ProcessEventType,
  pub full_path: String,
  pub pid: u32,
}

#[napi(js_name = "startMonitoring")]
pub async fn start_monitoring(
  local_games: Vec<String>,
  callback: Option<ThreadsafeFunction<ProcessEvent, (), ProcessEvent, Status, true, true>>,
) {
  monitor::start_monitoring(local_games, callback).await;
}

#[napi(js_name = "stopMonitoring")]
pub async fn stop_monitoring() {
  monitor::stop_monitoring().await;
}

#[napi(js_name = "addKnownGame")]
pub async fn add_known_game(path: String) {
  monitor::add_known_game(path).await;
}

#[napi(js_name = "removeKnownGame")]
pub async fn remove_known_game(path: String) {
  monitor::remove_known_game(path).await;
}

#[napi(js_name = "isRunning")]
pub async fn is_running(path: String) -> bool {
  monitor::is_running(path).await
}
