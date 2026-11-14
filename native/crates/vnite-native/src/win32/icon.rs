use std::slice;

use windows::{
  core::{Owned, BOOL, HSTRING, PCWSTR},
  Win32::{
    Foundation::HMODULE,
    System::LibraryLoader::{
      EnumResourceNamesW, FindResourceW, LoadLibraryExW, LoadResource, LockResource,
      SizeofResource, LOAD_LIBRARY_AS_DATAFILE, LOAD_LIBRARY_AS_IMAGE_RESOURCE,
    },
    UI::WindowsAndMessaging::{RT_GROUP_ICON, RT_ICON},
  },
};

const GROUP_ICON_HEADER_SIZE: usize = 6;
const GROUP_ICON_ENTRY_SIZE: usize = 14;
const ICO_HEADER_SIZE: usize = 6;
const ICO_ENTRY_SIZE: usize = 16;
const ICO_IMAGE_OFFSET: u32 = (ICO_HEADER_SIZE + ICO_ENTRY_SIZE) as u32;

#[derive(Clone, Copy, Debug)]
struct GroupIconEntry {
  width: u8,
  height: u8,
  color_count: u8,
  reserved: u8,
  planes: u16,
  bit_count: u16,
  bytes_in_resource: u32,
  resource_id: u16,
}

struct ExtractionContext {
  result: Option<Result<Vec<u8>, String>>,
}

pub fn extract_executable_icon(path: &str) -> Result<Vec<u8>, String> {
  if path.trim().is_empty() {
    return Err("Executable path is required".to_string());
  }

  let wide_path = HSTRING::from(path);
  let module = unsafe {
    Owned::new(
      LoadLibraryExW(
        &wide_path,
        None,
        LOAD_LIBRARY_AS_DATAFILE | LOAD_LIBRARY_AS_IMAGE_RESOURCE,
      )
      .map_err(|error| format!("Failed to open executable resources: {error}"))?,
    )
  };

  let mut context = ExtractionContext { result: None };
  unsafe {
    let _ = EnumResourceNamesW(
      Some(*module),
      RT_GROUP_ICON,
      Some(extract_first_icon_group),
      (&mut context as *mut ExtractionContext) as isize,
    );
  }

  context
    .result
    .unwrap_or_else(|| Err("No icon group resource found in executable".to_string()))
}

unsafe extern "system" fn extract_first_icon_group(
  module: HMODULE,
  _resource_type: PCWSTR,
  resource_name: PCWSTR,
  context: isize,
) -> BOOL {
  let context = unsafe { &mut *(context as *mut ExtractionContext) };
  context.result = Some(unsafe { extract_icon_group(module, resource_name) });

  // The first RT_GROUP_ICON is the executable's primary icon group.
  BOOL(0)
}

unsafe fn extract_icon_group(module: HMODULE, resource_name: PCWSTR) -> Result<Vec<u8>, String> {
  let group_data = unsafe { load_resource(module, resource_name, RT_GROUP_ICON) }?;
  let entry = select_largest_icon(&group_data)?;
  let icon_resource_name = PCWSTR(entry.resource_id as usize as *const u16);
  let image_data = unsafe { load_resource(module, icon_resource_name, RT_ICON) }?;

  build_single_image_ico(entry, &image_data)
}

unsafe fn load_resource(
  module: HMODULE,
  resource_name: PCWSTR,
  resource_type: PCWSTR,
) -> Result<Vec<u8>, String> {
  let resource_info = unsafe { FindResourceW(Some(module), resource_name, resource_type) };
  if resource_info.0.is_null() {
    return Err(format!(
      "Failed to find icon resource: {}",
      windows::core::Error::from_thread()
    ));
  }

  let resource_size = unsafe { SizeofResource(Some(module), resource_info) } as usize;
  if resource_size == 0 {
    return Err("Icon resource is empty".to_string());
  }

  let resource = unsafe { LoadResource(Some(module), resource_info) }
    .map_err(|error| format!("Failed to load icon resource: {error}"))?;
  let resource_data = unsafe { LockResource(resource) } as *const u8;
  if resource_data.is_null() {
    return Err("Failed to access icon resource data".to_string());
  }

  Ok(unsafe { slice::from_raw_parts(resource_data, resource_size) }.to_vec())
}

