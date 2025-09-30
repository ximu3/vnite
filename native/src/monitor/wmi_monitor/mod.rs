use tokio::{
  sync::{broadcast, mpsc, Mutex},
  task,
};

use crate::monitor::ProcessInfo;
use crate::{log, monitor::gm};

mod wmi_async;

const CHANNEL_SIZE: usize = 64;

pub struct WmiMonitor {
  /// Monitoring tasks
  background_tasks: Mutex<Option<task::JoinSet<()>>>,

  /// Termination signal sender used for gracefully stop monitoring tasks.
  /// A `watch` channel would be preferred, but tokio crate doesn't give
  /// it a `fn blocking_recv()` which makes it of no use to us, given the fact that we
  /// have many `!Send` COM objects in our background thread.
  term_sender: Mutex<Option<broadcast::Sender<bool>>>,
}

impl WmiMonitor {
  pub fn new() -> Self {
    WmiMonitor {
      background_tasks: Mutex::new(None),
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

    let mut tasks: task::JoinSet<()> = task::JoinSet::new();

    // spawn and hold a new thread to send messages
    tasks.spawn_blocking(move || {
      log::info("ProcMonitor tx channel has been spawned");
      unsafe {
        if let Err(e) = wmi_async::wmi_event_monitor(t_rx, tx) {
          log::error("ProcMonitor tx channel received a WMI error");
          log::error(e.to_string().as_str());
          log::error("ProcMonitor tx channel has been accidentally stopped");
        }
      }
      log::info("ProcMonitor tx channel has been stopped");
    });

    // spawn and hold a new task to receive messages
    tasks.spawn(async move {
      log::info("ProcMonitor rx channel has been spawned");
      loop {
        tokio::select! {
          _ = t_rx2.recv() => {
            log::info("ProcMonitor rx channel has been stopped");
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
    *self.background_tasks.lock().await = Some(tasks);
  }

  pub async fn stop_monitoring(&self) {
    // take ownership of TERM_SENDER and broadcast a termination signal
    if let Some(sender) = self.term_sender.lock().await.take() {
      let _ = sender.send(true);
    }

    // spare tasks with 3 seconds to do cleanups and shutdown, otherwise forcefully abort them
    if let Some(mut tasks) = self.background_tasks.lock().await.take() {
      match tokio::time::timeout(tokio::time::Duration::from_secs(3), async {
        while let Some(res) = tasks.join_next().await {
          if let Err(e) = res {
            log::error(&format!("failed to wait tasks shutdown: {:?}", e));
          }
        }
      })
      .await
      {
        Ok(_) => {
          log::info("monitoring tasks have been shutdown gracefully");
        }
        Err(_) => {
          tasks.abort_all();
          log::info("timeout, forcefully shutdown monitoring tasks");
        }
      }
    }
  }

  async fn recv_notification(msg: ProcessInfo) {
    gm::get().lock().await.handle_message(msg);
  }
}
