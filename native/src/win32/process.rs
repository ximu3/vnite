use windows::Win32::{
  Foundation::{CloseHandle, HANDLE},
  System::{
    Diagnostics::ToolHelp::{
      CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
      TH32CS_SNAPPROCESS,
    },
    Threading::{
      OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32,
      PROCESS_QUERY_LIMITED_INFORMATION,
    },
  },
};

use crate::napi_win32::ProcessInfo;

// RAII wrapper for Windows handles to ensure they're always closed
struct HandleGuard(HANDLE);

impl HandleGuard {
  fn new(handle: HANDLE) -> Self {
    HandleGuard(handle)
  }
}

impl Drop for HandleGuard {
  fn drop(&mut self) {
    unsafe {
      let _ = CloseHandle(self.0);
    }
  }
}

pub fn get_all_process() -> Vec<ProcessInfo> {
  // Allocate a reasonable amount of memory in advance
  let mut processes: Vec<ProcessInfo> = Vec::with_capacity(512);

  unsafe {
    // Create a snapshot of all running processes
    let snapshot = match CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) {
      Ok(handle) => handle,
      Err(_) => return processes,
    };

    // Ensure snapshot handle is always closed using RAII
    let _snapshot_guard = HandleGuard::new(snapshot);

    // Initialize the process entry structure
    let mut proc_entry = PROCESSENTRY32W {
      dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
      ..Default::default()
    };

    // Get the first process
    if Process32FirstW(snapshot, &mut proc_entry).is_ok() {
      loop {
        let pid = proc_entry.th32ProcessID;

        // Try to get the full path of the process
        let proc_full_path = match OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
          Ok(process_handle) => {
            // Use RAII guard to ensure handle is always closed
            let _handle_guard = HandleGuard::new(process_handle);

            // Use larger buffer to prevent truncation
            let mut buffer = [0u16; 512]; // Increased buffer size
            let mut size = buffer.len() as u32;

            let success = QueryFullProcessImageNameW(
              process_handle,
              PROCESS_NAME_WIN32,
              windows::core::PWSTR(buffer.as_mut_ptr()),
              &mut size,
            );

            if success.is_ok() && size > 0 && (size as usize) <= buffer.len() {
              // Safe bounds check before slicing
              let safe_size = std::cmp::min(size as usize, buffer.len());
              String::from_utf16_lossy(&buffer[..safe_size])
            } else {
              // Fallback to process name if we can't get the full path
              get_process_name_fallback(&proc_entry)
            }
          }
          Err(_) => {
            // Fallback to process name if we can't open the process
            get_process_name_fallback(&proc_entry)
          }
        };

        processes.push(ProcessInfo {
          pid,
          full_path: proc_full_path,
        });

        // Get the next process
        if Process32NextW(snapshot, &mut proc_entry).is_err() {
          break;
        }
      }
    }
  }

  processes
}

pub fn get_process_full_path_by_pid(pid: u32) -> String {
  unsafe {
    match OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
      Ok(handle) => {
        let _handle_guard = HandleGuard::new(handle);
        let mut buffer = [0u16; 256];
        let mut size = buffer.len() as u32;
        let success = QueryFullProcessImageNameW(
          handle,
          PROCESS_NAME_WIN32,
          windows::core::PWSTR(buffer.as_mut_ptr()),
          &mut size,
        );
        if success.is_ok() && size > 0 {
          // Safe bounds check before slicing
          let safe_size = std::cmp::min(size as usize, buffer.len());
          String::from_utf16_lossy(&buffer[..safe_size])
        } else {
          String::new()
        }
      }
      Err(_) => String::new(),
    }
  }
}

// Helper function to safely extract process name from proc_entry
fn get_process_name_fallback(proc_entry: &PROCESSENTRY32W) -> String {
  // Find the null terminator safely
  let name_slice = proc_entry
    .szExeFile
    .iter()
    .position(|&c| c == 0)
    .map_or(&proc_entry.szExeFile[..], |pos| {
      &proc_entry.szExeFile[..pos]
    });

  String::from_utf16_lossy(name_slice)
}
