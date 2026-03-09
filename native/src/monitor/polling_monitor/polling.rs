use std::collections::HashMap;

use tokio::sync::mpsc;

use crate::monitor::{ProcessMessage, ProcessStatus};
use crate::{log, win32};

pub struct Polling {
  tx: mpsc::Sender<ProcessMessage>,
  process_cache: HashMap<u32, ProcessInfo>,
}

struct ProcessInfo {
  pid: u32,
  path: String,
  accessible: bool,
  pinned: bool,
}

impl Polling {
  pub fn new(tx: mpsc::Sender<ProcessMessage>) -> Self {
    Self {
      tx: tx,
      process_cache: HashMap::with_capacity(256usize),
    }
  }

  /// Update process cache. This function is designed to be invoked at a specific interval
  pub async fn update_process_status(&mut self) {
    // mark all processes as unpinned before updating
    self.process_cache.iter_mut().for_each(|(_, process)| {
      process.pinned = false;
    });

    // get all processes and update cache, new processes will be marked as pinned, while old processes that are not found will be removed later
    for pid in win32::get_all_process_pid() {
      if let Some(process) = self.process_cache.get_mut(&pid) {
        // an existing process is found, mark it as pinned
        process.pinned = true;
      } else {
        // a new process is found, add it to cache and mark it as pinned
        let path = win32::get_process_full_path_by_pid(pid);
        let accessible = !path.is_empty();
        self.process_cache.insert(
          pid,
          ProcessInfo {
            pid,
            path: path.clone(),
            accessible: accessible,
            pinned: true,
          },
        );
        // send process start message if the process is accessible
        if accessible {
          match self
            .tx
            .send(ProcessMessage {
              pid: pid,
              status: ProcessStatus::Started,
              path: path,
            })
            .await
          {
            Err(e) => {
              log::error(format!("failed to send a process info, pid: {}: {:?}", pid, e).as_str());
            }
            Ok(()) => {}
          }
        }
      }
    }

    // send process termination message for unpinned processes
    for (_, process) in self.process_cache.iter() {
      if !process.pinned && process.accessible {
        match self
          .tx
          .send(ProcessMessage {
            pid: process.pid,
            status: ProcessStatus::Terminated,
            path: process.path.clone(),
          })
          .await
        {
          Err(e) => {
            log::error(
              format!(
                "failed to send a process termination info, pid: {}: {:?}",
                process.pid, e
              )
              .as_str(),
            );
          }
          Ok(()) => {}
        }
      }
    }

    // remove unpinned processes and send process termination message
    self
      .process_cache
      .retain(|_, process: &mut ProcessInfo| process.pinned);
  }
}
