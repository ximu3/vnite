#[test]
fn test_get_process_info() {
  let procs = crate::win32::process::get_all_process();
  for proc in procs {
    println!("full path: {}, pid: {}", proc.full_path, proc.pid)
  }
}
