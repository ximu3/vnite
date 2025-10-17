use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;
use windows::{
  Win32::{
    Foundation,
    UI::{Accessibility, WindowsAndMessaging},
  },
};

use crate::log;

// Global state to store the sender and hook handle
// We use Arc<Mutex<>> to make the sender thread-safe and shareable
static SENDER: Mutex<Option<Arc<Mutex<mpsc::Sender<u32>>>>> = Mutex::new(None);
// Store the hook handle as usize (pointer cast to integer) to make it Send + Sync
static HOOK_HANDLE: Mutex<Option<usize>> = Mutex::new(None);

pub fn install_foreground_hook(tx: mpsc::Sender<u32>) -> Result<(), String> {
  unsafe {
    // Store the sender in the global state
    {
      let mut sender_lock = SENDER.lock().map_err(|e| format!("Failed to lock sender: {}", e))?;
      *sender_lock = Some(Arc::new(Mutex::new(tx)));
    }

    let hook = Accessibility::SetWinEventHook(
      WindowsAndMessaging::EVENT_SYSTEM_FOREGROUND,
      WindowsAndMessaging::EVENT_SYSTEM_FOREGROUND,
      None,
      Some(win_foreground_callback),
      0,
      0,
      WindowsAndMessaging::WINEVENT_OUTOFCONTEXT,
    );
    
    if hook.is_invalid() {
      log::error("failed to install EVENT_SYSTEM_FOREGROUND hook");
      return Err("Failed to install foreground hook".to_string());
    }

    // Store the hook handle for later cleanup
    {
      let mut hook_lock = HOOK_HANDLE.lock().map_err(|e| format!("Failed to lock hook handle: {}", e))?;
      *hook_lock = Some(hook.0 as usize);
    }

    log::info("EVENT_SYSTEM_FOREGROUND hook installed successfully");
    Ok(())
  }
}

pub fn uninstall_foreground_hook() {
  unsafe {
    // Unhook the Windows event hook
    if let Ok(mut hook_lock) = HOOK_HANDLE.lock() {
      if let Some(hook_handle) = hook_lock.take() {
        let hook = Accessibility::HWINEVENTHOOK(hook_handle as *mut std::ffi::c_void);
        let result = Accessibility::UnhookWinEvent(hook);
        if result.as_bool() {
          log::info("Windows event hook unhooked successfully");
        } else {
          log::error("Failed to unhook Windows event hook");
        }
      }
    }
    
    // Clear the sender from global state
    if let Ok(mut sender_lock) = SENDER.lock() {
      *sender_lock = None;
    }
    
    log::info("Foreground hook uninstalled");
  }
}

unsafe extern "system" fn win_foreground_callback(
  _h_win_event_hook: Accessibility::HWINEVENTHOOK,
  _event: u32,
  hwnd: Foundation::HWND,
  _id_object: i32,
  _id_child: i32,
  _dw_event_thread: u32,
  _dwms_event_time: u32,
) {
  // Get the process ID from the window handle
  let mut pid: u32 = 0;
  WindowsAndMessaging::GetWindowThreadProcessId(hwnd, Some(&mut pid));
  
  if pid == 0 {
    // Invalid PID, skip
    return;
  }

  // Get the sender from the global state and send the PID
  // We clone the Arc to extend its lifetime beyond the lock scope
  let sender_arc = {
    let sender_lock = match SENDER.lock() {
      Ok(lock) => lock,
      Err(e) => {
        log::error(&format!("Failed to lock sender in callback: {}", e));
        return;
      }
    };
    
    match sender_lock.as_ref() {
      Some(sender) => sender.clone(),
      None => {
        log::error("Sender not initialized in hook callback");
        return;
      }
    }
  };

  // Send the PID through the channel
  // We use try_send to avoid blocking the Windows message loop
  // The Mutex around the sender ensures messages are sent in order
  let sender = match sender_arc.lock() {
    Ok(s) => s,
    Err(e) => {
      log::error(&format!("Failed to lock sender for sending: {}", e));
      return;
    }
  };

  match sender.try_send(pid) {
    Ok(_) => {
      // Successfully sent
    }
    Err(e) => {
      log::error(&format!("Failed to send PID through channel: {}", e));
    }
  }
}