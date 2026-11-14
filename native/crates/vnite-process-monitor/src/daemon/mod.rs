mod protocol;
mod security;

use protocol::{read_frame, write_frame, Command, VERSION};
use serde_json::{json, Value};
use std::{io::ErrorKind, sync::Arc, time::Duration};
use tokio::{
  sync::mpsc,
  time::{interval_at, timeout, Instant},
};
use vnite_process_monitor::{
  win32, EtwMonitor, LogLevel, Logger, PollingMonitor, ProcessHandler, ProcessMessage,
  ProcessStatus, WinProcessMonitor,
};

type Failure = Box<dyn std::error::Error>;

enum Message {
  Process(ProcessMessage),
  Log(Value),
}

pub async fn run() -> Result<(), Failure> {
  let args: Vec<String> = std::env::args().skip(1).collect();
  let [name, token, parent_pid] = args.as_slice() else {
    return Err("expected pipe name, token and parent PID".into());
  };
  if !name.starts_with(r"\\.\pipe\vnite-monitor-") || token.len() != 64 {
    return Err("invalid launch arguments".into());
  }
  let parent_pid = parent_pid.parse()?;
  let parent = security::open_parent(parent_pid)?;
  let pipe = security::create_pipe(name, &parent)?;
  timeout(Duration::from_secs(15), pipe.connect()).await??;
  security::verify_client(&pipe, &parent, parent_pid)?;
  let (mut reader, mut writer) = tokio::io::split(pipe);
  let mode = match timeout(Duration::from_secs(5), read_frame(&mut reader)).await?? {
    Command::Hello {
      version,
      token: received,
      mode,
    } if version == VERSION && received == *token => mode,
    _ => return Err("invalid handshake".into()),
  };
  let is_elevated = security::elevated()?;

  // A single writer serializes all frames. Process events use backpressure;
  // diagnostic logs may be dropped rather than obstruct process delivery.
  let (tx, mut rx) = mpsc::channel::<Message>(512);
  let event_tx = tx.clone();
  let handler: ProcessHandler = Arc::new(move |event| {
    let tx = event_tx.clone();
    Box::pin(async move {
      // Keep collector updates typed until they are written to the pipe.
      let _ = tx.send(Message::Process(event)).await;
    })
  });
  let logger = Logger::new(move |level, message| {
    let level = match level {
      LogLevel::Info => "info",
      LogLevel::Error => "error",
      LogLevel::Debug => "debug",
    };
    let _ = tx.try_send(Message::Log(
      json!({"type":"log", "level":level, "message":message}),
    ));
  });
  let mut monitor: Box<dyn WinProcessMonitor> = match mode.as_str() {
    "normal" => Box::new(PollingMonitor::new(handler, logger)),
    "enhanced" if is_elevated => Box::new(EtwMonitor::new(handler, logger)),
    _ => return Err("unsupported mode or insufficient privilege".into()),
  };
  // Keep the read future alive across select branches (read_exact is not
  // cancellation safe when a frame has only partially arrived).
  let (commands_tx, mut commands) = mpsc::channel(16);
  tokio::spawn(async move {
    loop {
      let result = read_frame(&mut reader).await;
      let failed = result.is_err();
      if commands_tx.send(result).await.is_err() || failed {
        break;
      }
    }
  });
  // Start collecting before the initial snapshot; queued events follow it.
  monitor.start_monitoring()?;
  let processes = snapshot()?;
  let hello = json!({"type":"hello", "version":VERSION, "token":token,
    "elevated":is_elevated, "processes":processes});
  timeout(Duration::from_secs(5), write_frame(&mut writer, &hello)).await??;
  let period = Duration::from_secs(5);
  let mut snapshots = interval_at(Instant::now() + period, period);
  loop {
    let message = tokio::select! {
      command = commands.recv() => match command {
        Some(Ok(Command::Refresh)) => {
          monitor.manual_update_process_status();
          snapshot_message()
        }
        Some(Ok(_)) => return Err("unexpected command".into()),
        None => break,
        Some(Err(error))
          if matches!(error.kind(), ErrorKind::UnexpectedEof | ErrorKind::BrokenPipe) => break,
        Some(Err(error)) => return Err(error.into()),
      },
      Some(message) = rx.recv() => match message {
        Message::Process(event) => json!({
          "type":"process", "pid":event.pid, "path":event.path,
          "status":if event.status == ProcessStatus::Started {"started"} else {"terminated"}
        }),
        Message::Log(message) => message,
      },
      _ = snapshots.tick(), if mode == "enhanced" => snapshot_message(),
    };
    timeout(Duration::from_secs(5), write_frame(&mut writer, &message)).await??;
  }
  Ok(())
}

fn snapshot_message() -> Value {
  match snapshot() {
    Ok(processes) => json!({"type":"snapshot", "processes":processes}),
    // Enumeration failure must never be published as an empty process list.
    Err(error) => {
      json!({"type":"log", "level":"error", "message":format!("Snapshot failed; retaining game state: {error}")})
    }
  }
}

fn snapshot() -> Result<Vec<Value>, Failure> {
  // Keep every live PID in the snapshot, including those with inaccessible paths.
  Ok(
    win32::get_all_process_pid()?
      .into_iter()
      .map(|pid| json!({"pid":pid, "path":win32::query_process_path_by_pid(pid).unwrap_or_default()}))
      .collect(),
  )
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn snapshots_include_current_process_with_protocol_fields() {
    let processes = snapshot().unwrap();
    let current = processes
      .iter()
      .find(|process| process["pid"] == std::process::id())
      .expect("current process is missing from the snapshot");
    assert!(!current["path"].as_str().unwrap().is_empty());
    for process in processes {
      assert!(process["pid"].is_u64());
      assert!(process["path"].is_string());
    }
  }
}
