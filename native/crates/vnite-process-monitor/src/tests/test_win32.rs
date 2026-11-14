use crate::win32;

#[test]
fn test_nt_path() {
  let dos_path = win32::nt_to_dos_path(r"\Device\HarddiskVolume3\Program Files\rustup\rustc.exe");
  if let Some(path) = dos_path {
    println!("DOS path: {}", path)
  }
}
