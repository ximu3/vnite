#[test]
fn test_get_process_info() {
  let procs = crate::win32::get_all_process();
  for proc in procs {
    println!("full path: {}, pid: {}", proc.full_path, proc.pid)
  }
}

#[test]
fn test_send_notification() {
  crate::win32::send_notification(
    "vnite".to_string(),
    Some("Notification Title".to_string()),
    Some("Line 1".to_string()),
    Some("Line 2".to_string()),
    None,
    Some(false),
  );

  crate::win32::send_notification(
    "vnite".to_string(),
    Some("Notification Title2".to_string()),
    Some("Line 1".to_string()),
    Some("Line 2".to_string()),
    Some(r"c:\\test.webp".to_string()),
    Some(false),
  );
}
