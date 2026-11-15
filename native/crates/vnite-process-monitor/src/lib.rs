//! Process monitoring independent of game matching and Node-API.

use std::{future::Future, pin::Pin, sync::Arc};

mod etw_monitor;
mod events;
mod log;
mod polling_monitor;
pub mod win32;

// Deprecated WMI sources are retained in wmi_monitor/ outside the module tree.
// Replacement and rationale: https://github.com/ximu3/vnite/pull/520

pub use etw_monitor::EtwMonitor;
pub use events::{ProcessInfo, ProcessMessage, ProcessStatus};
pub use log::{LogLevel, Logger};
pub use polling_monitor::PollingMonitor;

pub trait WinProcessMonitor: Send {
  fn start_monitoring(&mut self) -> windows_core::Result<()>;
  fn stop_monitoring(&mut self);
  fn manual_update_process_status(&mut self);
}

/// The host supplies game matching; monitors retain their existing receiver tasks.
pub type ProcessHandler =
  Arc<dyn Fn(ProcessMessage) -> Pin<Box<dyn Future<Output = ()> + Send>> + Send + Sync>;

#[cfg(test)]
mod tests;
