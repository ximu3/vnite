//! Shared Windows handle ownership and process path queries.

use windows::{
  core::{Result, PWSTR},
  Win32::{
    Foundation::{CloseHandle, HANDLE},
    System::Threading::{
      OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32,
      PROCESS_QUERY_LIMITED_INFORMATION,
    },
  },
};

// RAII wrapper for Windows handles to ensure they're always closed
pub struct HandleGuard(pub HANDLE);

impl HandleGuard {
  pub fn new(handle: HANDLE) -> Self {
    Self(handle)
  }
}

impl Drop for HandleGuard {
  fn drop(&mut self) {
    unsafe {
      let _ = CloseHandle(self.0);
    }
  }
}

/// Query the full path on an existing process handle, preserving Windows errors.
pub fn query_process_path(handle: HANDLE) -> Result<String> {
  // Use larger buffer to prevent truncation, including long Windows paths.
  let mut buffer = vec![0u16; 32768];
  let mut size = buffer.len() as u32;
  unsafe {
    QueryFullProcessImageNameW(
      handle,
      PROCESS_NAME_WIN32,
      PWSTR(buffer.as_mut_ptr()),
      &mut size,
    )?;
  }
  // Safe bounds check before slicing
  Ok(String::from_utf16_lossy(
    &buffer[..(size as usize).min(buffer.len())],
  ))
}

/// Query a PID with limited query access, preserving Windows errors.
pub fn query_process_path_by_pid(pid: u32) -> Result<String> {
  // Use RAII guard to ensure handle is always closed
  let handle = HandleGuard(unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid)? });
  query_process_path(handle.0)
}
