#![cfg_attr(not(test), windows_subsystem = "windows")]

mod daemon;

#[tokio::main(flavor = "current_thread")]
async fn main() {
  if daemon::run().await.is_err() {
    // No console and no credential-bearing command line in logs. The host
    // observes startup failure through the protocol or connection timeout.
    std::process::exit(1);
  }
}
