use napi::bindgen_prelude::Status;
use napi::threadsafe_function::ThreadsafeFunction;
use napi_derive::napi;

use crate::foreground;

#[napi(js_name = "installForegroundHook")]
pub async fn install_foreground_hook(
  callback: Option<ThreadsafeFunction<u32, (), u32, Status, true, true>>,
) -> napi::Result<()> {
  foreground::install_hook(callback)
    .await
    .map_err(napi::Error::from_reason)
}

#[napi(js_name = "uninstallForegroundHook")]
pub async fn uninstall_foreground_hook() {
  foreground::uninstall_hook().await;
}
