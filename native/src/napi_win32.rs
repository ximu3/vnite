use napi_derive::napi;

use crate::win32;

#[napi(object)]
pub struct ProcessInfo {
  pub pid: u32,
  pub full_path: String,
}

#[napi(js_name = "getAllProcess")]
pub fn get_all_process() -> Vec<ProcessInfo> {
  win32::get_all_process()
}
