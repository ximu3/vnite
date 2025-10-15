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

#[napi(js_name = "isElevatedPrivilege")]
pub fn is_elevated_privilege() -> bool {
  win32::is_elevated_privilege()
}

#[napi(js_name = "sendSystemNotification")]
pub fn send_notification(
  app_id: String,
  title: Option<String>,
  line1: Option<String>,
  line2: Option<String>,
  image_path: Option<String>,
  silent: Option<bool>,
) {
  win32::send_notification(app_id, title, line1, line2, image_path, silent);
}
