use napi::bindgen_prelude::Status;
use napi::threadsafe_function::ThreadsafeFunction;
use napi_derive::napi;

use crate::log;

#[napi(js_name = "initLogger")]
pub async fn init_logger(
  fn_info: ThreadsafeFunction<String, (), String, Status, true, true>,
  fn_err: ThreadsafeFunction<String, (), String, Status, true, true>,
) {
  log::init_logger(fn_info, fn_err).await;
}

#[napi(js_name = "stopLogger")]
pub fn stop_logger() {
  log::stop_logger();
}
