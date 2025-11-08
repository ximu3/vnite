use napi::bindgen_prelude::Status;
use napi::threadsafe_function::ThreadsafeFunction;
use napi_derive::napi;

use crate::foreground;

#[napi(js_name = "installForegroundHook")]
pub async fn install_foreground_hook(
  callback: Option<ThreadsafeFunction<String, (), String, Status, true, true>>,
  wait_time: Option<u32>,
) {
  foreground::install_hook(callback, wait_time).await;
}

#[napi(js_name = "uninstallForegroundHook")]
pub async fn uninstall_foreground_hook() {
  foreground::uninstall_hook().await;
}

#[napi(js_name = "setForegroundWaitTime")]
pub async fn set_foreground_wait_time(wait_time: u32) {
  foreground::set_foreground_wait_time(wait_time).await;
}
