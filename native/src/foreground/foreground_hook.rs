use std::sync::Mutex;
use tokio::sync::mpsc;
use windows::{
  core,
  Win32::{
    Foundation,
    System::Threading,
    UI::{Accessibility, WindowsAndMessaging},
  },
};

use crate::log;

// the foreground PID sender half
static SENDER: Mutex<Option<mpsc::Sender<u32>>> = Mutex::new(None);
// the hook thread (with message loop activated) handle
static HOOK_THREAD: Mutex<Option<std::thread::JoinHandle<()>>> = Mutex::new(None);
// the underlying platform’s notion of the hook thread identifier
static HOOK_THREAD_OS_ID: Mutex<Option<u32>> = Mutex::new(None);

pub fn install_foreground_hook(tx: mpsc::Sender<u32>) -> Result<(), String> {
  if let (Ok(sender), Ok(thread), Ok(thread_id)) =
    (SENDER.lock(), HOOK_THREAD.lock(), HOOK_THREAD_OS_ID.lock())
  {
    if sender.is_some() || thread.is_some() || thread_id.is_some() {
      return Err("foreground hook is already installed, skip installation".to_string());
    }
  } else {
    return Err("failed to lock foreground hook static variables".to_string());
  }

  {
    let mut sender_guard = SENDER
      .lock()
      .map_err(|e| format!("failed to lock sender: {}", e))?;
    *sender_guard = Some(tx);
  }

  {
    let mut hook_guard = HOOK_THREAD
      .lock()
      .map_err(|e| format!("failed to lock hook thread handle: {}", e))?;

    *hook_guard = Some(std::thread::spawn(move || unsafe {
      if let Ok(mut thread_id_guard) = HOOK_THREAD_OS_ID.lock() {
        *thread_id_guard = Some(Threading::GetCurrentThreadId());
      } else {
        log::error("failed to lock OS thread id");
        return;
      }
      hook_thread_loop();
    }));
  }

  Ok(())
}

unsafe fn hook_thread_loop() {
  log::info("foreground hook message loop thread was spawned");
  // install hook
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
    return;
  }
  log::info("successfully installed EVENT_SYSTEM_FOREGROUND hook");

  let mut msg = WindowsAndMessaging::MSG::default();
  // start message loop for this thread
  loop {
    let result = WindowsAndMessaging::GetMessageW(&mut msg, None, 0, 0);
    // WM_QUIT received
    if result.0 == 0 {
      log::info("foreground hook thread received a WM_QUIT, stopping message loop");
      break;
    } else if result.0 == -1 {
      // handle errors
      let err = Foundation::GetLastError();
      let hres = core::HRESULT::from_win32(err.0);
      log::error(format!("failed to GetMessageW: {} (0x{:X})", hres.message(), err.0).as_str());
      break;
    }
    // dispatch messages
    let _ = WindowsAndMessaging::TranslateMessage(&msg);
    WindowsAndMessaging::DispatchMessageW(&msg);
  }

  // uninstall hook after receiving WM_QUIT (or errors occurred)
  let result = Accessibility::UnhookWinEvent(hook);
  match result.ok() {
    Ok(_) => {
      log::info("successfully uninstalled EVENT_SYSTEM_FOREGROUND hook");
    }
    Err(err) => {
      log::error(
        format!(
          "failed to unhook EVENT_SYSTEM_FOREGROUND: {} (0x{:X})",
          err.message(),
          err.code().0
        )
        .as_str(),
      );
    }
  }
}

pub fn uninstall_foreground_hook() {
  unsafe {
    // send WM_QUIT message to hook thread's message queue
    if let Ok(mut thread_id_guard) = HOOK_THREAD_OS_ID.lock() {
      if let Some(thread_id) = thread_id_guard.take() {
        let result = WindowsAndMessaging::PostThreadMessageW(
          thread_id,
          WindowsAndMessaging::WM_QUIT,
          Foundation::WPARAM::default(),
          Foundation::LPARAM::default(),
        );
        log::info("WM_QUIT message has been sent to the foreground hook thread");
        if let Err(err) = result {
          log::error(
            format!(
              "failed to post WM_QUIT message to hook thread: {} (0x{:X})",
              err.message(),
              err.code().0
            )
            .as_str(),
          );
        }
      }
    }
  }

  // wait until hook thread terminates
  if let Ok(mut thread_guard) = HOOK_THREAD.lock() {
    if let Some(thread) = thread_guard.take() {
      let _ = thread.join();
      log::info("foreground hook thread has been terminated");
    }
  }

  // clear the sender from global state
  if let Ok(mut sender_lock) = SENDER.lock() {
    *sender_lock = None;
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
  // lock the mutex first to avoid race condition
  let sender_guard = match SENDER.lock() {
    Ok(s) => s,
    Err(err) => {
      log::error(&format!("failed to lock sender for sending: {:?}", err));
      return;
    }
  };

  // ignore non-visible windows (e.g. TaskSwitcher, MultitaskingViewFrame)
  if !WindowsAndMessaging::IsWindowVisible(hwnd).as_bool() {
    return;
  }

  // UWP applications have a different window hierarchy from regular desktop applications,
  // which requires multiple iterations to obtain their final child window PID. (see function
  // `get_actual_foreground_pid`)
  // For that reason it consumes 2-5x computing time to get a UWP application window's PID
  // compared to a regular application (about 0.09ms vs 0.4ms on my test environment). Typically
  // game windows are just regular desktop applications, so we simply ignore UWP applications
  // as a trade-off between functionality and efficiency.
  let mut pid: u32 = 0;
  let _ = WindowsAndMessaging::GetWindowThreadProcessId(hwnd, Some(&mut pid));

  let sender = match &*sender_guard {
    Some(s) => s,
    None => {
      log::error("no sender in foreground callback");
      return;
    }
  };

  match sender.try_send(pid) {
    Err(err) => {
      log::error(&format!("failed to send PID through channel: {:?}", err));
    }
    Ok(_) => {}
  }
}

/// Get the foreground window's actual process ID.
///
/// For regular desktop apps: Returns PID directly from window handle (1 API call)
/// For UWP apps: Checks first visible child window with different PID (typically 1-6 iterations)
/// 
/// This function is not used now but is retained here for potential future use.
#[allow(dead_code)]
unsafe fn get_actual_foreground_pid(hwnd: Foundation::HWND) -> u32 {
  // get the PID from the window handle
  let mut pid: u32 = 0;
  let _ = WindowsAndMessaging::GetWindowThreadProcessId(hwnd, Some(&mut pid));

  // for UWP apps, check if there's a child window with a different PID
  let mut child_hwnd = WindowsAndMessaging::FindWindowExW(Some(hwnd), None, None, None)
    .unwrap_or(Foundation::HWND::default());

  while !child_hwnd.is_invalid() {
    let mut child_pid: u32 = 0;
    let _ = WindowsAndMessaging::GetWindowThreadProcessId(child_hwnd, Some(&mut child_pid));

    // if we found a visible child window with a different PID, that's the actual app
    if child_pid != 0
      && child_pid != pid
      && WindowsAndMessaging::IsWindowVisible(child_hwnd).as_bool()
    {
      return child_pid;
    }

    // if not, get next child window
    child_hwnd = WindowsAndMessaging::FindWindowExW(Some(hwnd), Some(child_hwnd), None, None)
      .unwrap_or(Foundation::HWND::default());
  }

  // no child with different PID found, return the original PID
  pid
}
