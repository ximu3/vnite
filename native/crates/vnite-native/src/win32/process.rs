use std::mem::size_of;
use vnite_win32::HandleGuard;
use windows::{
  core::{w, HSTRING, PCWSTR},
  Win32::{
    Foundation::{
      GetLastError, ERROR_INVALID_HANDLE, ERROR_INVALID_PARAMETER, WAIT_OBJECT_0, WAIT_TIMEOUT,
    },
    System::{
      Com::{CoInitializeEx, CoUninitialize, COINIT_APARTMENTTHREADED, COINIT_DISABLE_OLE1DDE},
      Threading::{GetExitCodeProcess, GetProcessId, WaitForSingleObject},
    },
    UI::{
      Shell::{
        ShellExecuteExW, SEE_MASK_FLAG_NO_UI, SEE_MASK_NOASYNC, SEE_MASK_NOCLOSEPROCESS,
        SHELLEXECUTEINFOW,
      },
      WindowsAndMessaging::SW_HIDE,
    },
  },
};

struct ComApartment(bool);

impl Drop for ComApartment {
  fn drop(&mut self) {
    if self.0 {
      unsafe { CoUninitialize() };
    }
  }
}

// Fixed executable and generated arguments only; Windows argv quoting, no shell.
fn quote(value: &str) -> String {
  let mut result = String::from("\"");
  let mut backslashes = 0;
  for character in value.chars() {
    if character == '\\' {
      backslashes += 1;
      continue;
    }
    let count = if character == '"' {
      backslashes * 2 + 1
    } else {
      backslashes
    };
    result.extend(std::iter::repeat_n('\\', count));
    result.push(character);
    backslashes = 0;
  }
  result.extend(std::iter::repeat_n('\\', backslashes * 2));
  result.push('"');
  result
}

/// Launch an elevated process and return its PID without waiting for exit.
pub fn launch_elevated(exe: &str, args: &[String]) -> Result<u32, u32> {
  let process = start_elevated(exe, args)?;
  let pid = unsafe { GetProcessId(process.0) };
  if pid == 0 {
    Err(unsafe { GetLastError() }.0)
  } else {
    Ok(pid)
  }
}

/// Execute an elevated command and return its exit code (30-second execution timeout).
pub fn execute_elevated(exe: &str, args: &[String]) -> Result<u32, u32> {
  let process = start_elevated(exe, args)?;
  match unsafe { WaitForSingleObject(process.0, 30_000) } {
    WAIT_OBJECT_0 => {
      let mut code = 0;
      unsafe { GetExitCodeProcess(process.0, &mut code) }
        .map_err(|error| error.code().0 as u32 & 0xffff)?;
      Ok(code)
    }
    WAIT_TIMEOUT => Err(WAIT_TIMEOUT.0),
    _ => Err(unsafe { GetLastError() }.0),
  }
}

fn start_elevated(exe: &str, args: &[String]) -> Result<HandleGuard, u32> {
  if exe.is_empty() || exe.contains('\0') || args.iter().any(|arg| arg.contains('\0')) {
    return Err(ERROR_INVALID_PARAMETER.0);
  }

  let exe = HSTRING::from(exe);
  let parameters = HSTRING::from(
    args
      .iter()
      .map(|arg| quote(arg))
      .collect::<Vec<_>>()
      .join(" "),
  );
  let _com = ComApartment(unsafe {
    CoInitializeEx(None, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE).is_ok()
  });
  let mut info = SHELLEXECUTEINFOW {
    cbSize: size_of::<SHELLEXECUTEINFOW>() as u32,
    fMask: SEE_MASK_NOCLOSEPROCESS | SEE_MASK_NOASYNC | SEE_MASK_FLAG_NO_UI,
    lpVerb: w!("runas"),
    lpFile: PCWSTR(exe.as_ptr()),
    lpParameters: PCWSTR(parameters.as_ptr()),
    nShow: SW_HIDE.0,
    ..Default::default()
  };
  unsafe { ShellExecuteExW(&mut info) }.map_err(|error| error.code().0 as u32 & 0xffff)?;

  if info.hProcess.is_invalid() {
    return Err(ERROR_INVALID_HANDLE.0);
  }
  Ok(HandleGuard(info.hProcess))
}

#[cfg(test)]
mod tests {
  use super::*;
  use windows::Win32::{
    Foundation::{LocalFree, HLOCAL},
    UI::Shell::CommandLineToArgvW,
  };

  #[test]
  fn quoted_arguments_round_trip_through_windows_parser() {
    let args = [
      "",
      "plain",
      "two words",
      "tab\tvalue",
      "a\"b",
      "C:\\path with spaces\\",
      "\\\\server\\share\\",
      "slashes\\\\\"quote",
      "\\",
      "tail\\\\",
      "日本語 简体中文",
    ];
    let command_line = HSTRING::from(format!("monitor.exe {}", args.map(quote).join(" ")));
    let mut count = 0;
    unsafe {
      let argv = CommandLineToArgvW(&command_line, &mut count);
      assert!(!argv.is_null());
      let decoded = std::slice::from_raw_parts(argv, count as usize)
        .iter()
        .skip(1)
        .map(|value| value.to_string().unwrap())
        .collect::<Vec<_>>();
      let _ = LocalFree(Some(HLOCAL(argv.cast())));
      assert_eq!(decoded, args);
    }
  }
}
