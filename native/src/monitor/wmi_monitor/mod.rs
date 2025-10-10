use tokio::{
  sync::{broadcast, mpsc, Mutex},
  task,
};

use crate::monitor::ProcessInfo;
use crate::{log, monitor::gm};

mod wmi_async;

const CHANNEL_SIZE: usize = 64;

pub struct WmiMonitor {
  /// Process monitor rx half (managed by tokio runtime)
  rx_task: Mutex<Option<task::JoinHandle<()>>>,

  /// Process monitor tx half (managed by OS thread)
  tx_task: Mutex<Option<std::thread::JoinHandle<()>>>,

  /// Termination signal sender used for gracefully stop monitoring tasks.
  /// A `watch` channel would be preferred, but tokio crate doesn't give
  /// it a `fn blocking_recv()` which makes it of no use to us, given the fact that we
  /// have many `!Send` COM objects in our background thread.
  term_sender: Mutex<Option<broadcast::Sender<bool>>>,
}

impl WmiMonitor {
  pub fn new() -> Self {
    WmiMonitor {
      rx_task: Mutex::new(None),
      tx_task: Mutex::new(None),
      term_sender: Mutex::new(None),
    }
  }

  pub async fn start_monitoring(&self) {
    log::info("start process monitoring...");
    // terminate existing monitoring tasks if any
    self.stop_monitoring().await;

    let (t_tx, t_rx) = broadcast::channel::<bool>(1);
    let mut t_rx2 = t_tx.subscribe();
    *self.term_sender.lock().await = Some(t_tx);

    // monitor channel
    let (tx, mut rx) = mpsc::channel::<ProcessInfo>(CHANNEL_SIZE);

    // Spawn an OS managed thread instead of a tokio runtime managed thread.
    // Spawning an async thread doesn't work because there are many `!Send` COM objects used in the
    // WMI monitor.
    // Spawning a blocking thread that managed by tokio runtime by using `tokio::task::spawn_blocking()`
    // also will cause problem, making Node event loop remain alive that prevents application from being
    // terminated completely. This appears to be a bug in NAPI-RS itself.
    let tx_task = std::thread::spawn(move || unsafe {
      log::info("ProcMonitor tx channel has been spawned");
      if let Err(e) = wmi_async::wmi_event_monitor(t_rx, tx) {
        log::error("ProcMonitor tx channel received a WMI error");
        log::error(e.to_string().as_str());
        log::error("ProcMonitor tx channel has been accidentally stopped");
      } else {
        log::info("ProcMonitor tx channel has been gracefully stopped");
      }
    });

    // spawn and hold a new task to receive messages
    let rx_task = tokio::spawn(async move {
      log::info("ProcMonitor rx channel has been spawned");
      loop {
        tokio::select! {
          _ = t_rx2.recv() => {
            log::info("ProcMonitor rx channel has been gracefully stopped");
            break;
          }
          op_data = rx.recv() => {
            if let Some(data) = op_data {
              // log::info(format!("rcv a message: path: {}, pid: {}, status: {:?}", data.path, data.pid, data.status).as_str());
              Self::recv_notification(data).await;
            } else {
              log::error("ProcMonitor rx channel accidentally stopped, likely caused by termination of the tx half");
              break;
            }
          }
        }
      }
    });

    // keep a stub of all tasks running in background
    *self.tx_task.lock().await = Some(tx_task);
    *self.rx_task.lock().await = Some(rx_task);
  }

  pub async fn stop_monitoring(&self) {
    // take ownership of TERM_SENDER and broadcast a termination signal
    if let Some(sender) = self.term_sender.lock().await.take() {
      let _ = sender.send(true);
    }

    // spare rx task with 1 seconds to do cleanups and shutdown, otherwise forcefully abort it
    if let Some(rx_task) = self.rx_task.lock().await.take() {
      let abort_handle = rx_task.abort_handle();
      match tokio::time::timeout(tokio::time::Duration::from_secs(1), rx_task).await {
        Ok(_) => {}
        Err(_) => {
          abort_handle.abort();
          log::info("forcefully shutdown ProcMonitor rx channel");
        }
      }
    }
  }

  async fn recv_notification(msg: ProcessInfo) {
    gm::get().lock().await.handle_message(msg);
  }
}
