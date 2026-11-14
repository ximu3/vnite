use std::sync::Mutex;

use crate::log;
use crate::utils::types::NapiWeakThreadsafeFunction;
use napi::threadsafe_function::ThreadsafeFunctionCallMode;

mod foreground_hook;

const CHANNEL_SIZE: usize = 64;

static RX_HANDLE: Mutex<Option<tokio::task::JoinHandle<()>>> = Mutex::new(None);

pub async fn install_hook(
  callback: Option<NapiWeakThreadsafeFunction<u32, ()>>,
) -> Result<(), String> {
  // uninstall existing hook
  uninstall_hook().await;

  let (tx, rx) = tokio::sync::mpsc::channel::<u32>(CHANNEL_SIZE);

  // install hook
  let result = foreground_hook::install_foreground_hook(tx).await;
  if let Err(err) = result {
    foreground_hook::uninstall_foreground_hook();
    return Err(err);
  }

  // spawn receiver thread
  let rx_handle = tokio::spawn(rx_task(rx, callback));

  if let Ok(mut handle_guard) = RX_HANDLE.lock() {
    *handle_guard = Some(rx_handle);
  }
  Ok(())
}

pub async fn uninstall_hook() {
  // uninstall hook
  foreground_hook::uninstall_foreground_hook();
  // The receiver owns the callback and releases it when aborted.
  // clear rx_handle global variable
  if let Ok(mut handle_guard) = RX_HANDLE.lock() {
    if let Some(handle) = handle_guard.take() {
      handle.abort();
      log::info("foreground hook rx channel has been aborted");
    }
  }
}

async fn rx_task(
  mut rx: tokio::sync::mpsc::Receiver<u32>,
  callback: Option<NapiWeakThreadsafeFunction<u32, ()>>,
) {
  log::info("foreground hook rx channel has been spawned");
  loop {
    let option_data = rx.recv().await;
    if let Some(data) = option_data {
      if let Some(callback) = &callback {
        callback.call(Ok(data), ThreadsafeFunctionCallMode::NonBlocking);
      }
    } else {
      log::error("foreground hook rx channel accidentally stopped, likely caused by termination of the tx half");
      break;
    }
  }
}
