pub mod process;
// pub mod hook;

use crate::napi_win32::ProcessInfo;

pub fn get_all_process() -> Vec<ProcessInfo> {
  process::get_all_process()
}
