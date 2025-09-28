#[tokio::test]
async fn test_monitoring() {
  crate::monitor::start_monitoring(
    vec![r"c:\program files\windowsapps\microsoft.windowscalculator_11.2502.2.0_x64__8wekyb3d8bbwe\calculatorapp.exe".to_string()], 
    None
  ).await;
  tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
  crate::monitor::stop_monitoring().await;
}
