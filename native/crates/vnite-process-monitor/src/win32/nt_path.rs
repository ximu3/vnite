use std::collections::HashMap;
use std::sync::OnceLock;
use windows::core::*;
use windows::Win32::Storage::FileSystem::{GetLogicalDrives, QueryDosDeviceW};

// Cache for NT device path to DOS drive letter mappings
static DRIVE_MAPPINGS: OnceLock<HashMap<String, String>> = OnceLock::new();
// refreshable mappings
// static DRIVE_MAPPINGS: RwLock<Option<HashMap<String, String>>> = RwLock::new(None);

/// Initialize the drive mappings cache
fn init_drive_mappings() -> HashMap<String, String> {
  let mut mappings = HashMap::new();

  let drive_mask = unsafe { GetLogicalDrives() };
  if drive_mask == 0 {
    return mappings;
  }

  // Iterate through all possible drive letters (A-Z)
  for i in 0..26 {
    if (drive_mask & (1 << i)) == 0 {
      continue;
    }

    let drive_letter = (b'A' + i) as char;
    let dos_device = format!("{}:", drive_letter);

    let dos_device_wide: Vec<u16> = dos_device
      .encode_utf16()
      .chain(std::iter::once(0))
      .collect();
    let mut target_path = vec![0u16; 260];

    let result = unsafe {
      QueryDosDeviceW(
        PCWSTR::from_raw(dos_device_wide.as_ptr()),
        Some(target_path.as_mut_slice()),
      )
    };

    if result == 0 {
      continue;
    }

    let nt_device_path = {
      let len = target_path
        .iter()
        .position(|&c| c == 0)
        .unwrap_or(target_path.len());
      String::from_utf16_lossy(&target_path[..len])
    };

    mappings.insert(nt_device_path, dos_device);
  }

  mappings
}

/// Converts an NT path to a DOS path using cached mappings
/// This function is optimized for frequent calls
pub fn nt_to_dos_path(nt_path: &str) -> Option<String> {
  if nt_path.len() == 0 {
    return None;
  }
  let mappings = DRIVE_MAPPINGS.get_or_init(init_drive_mappings);

  // Find matching device path prefix
  for (nt_device, dos_device) in mappings {
    if nt_path.starts_with(nt_device) {
      let remainder = &nt_path[nt_device.len()..];
      return Some(format!("{}{}", dos_device, remainder));
    }
  }

  None
}

// Force refresh the drive mappings cache (useful if drives are mounted/unmounted)
// pub fn refresh_drive_mappings() {
//   let mut write_guard = DRIVE_MAPPINGS.write().unwrap();
//   *write_guard = Some(init_drive_mappings());
// }
