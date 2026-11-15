mod icon;
mod notification;
mod privilege;
mod process;
mod terminate;

pub use process::launch_elevated;
pub use terminate::terminate_processes;
pub use vnite_win32::query_process_path_by_pid;

use crate::log;

pub fn extract_executable_icon(path: &str) -> Result<Vec<u8>, String> {
  icon::extract_executable_icon(path)
}

pub fn is_elevated_privilege() -> bool {
  let result = privilege::is_elevated_privilege();
  match result {
    Err(e) => {
      log::error(e.message().as_str());
      false
    }
    Ok(v) => v,
  }
}

pub fn send_notification(
  app_id: String,
  title: Option<String>,
  line1: Option<String>,
  line2: Option<String>,
  image: Option<String>,
  silent: Option<bool>,
) {
  let mut noti = notification::WinNotification::new(app_id);
  if let Some(content) = title {
    noti.title(content);
  }
  if let Some(content) = line1 {
    noti.line1(content);
  }
  if let Some(content) = line2 {
    noti.line2(content);
  }
  if let Some(content) = image {
    noti.image(content);
  }
  if let Some(content) = silent {
    noti.is_silent(content);
  }
  let result = noti.show();
  match result {
    Ok(_) => {
      log::info("A system notification has been sent.");
    }
    Err(err) => {
      log::error(format!("Failed to send system notification: {}", err.message()).as_str());
    }
  }
}
