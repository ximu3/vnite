#![allow(dead_code)]

use napi::threadsafe_function::ThreadsafeFunctionCallMode;
use std::sync::OnceLock;
use tokio::sync::mpsc;

use crate::utils::types::NapiWeakThreadsafeFunction;

pub enum LogMsg {
  Info { msg: String },
  Error { msg: String },
}

struct Logger {
  rcv_task: tokio::task::JoinHandle<()>,
  tx: mpsc::Sender<LogMsg>,
}

static LOGGER: OnceLock<Logger> = OnceLock::new();

pub async fn init_logger(
  fn_info: NapiWeakThreadsafeFunction<String, ()>,
  fn_err: NapiWeakThreadsafeFunction<String, ()>,
) {
  if LOGGER.get().is_some() {
    return;
  }

  let (tx, mut rx) = mpsc::channel::<LogMsg>(32);
  let handle = tokio::spawn(async move {
    while let Some(data) = rx.recv().await {
      match data {
        LogMsg::Info { msg } => {
          fn_info.call(
            Ok(format!("[Native] {}", msg)),
            ThreadsafeFunctionCallMode::NonBlocking,
          );
        }
        LogMsg::Error { msg } => {
          fn_err.call(
            Ok(format!("[Native] {}", msg)),
            ThreadsafeFunctionCallMode::NonBlocking,
          );
        }
      }
    }
  });
  LOGGER.get_or_init(|| Logger {
    rcv_task: handle,
    tx: tx,
  });
  info("Logger setup completed");
}

pub fn stop_logger() {
  if let Some(logger) = LOGGER.get() {
    // no need to do cleanups, it's OK to abort
    logger.rcv_task.abort();
  }
}

pub fn info(msg: &str) {
  if let Some(logger) = LOGGER.get() {
    let _ = logger.tx.try_send(LogMsg::Info {
      msg: msg.to_string(),
    });
  } else {
    println!(
      "[{}] {msg}",
      chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.6f")
    );
  }
}

pub fn error(msg: &str) {
  if let Some(logger) = LOGGER.get() {
    let _ = logger.tx.try_send(LogMsg::Error {
      msg: msg.to_string(),
    });
  } else {
    eprintln!(
      "[{}] {msg}",
      chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.6f")
    );
  }
}

pub fn debug(msg: &str) {
  println!(
    "[{}] [DEBUG] {}",
    chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.6f"),
    msg
  );
}
