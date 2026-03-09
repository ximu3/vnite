use tokio::{
  sync::{broadcast, mpsc},
  task,
};

use super::{gm, ProcessMessage, WinProcessMonitor};
use crate::log;

mod polling;

const CHANNEL_SIZE: usize = 256;

pub struct PollingMonitor {
  tx_handle: Option<task::JoinHandle<()>>,
  rx_handle: Option<task::JoinHandle<()>>,
  term_sender: Option<broadcast::Sender<()>>,

  manual_update_sender: Option<mpsc::Sender<()>>,
}

impl PollingMonitor {
  pub fn new() -> Self {
    Self {
      tx_handle: None,
      rx_handle: None,
      term_sender: None,
      manual_update_sender: None,
    }
  }

  async fn tx_task(
    tx: mpsc::Sender<ProcessMessage>,
    mut t_rx: broadcast::Receiver<()>,
    mut m_rx: mpsc::Receiver<()>,
  ) {
    log::info("Polling monitor tx channel has been spawned");
    // create a polling object
    let mut polling = polling::Polling::new(tx);
    // update process status immediately once thread is spawned
    polling.update_process_status().await;

    loop {
      tokio::select! {
        // polling every 5 seconds
        _ = tokio::time::sleep(tokio::time::Duration::from_secs(5)) => {
          polling.update_process_status().await;
        }
        // termination signal received
        _ = t_rx.recv() => {
          log::info("Polling monitor tx channel has received a termination signal");
          break;
        }
        // manual update signal received
        _ = m_rx.recv() => {
          polling.update_process_status().await;
        }
      }
    }
  }

  async fn rx_task(mut rx: mpsc::Receiver<ProcessMessage>, mut t_rx: broadcast::Receiver<()>) {
    log::info("Polling monitor rx channel has been spawned");
    loop {
      tokio::select! {
        op_data = rx.recv() => {
          if let Some(data) = op_data {
            // log::info(format!("[FROM RX] pid: {}, path: {}, type: {:?}", data.pid, data.path, data.status).as_str());
            gm::get().lock().await.handle_process_message(data);
          } else {
            log::error("Polling monitor rx channel accidentally stopped, likely caused by termination of the tx half");
            break;
          }
        }
        _ = t_rx.recv() => {
          log::info("Polling monitor rx channel has received a termination signal");
          break;
        }
      }
    }
  }
}

impl WinProcessMonitor for PollingMonitor {
  fn start_monitoring(&mut self) -> windows_core::Result<()> {
    log::info("Polling monitor is starting...");
    // stop existing polling monitor
    self.stop_monitoring();

    // prepare termination signal channel
    let (t_tx, t_rx) = broadcast::channel::<()>(1);
    let t_rx2 = t_tx.subscribe();
    self.term_sender = Some(t_tx);

    // prepare ProcessMessage channel
    let (tx, rx) = mpsc::channel::<ProcessMessage>(CHANNEL_SIZE);
    // manual update sender
    let (m_tx, m_rx) = mpsc::channel::<()>(2);

    // spawn a rx_task to handle process event message
    let rx_handle = tokio::spawn(Self::rx_task(rx, t_rx));
    // spawn a tx_task to start polling
    let tx_handle = tokio::spawn(Self::tx_task(tx, t_rx2, m_rx));

    // transfer the ownership of objects to self
    self.rx_handle = Some(rx_handle);
    self.tx_handle = Some(tx_handle);
    self.manual_update_sender = Some(m_tx);

    Ok(())
  }

  fn stop_monitoring(&mut self) {
    // send a termination signal to rx task
    if let Some(t_sender) = self.term_sender.take() {
      let _ = t_sender.send(());
    }

    // ...or just abort them, since there is actually no cleanups need to do
    if let Some(rx_handle) = self.rx_handle.take() {
      rx_handle.abort();
      log::info("Polling monitor rx channel has been stopped");
    }
    if let Some(tx_handle) = self.tx_handle.take() {
      tx_handle.abort();
      log::info("Polling monitor tx channel has been stopped");
    }
  }

  fn manual_update_process_status(&mut self) {
    self.manual_update_sender.as_ref().map(|sender| {
      let _ = sender.try_send(());
    });
  }
}

impl Drop for PollingMonitor {
  fn drop(&mut self) {
    self.stop_monitoring();
  }
}
