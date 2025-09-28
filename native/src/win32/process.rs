use napi::bindgen_prelude::*;
use napi_derive::napi;
use windows::Win32::Foundation::CloseHandle;
use windows::Win32::System::Diagnostics::ToolHelp::{
  CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
};

#[napi(object)]
pub struct Proc {
  pub pid: u32,
  pub proc_name: String,
}

#[napi(js_name = "getAllProcess")]
pub fn get_all_process() -> Vec<Proc> {
  let mut processes = Vec::new();

  unsafe {
    // Create a snapshot of all running processes
    let snapshot = match CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) {
      Ok(handle) => handle,
      Err(_) => return processes,
    };

    // Initialize the process entry structure
    let mut proc_entry = PROCESSENTRY32W {
      dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
      ..Default::default()
    };

    // Get the first process
    if Process32FirstW(snapshot, &mut proc_entry).is_ok() {
      loop {
        // Convert the process name from wide string to String
        let proc_name = String::from_utf16_lossy(
          &proc_entry
            .szExeFile
            .iter()
            .take_while(|&&c| c != 0)
            .copied()
            .collect::<Vec<u16>>(),
        );

        processes.push(Proc {
          pid: proc_entry.th32ProcessID,
          proc_name,
        });

        // Get the next process
        if Process32NextW(snapshot, &mut proc_entry).is_err() {
          break;
        }
      }
    }

    // Close the snapshot handle
    let _ = CloseHandle(snapshot);
  }

  processes
}

#[napi]
pub fn test_callback<T>(callback: T) -> Result<()>
where
  T: Fn(String) -> Result<()>,
{
  callback("test".to_string())?;
  Ok(())
}
