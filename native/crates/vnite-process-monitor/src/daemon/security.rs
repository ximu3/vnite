use std::{ffi::c_void, os::windows::io::AsRawHandle};
use tokio::net::windows::named_pipe::{NamedPipeServer, ServerOptions};
use vnite_win32::HandleGuard;
use windows::{
  core::*,
  Win32::{
    Foundation::*,
    Security::{Authorization::*, *},
    System::{Pipes::*, Threading::*},
  },
};

pub fn open_parent(pid: u32) -> Result<HandleGuard> {
  let handle = HandleGuard(unsafe {
    OpenProcess(
      PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_SYNCHRONIZE,
      false,
      pid,
    )?
  });
  if !alive(&handle) {
    return Err(Error::from_hresult(E_ACCESSDENIED));
  }
  Ok(handle)
}

fn alive(parent: &HandleGuard) -> bool {
  unsafe { WaitForSingleObject(parent.0, 0) == WAIT_TIMEOUT }
}

fn token(handle: HANDLE) -> Result<HandleGuard> {
  let mut result = HANDLE::default();
  unsafe {
    OpenProcessToken(handle, TOKEN_QUERY, &mut result)?;
  }
  Ok(HandleGuard(result))
}

pub fn elevated() -> Result<bool> {
  let token = token(unsafe { GetCurrentProcess() })?;
  let mut value = TOKEN_ELEVATION::default();
  let mut size = 0;
  unsafe {
    GetTokenInformation(
      token.0,
      TokenElevation,
      Some(&mut value as *mut _ as *mut c_void),
      std::mem::size_of_val(&value) as u32,
      &mut size,
    )?;
  }
  Ok(value.TokenIsElevated != 0)
}

pub fn create_pipe(name: &str, parent: &HandleGuard) -> std::io::Result<NamedPipeServer> {
  // The original user's SID is taken from the verified parent, including when
  // UAC was authorized using a different administrator account.
  unsafe {
    let token = token(parent.0)?;
    let mut size = 0;
    let _ = GetTokenInformation(token.0, TokenUser, None, 0, &mut size);
    let mut buffer = vec![0usize; (size as usize).div_ceil(std::mem::size_of::<usize>())];
    GetTokenInformation(
      token.0,
      TokenUser,
      Some(buffer.as_mut_ptr().cast()),
      size,
      &mut size,
    )?;
    let user = &*(buffer.as_ptr() as *const TOKEN_USER);
    let mut sid = PWSTR::null();
    ConvertSidToStringSidW(user.User.Sid, &mut sid)?;
    let sid_text = sid.to_string();
    LocalFree(Some(HLOCAL(sid.0.cast())));
    let sid_text =
      sid_text.map_err(|error| std::io::Error::new(std::io::ErrorKind::InvalidData, error))?;
    // Keep the pipe writable by the ordinary host when this server is elevated.
    // The DACL and client PID check still restrict who may use the connection.
    // https://learn.microsoft.com/windows/win32/secauthz/mandatory-integrity-control
    let sddl: Vec<u16> = format!(
      "D:P(A;;GA;;;SY)(A;;GA;;;BA)(A;;GRGW;;;{})S:(ML;;NW;;;ME)",
      sid_text
    )
    .encode_utf16()
    .chain(Some(0))
    .collect();
    let mut descriptor = PSECURITY_DESCRIPTOR::default();
    ConvertStringSecurityDescriptorToSecurityDescriptorW(
      PCWSTR(sddl.as_ptr()),
      SDDL_REVISION,
      &mut descriptor,
      None,
    )?;
    let mut attributes = SECURITY_ATTRIBUTES {
      nLength: std::mem::size_of::<SECURITY_ATTRIBUTES>() as u32,
      lpSecurityDescriptor: descriptor.0,
      bInheritHandle: false.into(),
    };
    let result = ServerOptions::new()
      .first_pipe_instance(true)
      .max_instances(1)
      .reject_remote_clients(true)
      .create_with_security_attributes_raw(name, &mut attributes as *mut _ as *mut c_void);
    LocalFree(Some(HLOCAL(descriptor.0)));
    result
  }
}

pub fn verify_client(pipe: &NamedPipeServer, parent: &HandleGuard, pid: u32) -> Result<()> {
  let mut actual = 0;
  unsafe {
    GetNamedPipeClientProcessId(HANDLE(pipe.as_raw_handle()), &mut actual)?;
  }
  if actual != pid || !alive(parent) {
    return Err(Error::from_hresult(E_ACCESSDENIED));
  }
  Ok(())
}
