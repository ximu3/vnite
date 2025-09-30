use napi::bindgen_prelude::*;
use napi_derive::napi;

use std::collections::HashSet;
use std::error::Error;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use windows::{
  core::{w, PCWSTR},
  Win32::{
    Foundation::{HWND, LPARAM, WPARAM},
    System::{
      Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
        TH32CS_SNAPPROCESS,
      },
      Threading::{GetCurrentThreadId, OpenProcess, PROCESS_QUERY_INFORMATION},
    },
    UI::{
      Accessibility::{SetWinEventHook, UnhookWinEvent, HWINEVENTHOOK},
      WindowsAndMessaging::{
        GetWindowTextW, GetWindowThreadProcessId, EVENT_SYSTEM_FOREGROUND, WINEVENT_OUTOFCONTEXT,
      },
    },
  },
};

async fn my_func() {
  // do something...
}

fn install_hook() {
  let hook = SetWinEventHook(
    EVENT_SYSTEM_FOREGROUND,
    EVENT_SYSTEM_FOREGROUND,
    None,
    Some(Self::win_event_proc),
    0,
    0,
    WINEVENT_OUTOFCONTEXT,
  );
  // TODO
}

unsafe extern "system" fn win_event_proc(
  _h_win_event_hook: HWINEVENTHOOK,
  event: u32,
  hwnd: HWND,
  _id_object: i32,
  _id_child: i32,
  _dw_event_thread: u32,
  _dwms_event_time: u32,
) {
  tokio::spawn(my_func());
  // TODO
  // spawn a concurrency without waiting to not block system
}
