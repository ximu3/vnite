use napi::bindgen_prelude::{Buffer, Status};
use napi_derive::napi;
use windows::Win32::Foundation::ERROR_CANCELLED;

use crate::win32;

#[napi(js_name = "getProcessPath")]
pub fn get_process_path(pid: u32) -> String {
  win32::query_process_path_by_pid(pid).unwrap_or_default()
}

#[napi(js_name = "launchElevated")]
pub async fn launch_elevated(exe: String, args: Vec<String>) -> napi::Result<u32> {
  // Keep the blocking UAC wait off the async runtime's worker threads. COM
  // initialization and launch stay together on the blocking thread.
  tokio::task::spawn_blocking(move || win32::launch_elevated(&exe, &args))
    .await
    .map_err(|_| napi::Error::from_reason("Elevated launch task failed"))?
    .map_err(|code| {
      let status = if code == ERROR_CANCELLED.0 {
        Status::Cancelled
      } else {
        Status::GenericFailure
      };
      napi::Error::new(status, format!("Elevated launch failed ({code})"))
    })
}

/// Requests termination of matching paths, requesting elevation only when needed.
#[napi(js_name = "terminateProcesses")]
pub async fn terminate_processes(paths: Vec<String>) -> napi::Result<()> {
  tokio::task::spawn_blocking(move || win32::terminate_processes(&paths))
    .await
    .map_err(|_| napi::Error::from_reason("Process termination task failed"))?
    .map_err(|error| {
      let status = if error.code() == ERROR_CANCELLED.to_hresult() {
        Status::Cancelled
      } else {
        Status::GenericFailure
      };
      napi::Error::new(status, format!("Process termination failed: {error}"))
    })
}

#[napi(js_name = "isElevatedPrivilege")]
pub fn is_elevated_privilege() -> bool {
  win32::is_elevated_privilege()
}

#[napi(js_name = "extractExecutableIcon")]
pub async fn extract_executable_icon(path: String) -> napi::Result<Buffer> {
  win32::extract_executable_icon(&path)
    .map(Buffer::from)
    .map_err(napi::Error::from_reason)
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
