use std::sync::Mutex;

use crate::log;
use crate::monitor::gm;
use crate::utils::types::NapiWeakThreadsafeFunction;

mod foreground_hook;

const CHANNEL_SIZE: usize = 64;

static RX_HANDLE: Mutex<Option<tokio::task::JoinHandle<()>>> = Mutex::new(None);

pub async fn install_hook(
  callback: Option<NapiWeakThreadsafeFunction<String, ()>>,
  wait_time: Option<u32>,
) {
  // uninstall existing hook
  uninstall_hook().await;

  let (tx, rx) = tokio::sync::mpsc::channel::<u32>(CHANNEL_SIZE);

  // install hook
  let result = foreground_hook::install_foreground_hook(tx);
  if let Err(err) = result {
    log::error(err.as_str());
    log::error("failed to install foreground hook");
    return;
  }

  // spawn receiver thread
  let rx_handle = tokio::spawn(rx_task(rx));

  if let Ok(mut handle_guard) = RX_HANDLE.lock() {
    *handle_guard = Some(rx_handle);
  }

  gm::get().lock().await.set_foreground_callback(callback);
  if let Some(t) = wait_time {
    gm::get().lock().await.set_foreground_wait_time(t as u64);
  }
}

pub async fn uninstall_hook() {
  // uninstall hook
  foreground_hook::uninstall_foreground_hook();
  // clear callback
  gm::get().lock().await.unset_foreground_callback();
  // clear rx_handle global variable
  if let Ok(mut handle_guard) = RX_HANDLE.lock() {
    if let Some(handle) = handle_guard.take() {
      handle.abort();
      log::info("foreground hook rx channel has been aborted");
    }
  }
}

async fn rx_task(mut rx: tokio::sync::mpsc::Receiver<u32>) {
  log::info("foreground hook rx channel has been spawned");
  loop {
    let option_data = rx.recv().await;
    if let Some(data) = option_data {
      gm::get().lock().await.handle_foreground_message(data);
    } else {
      log::error("foreground hook rx channel accidentally stopped, likely caused by termination of the tx half");
      break;
    }
  }
}

pub async fn set_foreground_wait_time(wait_time: u32) {
  gm::get().lock().await.set_foreground_wait_time(wait_time as u64);
}
