#![allow(dead_code)]

use std::sync::OnceLock;
use tokio::runtime::Runtime;

static RUNTIME: OnceLock<Runtime> = OnceLock::new();

/// Get tokio runtime seperately from napi-rs's managed one.
///
/// In a plain Rust environment we typically don't need to do this, but in a NAPI-RS
/// environment, unless we explicitly mark a napi function as `async`, or we won't be
/// able to use `tokio` in the entire function including its children, because the
/// function is not managed under the NAPI-RS's inner tokio runtime. So we have to
/// create our own one.
///
/// This is useful when we are in a synchronized scope but want to spawn an async task.
pub fn get() -> &'static Runtime {
  RUNTIME.get_or_init(|| Runtime::new().expect("failed to initialize tokio runtime"))
}
