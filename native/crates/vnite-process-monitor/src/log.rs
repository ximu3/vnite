use std::sync::Arc;

#[derive(Clone, Copy, Debug)]
pub enum LogLevel {
  Info,
  Error,
  Debug,
}

/// Logging is supplied by the host, so the collector has no Node-API dependency.
#[derive(Clone)]
pub struct Logger(Arc<dyn Fn(LogLevel, &str) + Send + Sync>);

impl Logger {
  pub fn new(callback: impl Fn(LogLevel, &str) + Send + Sync + 'static) -> Self {
    Self(Arc::new(callback))
  }

  pub(crate) fn info(&self, message: &str) {
    (self.0)(LogLevel::Info, message);
  }
  pub(crate) fn error(&self, message: &str) {
    (self.0)(LogLevel::Error, message);
  }
  pub(crate) fn debug(&self, message: &str) {
    (self.0)(LogLevel::Debug, message);
  }
}

