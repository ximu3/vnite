use vnite_win32::{query_process_path_by_pid, HandleGuard};
use windows::Win32::System::Diagnostics::ToolHelp::{
  CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
};

use crate::ProcessInfo;

/// Get all process infomation (pid, full path)
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
        // Fallback to process name if we can't open the process or get the full path
        let proc_full_path =
          query_process_path_by_pid(pid).unwrap_or_else(|_| get_process_name_fallback(&proc_entry));

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

/// Get all process (PID only)
pub fn get_all_process_pid() -> windows::core::Result<Vec<u32>> {
  let mut processes: Vec<u32> = Vec::with_capacity(512);

  unsafe {
    let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)?;

    let _snapshot_guard = HandleGuard::new(snapshot);

    let mut proc_entry = PROCESSENTRY32W {
      dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
      ..Default::default()
    };

    Process32FirstW(snapshot, &mut proc_entry)?;
    {
      loop {
        let pid = proc_entry.th32ProcessID;
        processes.push(pid);

        // Get the next process
        if let Err(error) = Process32NextW(snapshot, &mut proc_entry) {
          if error.code() != windows::Win32::Foundation::ERROR_NO_MORE_FILES.to_hresult() {
            return Err(error);
          }
          break;
        }
      }
    }
  }

  Ok(processes)
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
