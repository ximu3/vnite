use windows::Win32::{Foundation, Security, System};
use windows_core::*;

use crate::log;

/// Check if current process is running with administrative privileges
pub fn is_elevated_privilege() -> Result<bool> {
  unsafe {
    let mut token: Foundation::HANDLE = Foundation::HANDLE::default();
    let result = System::Threading::OpenProcessToken(
      System::Threading::GetCurrentProcess(),
      Security::TOKEN_QUERY,
      &mut token,
    );

    if let Err(err) = result {
      log::error("failed to open process token");
      return Err(err);
    }

    let mut elevation = Security::TOKEN_ELEVATION::default();
    let mut return_length = 0u32;
    let result = Security::GetTokenInformation(
      token,
      Security::TokenElevation,
      Some(&mut elevation as *mut _ as *mut core::ffi::c_void),
      core::mem::size_of::<Security::TOKEN_ELEVATION>() as u32,
      &mut return_length,
    );

    if let Err(err) = result {
      log::error("failed to get process token information");
      Foundation::CloseHandle(token).ok();
      return Err(err);
    }

    Foundation::CloseHandle(token).ok();
    if elevation.TokenIsElevated == 0 {
      Ok(false)
    } else {
      Ok(true)
    }
  }
}
