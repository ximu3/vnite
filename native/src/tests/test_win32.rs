use crate::win32;

#[test]
fn test_get_process_info() {
  let procs = win32::get_all_process();
  for proc in procs {
    println!("full path: {}, pid: {}", proc.full_path, proc.pid)
  }
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

#[test]
fn test_nt_path() {
  let dos_path = win32::nt_to_dos_path(r"\Device\HarddiskVolume3\Program Files\rustup\rustc.exe");
  if let Some(path) = dos_path {
    println!("DOS path: {}", path)
  }
}
