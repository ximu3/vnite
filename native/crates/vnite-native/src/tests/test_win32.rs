use crate::win32;

#[test]
fn test_get_process_path() {
  assert_eq!(
    win32::query_process_path_by_pid(std::process::id()).unwrap(),
    std::env::current_exe().unwrap().to_string_lossy()
  );
  assert!(win32::query_process_path_by_pid(0).is_err());
}

#[test]
fn test_send_notification() {
  win32::send_notification(
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
