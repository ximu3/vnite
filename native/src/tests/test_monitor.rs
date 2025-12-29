use crate::foreground;
use crate::monitor;

#[tokio::test]
async fn test_monitor() {
  monitor::start_monitoring(
    vec![r"c:\program files\cmake\bin\cmake-gui.exe".to_string()], 
    vec!["123456-abcdef".to_string()],
    None
  ).await;
  tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
  let is_running = monitor::gm::get().lock().await.is_running("C:\\Program Files\\CMake\\bin", Some(true));
  println!("is running: {}", is_running);
  monitor::stop_monitoring().await;
}

#[tokio::test]
async fn test_foreground_hook() {
  monitor::start_monitoring(
    vec![r"c:\program files\cmake\bin\cmake-gui.exe".to_string()], 
    vec!["123456-abcdef".to_string()],
    None
  ).await;
  foreground::install_hook(None, None).await;

  tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
  foreground::uninstall_hook().await;
  monitor::stop_monitoring().await;
}
