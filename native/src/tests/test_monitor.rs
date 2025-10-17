use crate::monitor;

#[tokio::test]
async fn test_monitor() {
  monitor::start_monitoring(
    vec![r"c:\program files\windowsapps\microsoft.windowscalculator_11.2502.2.0_x64__8wekyb3d8bbwe\calculatorapp.exe".to_string(),
    r"C:\Program Files\WindowsApps\Microsoft.WindowsNotepad_11.2507.26.0_x64__8wekyb3d8bbwe\Notepad\Notepad.exe".to_string()], 
    vec!["123456-abcdef".to_string()],
    None
  ).await;
  tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
  monitor::stop_monitoring().await;
}
