use std::{mem::size_of, path::Path};
use vnite_win32::{query_process_path, HandleGuard};
use windows::{
  core::{Error, Result},
  Win32::{
    Foundation::{
      ERROR_ACCESS_DENIED, ERROR_INSUFFICIENT_BUFFER, ERROR_INVALID_DATA, ERROR_INVALID_PARAMETER,
      E_FAIL, MAX_PATH, WIN32_ERROR,
    },
    System::{
      Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
        TH32CS_SNAPPROCESS,
      },
      SystemInformation::GetSystemDirectoryW,
      Threading::{
        OpenProcess, TerminateProcess, PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_TERMINATE,
      },
    },
  },
};

use super::process::execute_elevated;

fn normalize(path: &str) -> String {
  path
    .trim_start_matches(r"\\?\")
    .replace('/', "\\")
    .to_lowercase()
}

fn taskkill_path() -> Result<String> {
  let mut buffer = [0u16; MAX_PATH as usize];
  let length = unsafe { GetSystemDirectoryW(Some(&mut buffer)) } as usize;
  if length == 0 {
    return Err(Error::from_thread());
  }
  if length >= buffer.len() {
    return Err(ERROR_INSUFFICIENT_BUFFER.into());
  }
  let directory =
    String::from_utf16(&buffer[..length]).map_err(|_| Error::from(ERROR_INVALID_DATA))?;
  Ok(format!(r"{}\taskkill.exe", directory.trim_end_matches('\\')))
}

/// Match fresh full paths.
pub fn terminate_processes(paths: &[String]) -> Result<()> {
  if paths
    .iter()
    .any(|path| !Path::new(path).is_absolute() || path.contains('\0'))
  {
    return Err(ERROR_INVALID_PARAMETER.into());
  }
  if paths.is_empty() {
    return Ok(());
  }

  let paths: Vec<_> = paths.iter().map(|path| normalize(path)).collect();
  let mut elevated = Vec::new();

  unsafe {
    let snapshot = HandleGuard(CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)?);
    let mut entry = PROCESSENTRY32W {
      dwSize: size_of::<PROCESSENTRY32W>() as u32,
      ..Default::default()
    };

    let mut next = Process32FirstW(snapshot.0, &mut entry);
    while next.is_ok() {
      let pid = entry.th32ProcessID;
      next = Process32NextW(snapshot.0, &mut entry);

      // Query-only access allows reading paths of elevated processes.
      let Ok(handle) = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) else {
        continue;
      };
      let handle = HandleGuard(handle);

      if query_process_path(handle.0).is_ok_and(|path| paths.contains(&normalize(&path))) {
        if !elevated.is_empty() {
          // Elevation is already required; skip further normal termination attempts.
          // Keep the handle open to prevent PID reuse.
          elevated.push((pid, handle));
        } else {
          let result = OpenProcess(PROCESS_TERMINATE, false, pid).and_then(|process| {
            let process = HandleGuard(process);
            TerminateProcess(process.0, 1)
          });
          if result.is_err_and(|error| error.code() == ERROR_ACCESS_DENIED.to_hresult()) {
            elevated.push((pid, handle));
          }
        }
      }
    }
  }

  if !elevated.is_empty() {
    let mut args = vec!["/F".into()];
    for (pid, _) in &elevated {
      args.extend(["/PID".into(), pid.to_string()]);
    }
    // Resolve the trusted system executable before elevation to avoid current-directory lookup.
    let code =
      execute_elevated(&taskkill_path()?, &args).map_err(|code| Error::from(WIN32_ERROR(code)))?;
    if code != 0 {
      return Err(Error::new(
        E_FAIL,
        format!("taskkill failed with exit code {code}"),
      ));
    }
  }

  Ok(())
}
