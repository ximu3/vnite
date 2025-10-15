use tokio::{
  sync::{broadcast, mpsc},
  task,
};

use crate::monitor::{ProcessMessage, WinProcessMonitor};
use crate::{log, monitor::gm};

mod wmi_async;

const CHANNEL_SIZE: usize = 64;

pub struct WmiMonitor {
  /// Process monitor rx half (managed by tokio runtime)
  rx_handle: Option<task::JoinHandle<()>>,

  /// Process monitor tx half (managed by OS thread)
  tx_handle: Option<std::thread::JoinHandle<()>>,

  /// Termination signal sender used for gracefully stop monitoring tasks.
  /// A `watch` channel would be preferred, but tokio crate doesn't give
  /// it a `fn blocking_recv()` which makes it of no use to us, given the fact that we
  /// have many `!Send` COM objects in our background thread.
  term_sender: Option<broadcast::Sender<()>>,
}

impl WmiMonitor {
  pub fn new() -> Self {
    WmiMonitor {
      rx_handle: None,
      tx_handle: None,
      term_sender: None,
    }
  }

  fn tx_task(t_rx: broadcast::Receiver<()>, tx: mpsc::Sender<ProcessMessage>) {
    log::info("WMI monitor tx channel has been spawned");
    unsafe {
      if let Err(e) = wmi_async::wmi_event_monitor(t_rx, tx) {
        log::error("WMI monitor tx channel received a WMI error");
        log::error(e.to_string().as_str());
        log::error("WMI monitor tx channel has been accidentally stopped");
      } else {
        log::info("WMI monitor tx channel has been gracefully stopped");
      }
    }
  }

  async fn rx_task(mut t_rx: broadcast::Receiver<()>, mut rx: mpsc::Receiver<ProcessMessage>) {
    log::info("WMI monitor rx channel has been spawned");
    loop {
      tokio::select! {
        _ = t_rx.recv() => {
          // termination signal received
          break;
        }
        op_data = rx.recv() => {
          if let Some(data) = op_data {
            // log::info(format!("rcv a message: path: {}, pid: {}, status: {:?}", data.path, data.pid, data.status).as_str());
            gm::get().lock().await.handle_wmi_message(data);
          } else {
            log::error("WMI monitor rx channel accidentally stopped, likely caused by termination of the tx half");
            break;
          }
        }
      }
    }
  }
}

impl WinProcessMonitor for WmiMonitor {
  fn start_monitoring(&mut self) -> Result<(), windows_core::Error> {
    log::info("WMI monitor is starting...");
    // terminate existing monitoring tasks if any
    self.stop_monitoring();

    // termination signal channel
    let (t_tx, t_rx) = broadcast::channel::<()>(1);
    let t_rx2 = t_tx.subscribe();
    self.term_sender = Some(t_tx);

    // monitor channel
    let (tx, rx) = mpsc::channel::<ProcessMessage>(CHANNEL_SIZE);

    // Spawn an OS managed thread instead of a tokio runtime managed thread.
    // Spawning an async thread doesn't work because there are many `!Send` COM objects used in the
    // WMI monitor.
    // Spawning a blocking thread that managed by tokio runtime by using `tokio::task::spawn_blocking()`
    // also will cause problem, making Node event loop remain alive that prevents application from being
    // terminated completely. This appears to be a bug in NAPI-RS itself.
    let tx_handle = std::thread::spawn(|| Self::tx_task(t_rx, tx));

    // spawn and hold a new task to receive messages
    let rx_handle = tokio::spawn(Self::rx_task(t_rx2, rx));

    // keep a stub of all tasks running in background
    self.tx_handle = Some(tx_handle);
    self.rx_handle = Some(rx_handle);

    Ok(())
  }

  fn stop_monitoring(&mut self) {
    // take ownership of TERM_SENDER and broadcast a termination signal
    if let Some(sender) = self.term_sender.take() {
      let _ = sender.send(());
    }

    // rx_task is safe to abort, no cleanups need to do
    if let Some(rx_handle) = self.rx_handle.take() {
      rx_handle.abort();
      log::info("WMI monitor rx channel has been aborted");
    }
  }
}

impl Drop for WmiMonitor {
  fn drop(&mut self) {
    self.stop_monitoring();
  }
}