fn select_largest_icon(group_data: &[u8]) -> Result<GroupIconEntry, String> {
  if group_data.len() < GROUP_ICON_HEADER_SIZE {
    return Err("Icon group header is truncated".to_string());
  }

  let reserved = read_u16(group_data, 0)?;
  let resource_type = read_u16(group_data, 2)?;
  let entry_count = read_u16(group_data, 4)? as usize;
  if reserved != 0 || resource_type != 1 {
    return Err("Invalid icon group header".to_string());
  }
  if entry_count == 0 {
    return Err("Icon group contains no images".to_string());
  }

  let directory_size = entry_count
    .checked_mul(GROUP_ICON_ENTRY_SIZE)
    .and_then(|entries_size| GROUP_ICON_HEADER_SIZE.checked_add(entries_size))
    .ok_or_else(|| "Icon group directory size overflowed".to_string())?;
  if group_data.len() < directory_size {
    return Err("Icon group directory is truncated".to_string());
  }

  let mut largest: Option<GroupIconEntry> = None;
  for index in 0..entry_count {
    let offset = GROUP_ICON_HEADER_SIZE + index * GROUP_ICON_ENTRY_SIZE;
    let entry = GroupIconEntry {
      width: group_data[offset],
      height: group_data[offset + 1],
      color_count: group_data[offset + 2],
      reserved: group_data[offset + 3],
      planes: read_u16(group_data, offset + 4)?,
      bit_count: read_u16(group_data, offset + 6)?,
      bytes_in_resource: read_u32(group_data, offset + 8)?,
      resource_id: read_u16(group_data, offset + 12)?,
    };

    if largest
      .map(|current| icon_quality(entry) > icon_quality(current))
      .unwrap_or(true)
    {
      largest = Some(entry);
    }
  }

  largest.ok_or_else(|| "Icon group contains no valid images".to_string())
}

fn icon_quality(entry: GroupIconEntry) -> (u32, u16, u32) {
  let dimension = |value: u8| match value {
    0 => 256, // ICO encodes a 256 as 0 in its u8 width/height field.
    value => u16::from(value),
  };

  let width = dimension(entry.width);
  let height = dimension(entry.height);
  (
    u32::from(width) * u32::from(height),
    entry.bit_count,
    entry.bytes_in_resource,
  )
}

fn build_single_image_ico(entry: GroupIconEntry, image_data: &[u8]) -> Result<Vec<u8>, String> {
  let image_size = u32::try_from(image_data.len())
    .map_err(|_| "Icon resource is too large to store in an ICO file")?;
  let capacity = (ICO_IMAGE_OFFSET as usize)
    .checked_add(image_data.len())
    .ok_or("ICO file size overflowed")?;

  // ICONDIR
  let header: [u8; ICO_HEADER_SIZE] = [
    0, 0, // idReserved: must be zero
    1, 0, // idType: 1 means an icon (2 means a cursor)
    1, 0, // idCount: this ICO contains one image
  ];

  // ICONDIRENTRY
  let mut directory_entry = [0u8; ICO_ENTRY_SIZE];
  directory_entry[0..4].copy_from_slice(&[
    entry.width,       // bWidth
    entry.height,      // bHeight
    entry.color_count, // bColorCount
    entry.reserved,    // bReserved
  ]);
  directory_entry[4..6].copy_from_slice(&entry.planes.to_le_bytes()); // wPlanes
  directory_entry[6..8].copy_from_slice(&entry.bit_count.to_le_bytes()); // wBitCount
  directory_entry[8..12].copy_from_slice(&image_size.to_le_bytes()); // dwBytesInRes
  directory_entry[12..16].copy_from_slice(&ICO_IMAGE_OFFSET.to_le_bytes()); // dwImageOffset

  // build ICO
  let mut ico = Vec::with_capacity(capacity);
  ico.extend_from_slice(&header);
  ico.extend_from_slice(&directory_entry);
  ico.extend_from_slice(image_data);

  Ok(ico)
}

fn read_u16(data: &[u8], offset: usize) -> Result<u16, String> {
  let bytes = data
    .get(offset..offset + 2)
    .ok_or("Icon resource is truncated")?;
  Ok(u16::from_le_bytes([bytes[0], bytes[1]]))
}

fn read_u32(data: &[u8], offset: usize) -> Result<u32, String> {
  let bytes = data
    .get(offset..offset + 4)
    .ok_or("Icon resource is truncated")?;
  Ok(u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]))
}
