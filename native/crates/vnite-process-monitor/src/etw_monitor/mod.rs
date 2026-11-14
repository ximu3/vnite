use tokio::{sync::mpsc, task};

use crate::{win32, Logger, ProcessHandler, ProcessMessage, WinProcessMonitor};

mod etw_trace;

const CHANNEL_SIZE: usize = 64;
const TRACE_SESSION_NAME: &'static str = "Vnite Process Monitor";

pub struct EtwMonitor {
  tracer: Option<etw_trace::EtwTrace>,
  rx_handle: Option<task::JoinHandle<()>>,
  term_sender: Option<mpsc::Sender<()>>,
  process_handler: ProcessHandler,
  logger: Logger,
}

impl EtwMonitor {
  pub fn new(process_handler: ProcessHandler, logger: Logger) -> Self {
    Self {
      tracer: None,
      rx_handle: None,
      term_sender: None,
      process_handler,
      logger,
    }
  }

  async fn rx_task(
    mut rx: mpsc::Receiver<ProcessMessage>,
    mut t_rx: mpsc::Receiver<()>,
    process_handler: ProcessHandler,
    logger: Logger,
  ) {
    logger.info("ETW monitor rx channel has been spawned");
    loop {
      tokio::select! {
        op_data = rx.recv() => {
          if let Some(mut data) = op_data {
            // log::info(format!("[FROM RX] pid: {}, path: {}, type: {:?}", data.pid, data.path, data.status).as_str());
            let dos_path = win32::nt_to_dos_path(&data.path);
            match dos_path {
              Some(path) => {
                data.path = path;
              }
              None => { }
            }
            process_handler(data).await;
          } else {
            logger.error("ETW monitor rx channel accidentally stopped, likely caused by termination of the tx half");
            break;
          }
        }
        _ = t_rx.recv() => {
          // termination signal received
          break;
        }
      }
    }
  }
}

impl WinProcessMonitor for EtwMonitor {
  fn start_monitoring(&mut self) -> windows_core::Result<()> {
    self.logger.info("ETW monitor is starting...");
    // stop existing trace session
    self.stop_monitoring();

    // termination signal channel
    let (t_tx, t_rx) = mpsc::channel::<()>(1);
    // ProcessMessage channel
    let (tx, rx) = mpsc::channel::<ProcessMessage>(CHANNEL_SIZE);

    // create a EtwTrace and start tracing
    let mut tracer = etw_trace::EtwTrace::new(TRACE_SESSION_NAME, self.logger.clone());
    tracer.start_trace()?;
    tracer.consume_events(tx)?;

    // spawn a rx_task to handle process event message
    let rx_handle = tokio::spawn(Self::rx_task(
      rx,
      t_rx,
      self.process_handler.clone(),
      self.logger.clone(),
    ));

    // transfer the ownership of objects to self
    self.tracer = Some(tracer);
    self.rx_handle = Some(rx_handle);
    self.term_sender = Some(t_tx);

    Ok(())
  }

  fn stop_monitoring(&mut self) {
    // send a termination signal to rx task
    if let Some(t_sender) = self.term_sender.take() {
      let _ = t_sender.try_send(());
    }

    // ...or just abort it, since there is actually no cleanups need to do
    if let Some(rx_handle) = self.rx_handle.take() {
      rx_handle.abort();
      self.logger.info("ETW monitor rx channel has been aborted");
    }

    // spare rx task with 1 second to shutdown or forcefully abort it
    // if let Some(rx_handle) = self.rx_handle.take() {
    //   let abort_handle = rx_handle.abort_handle();
    //   if tokio::time::timeout(tokio::time::Duration::from_secs(1), rx_handle)
    //     .await
    //     .is_err()
    //   {
    //     abort_handle.abort();
    //     log::info("forcefully shutdown ETW monitor rx channel");
    //   }
    // }

    // stop ETW trace session
    if let Some(mut tracer) = self.tracer.take() {
      let _ = tracer.stop_trace(true);
    }
  }

  fn manual_update_process_status(&mut self) {
    // do nothing since the ETW monitor will automatically update process status very quickly after process creation/termination events
  }
}

impl Drop for EtwMonitor {
  fn drop(&mut self) {
    self.stop_monitoring();
  }
}
