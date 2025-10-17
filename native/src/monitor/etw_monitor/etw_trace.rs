use std::{ffi::c_void, mem};
use tokio::sync::mpsc;
use windows::{
  core::*,
  Win32::{Foundation, System::Diagnostics::Etw, System::Time},
};

use crate::log;
use crate::monitor::{ProcessMessage, ProcessStatus};

// Private session GUID (just wrote down a random GUID, can be changed at will)
const SESSION_GUID: GUID = GUID::from_u128(0xae44cb98_bd11_4069_10be_7dea1390e2ff);

// Kernel provider GUID for process events
//
// Can be retrieved from `logman query providers Microsoft-Windows-Kernel-Process`
// output:
//
// Provider                                 GUID
// -------------------------------------------------------------------------------
// Microsoft-Windows-Kernel-Process         {22FB2CD6-0E7B-422B-A0C7-2FAD1FD0E716}
//
// Value               Keyword              Description
// -------------------------------------------------------------------------------
// 0x0000000000000010  WINEVENT_KEYWORD_PROCESS
// 0x0000000000000020  WINEVENT_KEYWORD_THREAD
// 0x0000000000000040  WINEVENT_KEYWORD_IMAGE
// 0x0000000000000080  WINEVENT_KEYWORD_CPU_PRIORITY
// 0x0000000000000100  WINEVENT_KEYWORD_OTHER_PRIORITY
// 0x0000000000000200  WINEVENT_KEYWORD_PROCESS_FREEZE
// 0x0000000000000400  WINEVENT_KEYWORD_JOB
// 0x0000000000000800  WINEVENT_KEYWORD_ENABLE_PROCESS_TRACING_CALLBACKS
// 0x0000000000001000  WINEVENT_KEYWORD_JOB_IO
// 0x0000000000002000  WINEVENT_KEYWORD_WORK_ON_BEHALF
// 0x0000000000004000  WINEVENT_KEYWORD_JOB_SILO
// 0x8000000000000000  Microsoft-Windows-Kernel-Process/Analytic
//
// Value               Level                Description
// -------------------------------------------------------------------------------
// 0x04                win:Informational    Information
const KERNEL_PROCESS_PROVIDER: GUID = GUID::from_u128(0x22fb2cd6_0e7b_422b_a0c7_2fad1fd0e716);
const WINEVENT_KEYWORD_PROCESS: u64 = 0x10;

// Event IDs for process events in the Kernel provider
const PROCESS_START_EVENT_ID: u16 = 1;
const PROCESS_STOP_EVENT_ID: u16 = 2;

pub struct EtwTrace {
  /// A descriptive name of this trace session
  session_name_wide: Vec<u16>,

  /// The handle of this trace session (obtained from StartTraceW)
  session_handle: Etw::CONTROLTRACE_HANDLE,

  /// The handle of trace processor (obtained from OpenTraceW)
  trace_handle: Etw::PROCESSTRACE_HANDLE,

  /// The OS thread handle on which event consumer is running
  consumer_handle: Option<std::thread::JoinHandle<()>>,

  context: Option<Box<DecoderContext>>,
}

impl EtwTrace {
  pub fn new(session_name: &str) -> Self {
    EtwTrace {
      // convert Rust utf8 string to utf16 (wstring) and append a wide '\0' at the end
      session_name_wide: session_name
        .to_string()
        .encode_utf16()
        .chain(std::iter::once(0u16))
        .collect(),
      session_handle: Etw::CONTROLTRACE_HANDLE { Value: 0 },
      trace_handle: Etw::PROCESSTRACE_HANDLE { Value: 0 },
      consumer_handle: None,
      context: None,
    }
  }

  /// Initialize a real-time EVENT_TRACE_PROPERTIES.
  /// Returning a BYTE buffer instead of a EVENT_TRACE_PROPERTIES struct because the LogFileName
  /// is not a part of the struct, and the buffer will go out of scope if it is not returned, which
  /// cause memory leaks.
  fn init_event_trace_properties_buffer(&self) -> Vec<u8> {
    // calculate the entire size of the struct plus '\0' terminated session name wstring
    let properties_size = mem::size_of::<Etw::EVENT_TRACE_PROPERTIES>()
      + (self.session_name_wide.len() * mem::size_of::<u16>());
    // allocate memory for EVENT_TRACE_PROPERTIES and LogFileName
    let mut buffer = vec![0u8; properties_size];
    let properties = unsafe { &mut *(buffer.as_mut_ptr() as *mut Etw::EVENT_TRACE_PROPERTIES) };

    // prepare EVENT_TRACE_PROPERTIES structure
    // see https://learn.microsoft.com/en-us/windows/win32/api/evntrace/ns-evntrace-event_trace_properties
    properties.Wnode.BufferSize = properties_size as u32;
    properties.Wnode.ClientContext = 1;
    properties.Wnode.Flags = Etw::WNODE_FLAG_TRACED_GUID;
    properties.Wnode.Guid = SESSION_GUID;
    properties.LogFileMode = Etw::EVENT_TRACE_REAL_TIME_MODE;
    properties.MinimumBuffers = 0;
    properties.MaximumBuffers = 2;
    properties.MaximumFileSize = 4; // set a buffer size of 4 MB (can be smaller?)
    properties.FlushTimer = 1;
    properties.LogFileNameOffset = 0; // using real time mode, no need log file
    properties.LoggerNameOffset = mem::size_of::<Etw::EVENT_TRACE_PROPERTIES>() as u32;

    // Copy session name.
    // Maybe unnecessary because `StartTrace` will do this for us
    // unsafe {
    //   ptr::copy_nonoverlapping(
    //     self.session_name_wide.as_ptr(),
    //     buffer
    //       .as_mut_ptr()
    //       .add(properties.LoggerNameOffset as usize) as *mut u16,
    //     self.session_name_wide.len(),
    //   );
    // }

    buffer
  }

  /// Starts a trace session.
  /// Event consumer is not activated at this time until `consume_events()` is invoked.
  pub fn start_trace(&mut self) -> Result<()> {
    log::info("starting ETW trace session...");

    // stop existing session if any
    let result = self.stop_trace(true);
    if result.is_err() {
      return result;
    }

    // initialize an EVENT_TRACE_PROPERTIES
    let mut buffer = self.init_event_trace_properties_buffer();
    let properties = buffer.as_mut_ptr() as *mut Etw::EVENT_TRACE_PROPERTIES;

    // start trace session
    unsafe {
      let result = Etw::StartTraceW(
        &mut self.session_handle,
        PCWSTR(self.session_name_wide.as_ptr()),
        properties,
      );
      if result.is_err() {
        let hres = HRESULT::from_win32(result.0);
        log::error(
          format!(
            "failed to start trace session: {} (0x{:x})",
            hres.message(),
            hres.0,
          )
          .as_str(),
        );
        return Err(Error::from_hresult(hres));
      }
    }

    // enable the kernel process provider for the session
    unsafe {
      let result = Etw::EnableTraceEx2(
        self.session_handle,
        &KERNEL_PROCESS_PROVIDER,
        Etw::EVENT_CONTROL_CODE_ENABLE_PROVIDER.0,
        Etw::TRACE_LEVEL_INFORMATION as u8,
        WINEVENT_KEYWORD_PROCESS,
        0,
        5000, // wait up to 5 seconds for the provider to be enabled
        None,
      );
      if result.is_err() {
        let hres = HRESULT::from_win32(result.0);
        log::error(
          format!(
            "failed to enable trace: {} (0x{:x})",
            hres.message(),
            hres.0
          )
          .as_str(),
        );
        return Err(Error::from_hresult(hres));
      }
    }

    log::info(
      format!(
        "ETW trace session started, session handle: 0x{:x}",
        self.session_handle.Value
      )
      .as_str(),
    );
    Ok(())
  }

  /// Starts to consume events.
  /// An OS managed thread will be spawned in this function in order to process events.
  pub fn consume_events(&mut self, tx: mpsc::Sender<ProcessMessage>) -> Result<()> {
    // do nothing if there is already a trace handle
    if self.trace_handle.Value != 0 {
      return Ok(());
    }

    // clone session name for the lifetime of this function
    let mut session_name_wide = self.session_name_wide.clone();

    // create a context
    self.context = Some(Box::new(DecoderContext::new(tx)));

    // define the EVENT_TRACE_LOGFILEW struct
    let mut trace_log_file = Etw::EVENT_TRACE_LOGFILEW {
      LoggerName: PWSTR(session_name_wide.as_mut_ptr()),
      Anonymous1: Etw::EVENT_TRACE_LOGFILEW_0 {
        ProcessTraceMode: Etw::PROCESS_TRACE_MODE_REAL_TIME | Etw::PROCESS_TRACE_MODE_EVENT_RECORD,
      },
      Anonymous2: Etw::EVENT_TRACE_LOGFILEW_1 {
        EventRecordCallback: Some(Self::event_record_callback),
      },
      Context: self.context.as_mut().unwrap().as_mut() as *mut _ as *mut c_void,
      ..Default::default()
    };

    unsafe {
      let trace_handle = Etw::OpenTraceW(&mut trace_log_file);
      // INVALID_PROCESSTRACE_HANDLE
      if trace_handle.Value == 0xFFFFFFFFFFFFFFFF {
        let err = Foundation::GetLastError();
        let hres = HRESULT::from_win32(err.0);
        log::error(
          format!(
            "failed to open trace for the session: {} (0x:{:x})",
            hres.message(),
            hres.0
          )
          .as_str(),
        );
        return Err(Error::from_hresult(hres));
      }

      // transfer the ownership of trace handle to self
      self.trace_handle = trace_handle;
      // spawn consumer thread
      self.consumer_handle = Some(std::thread::spawn(move || {
        Self::consumer_task(trace_handle)
      }));
    }

    Ok(())
  }

  // The system will not start a new session if another session with the same name is already running.
  // Try using session name instead of session handle to stop the session, because there is a chance that
  // if the program was terminated accidentally, the next start will be unable to retrieve the previous
  // session handle, but the name remains the same.
  pub fn stop_trace(&mut self, ignore_non_existing: bool) -> Result<()> {
    // try to close trace first
    if self.trace_handle.Value != 0 {
      unsafe {
        let result = Etw::CloseTrace(self.trace_handle);
        // ERROR_CTX_CLOSE_PENDING is treated as successful
        if result.is_err() && result != Foundation::ERROR_CTX_CLOSE_PENDING {
          let hres = HRESULT::from_win32(result.0);
          log::error(
            format!("failed to close trace: {} (0x{:x})", hres.message(), hres.0).as_str(),
          );
          // not returning so early on errors, must try to stop the session
        }
      }
    }

    // disable subscribed provider for the session
    if self.session_handle.Value != 0 {
      unsafe {
        let result = Etw::EnableTraceEx2(
          self.session_handle,
          &KERNEL_PROCESS_PROVIDER,
          Etw::EVENT_CONTROL_CODE_DISABLE_PROVIDER.0, // disable flag
          Etw::TRACE_LEVEL_INFORMATION as u8,
          0x10,
          0,
          1000,
          None,
        );
        if result.is_err() {
          let hres = HRESULT::from_win32(result.0);
          log::error(
            format!(
              "failed to disable trace: {} (0x{:x})",
              hres.message(),
              hres.0
            )
            .as_str(),
          );
          // not returning so early on errors, must try to stop the session
        }
      }
    }

    // stop session
    let mut buffer = self.init_event_trace_properties_buffer();
    let properties = buffer.as_mut_ptr() as *mut Etw::EVENT_TRACE_PROPERTIES;

    unsafe {
      let result = Etw::ControlTraceW(
        Etw::CONTROLTRACE_HANDLE::default(),
        PCWSTR(self.session_name_wide.as_ptr()),
        properties,
        Etw::EVENT_TRACE_CONTROL_STOP,
      );
      if result.is_err() {
        if result == Foundation::ERROR_WMI_INSTANCE_NOT_FOUND && ignore_non_existing {
          log::debug("ignoring non existing trace session on stop_trace");
        } else {
          let hres = HRESULT::from_win32(result.0);
          log::error(
            format!(
              "failed to stop trace session: {} (0x{:x})",
              hres.message(),
              hres.0,
            )
            .as_str(),
          );
          return Err(Error::from_hresult(hres));
        }
      } else {
        log::info("ETW trace session has been gracefully stopped");
      }
    }

    // clean handles, drop context
    self.session_handle = Etw::CONTROLTRACE_HANDLE { Value: 0 };
    self.trace_handle = Etw::PROCESSTRACE_HANDLE { Value: 0 };
    self.consumer_handle.take();
    self.context.take();

    Ok(())
  }

  unsafe fn consumer_task(trace_handle: Etw::PROCESSTRACE_HANDLE) {
    log::info("ETW monitor consumer thread has been spawned");
    // ProcessTrace will block forever until CloseTrace is invoked when processing real-time events
    let result = Etw::ProcessTrace(&[trace_handle], None, None);
    if result.is_err() {
      if result == Foundation::ERROR_CANCELLED {
        log::info("ProcessTrace is terminated");
      } else {
        let hres = HRESULT::from_win32(result.0);
        log::error(
          format!(
            "failed to process trace: {} (0x{:x})",
            hres.message(),
            hres.0
          )
          .as_str(),
        );
      }
    }
  }

  /// The callback function get invoked every time on receiving process start/stop event messages
  unsafe extern "system" fn event_record_callback(event_record: *mut Etw::EVENT_RECORD) {
    let record = &*event_record;
    // check if this is a process event
    if record.EventHeader.ProviderId != KERNEL_PROCESS_PROVIDER {
      return;
    }

    // retrieve context pointer and process event record
    let context = record.UserContext as *mut DecoderContext;
    (&*context).process_event_record(record);
  }
}

// automatically stop trace when the struct goes out of scope
impl Drop for EtwTrace {
  fn drop(&mut self) {
    let _ = self.stop_trace(true);
  }
}

struct DecoderContext {
  tx: mpsc::Sender<ProcessMessage>,
}

impl DecoderContext {
  pub fn new(tx: mpsc::Sender<ProcessMessage>) -> Self {
    Self { tx }
  }

  pub fn process_event_record(&self, record: &Etw::EVENT_RECORD) {
    match record.EventHeader.EventDescriptor.Id {
      PROCESS_START_EVENT_ID => {
        if record.UserDataLength > 0 {
          unsafe { self.handle_process_start(record) };
        }
      }
      PROCESS_STOP_EVENT_ID => {
        if record.UserDataLength > 0 {
          unsafe { self.handle_process_stop(record) };
        }
      }
      _ => {} // Ignore other events
    }
  }

  // Using manual parsing to retrieve event data
  // The process stop user data schema is defined as following
  //
  // <template tid="ProcessStopArgs_V2">
  //   <data name="ProcessID" inType="win:UInt32" />
  //   <data name="ProcessSequenceNumber" inType="win:UInt64" />
  //   <data name="CreateTime" inType="win:FILETIME" />
  //   <data name="ExitTime" inType="win:FILETIME" />
  //   <data name="ExitCode" inType="win:UInt32" />
  //   <data name="TokenElevationType" inType="win:UInt32" />
  //   <data name="HandleCount" inType="win:UInt32" />
  //   <data name="CommitCharge" inType="win:UInt64" />
  //   <data name="CommitPeak" inType="win:UInt64" />
  //   <data name="CPUCycleCount" inType="win:UInt64" />
  //   <data name="ReadOperationCount" inType="win:UInt32" />
  //   <data name="WriteOperationCount" inType="win:UInt32" />
  //   <data name="ReadTransferKiloBytes" inType="win:UInt32" />
  //   <data name="WriteTransferKiloBytes" inType="win:UInt32" />
  //   <data name="HardFaultCount" inType="win:UInt32" />
  //   <data name="ImageName" inType="win:AnsiString" />
  // </template>
  unsafe fn handle_process_stop(&self, record: &Etw::EVENT_RECORD) {
    if record.UserData.is_null() || record.UserDataLength == 0 {
      return;
    }

    let data_ptr = record.UserData as *const u8;
    let data_length = record.UserDataLength as usize;

    // Parse the structure according to ProcessStopArgs_V2 template
    if 4 > data_length {
      log::error("buffer overflow while reading data");
      return;
    }
    let process_id = (data_ptr as *const u32).read_unaligned();

    match self.tx.try_send(ProcessMessage {
      pid: process_id,
      status: ProcessStatus::Terminated,
      path: String::new(),
    }) {
      Err(e) => {
        log::error(
          format!(
            "failed to send a process stop information, pid: {}: {:?}",
            process_id, e
          )
          .as_str(),
        );
      }
      Ok(_) => {}
    }
  }

  // Using manual parsing to retrieve event data
  // The process start user data schema is defined as following
  //
  // <template tid="ProcessStartArgs_V4">
  //   <data name="ProcessID" inType="win:UInt32" />
  //   <data name="ProcessSequenceNumber" inType="win:UInt64" />
  //   <data name="CreateTime" inType="win:FILETIME" />
  //   <data name="ParentProcessID" inType="win:UInt32" />
  //   <data name="ParentProcessSequenceNumber" inType="win:UInt64" />
  //   <data name="SessionID" inType="win:UInt32" />
  //   <data name="Flags" inType="win:UInt32" />
  //   <data name="ProcessTokenElevationType" inType="win:UInt32" />
  //   <data name="ProcessTokenIsElevated" inType="win:UInt32" />
  //   <data name="MandatoryLabel" inType="win:SID" />
  //   <data name="ImageName" inType="win:UnicodeString" />
  //   <data name="ImageChecksum" inType="win:UInt32" />
  //   <data name="TimeDateStamp" inType="win:UInt32" />
  //   <data name="PackageFullName" inType="win:UnicodeString" />
  //   <data name="PackageRelativeAppId" inType="win:UnicodeString" />
  //   <data name="SecurityMitigations" inType="win:UInt32" />
  // </template>
  unsafe fn handle_process_start(&self, record: &Etw::EVENT_RECORD) {
    if record.UserData.is_null() || record.UserDataLength == 0 {
      return;
    }

    let data_ptr = record.UserData as *const u8;
    let data_length = record.UserDataLength as usize;
    let mut offset = 0usize;

    // Helper macro to safely read data
    macro_rules! read_value {
      ($type:ty) => {{
        if offset + mem::size_of::<$type>() > data_length {
          log::error("Buffer overflow while reading data");
          return;
        }
        let value = (data_ptr.add(offset) as *const $type).read_unaligned();
        offset += mem::size_of::<$type>();
        value
      }};
    }

    // Parse the structure according to template schema
    let process_id = read_value!(u32);
    // let process_seq = read_value!(u64);
    offset += 8;
    // let create_time = read_value!(FILETIME);
    // let parent_pid = read_value!(u32);
    // let parent_seq = read_value!(u64);
    // let session_id = read_value!(u32);
    // let flags = read_value!(u32);
    // let token_elevation_type = read_value!(u32);
    // let token_is_elevated = read_value!(u32);
    offset += 8 + 4 + 8 + 4 + 4 + 4 + 4;

    // Skip MandatoryLabel (SID) - variable length
    // SID structure starts with Revision (1 byte) and SubAuthorityCount (1 byte)
    if offset + 2 <= data_length {
      let sub_authority_count = *(data_ptr.add(offset + 1));
      let sid_size = 8 + (sub_authority_count as usize * 4); // 8 bytes header + 4 bytes per SubAuthority
      offset += sid_size;
    } else {
      log::error("failed to parse SID");
      return;
    }

    // read ImageName (null-terminated wide string)
    let image_name = Self::read_wide_string_from_offset(data_ptr, data_length, &mut offset);

    if let Some(path) = image_name {
      // log::info(format!("Process Full Path: {}", path).as_str());
      // send process message
      match self.tx.try_send(ProcessMessage {
        pid: process_id,
        status: ProcessStatus::Started,
        path: path,
      }) {
        Err(e) => {
          log::error(
            format!(
              "failed to send a process start information, pid: {}: {:?}",
              process_id, e
            )
            .as_str(),
          );
        }
        Ok(_) => {}
      }
    } else {
      log::error("failed to parse ImageName");
    }
  }

  // Helper function to read a null-terminated wide string from a buffer at a specific offset
  unsafe fn read_wide_string_from_offset(
    data_ptr: *const u8,
    data_length: usize,
    offset: &mut usize,
  ) -> Option<String> {
    if *offset >= data_length {
      return None;
    }

    let start_ptr = data_ptr.add(*offset) as *const u16;
    let mut len = 0;

    // Find null terminator
    while *offset + (len * 2) + 2 <= data_length {
      if *start_ptr.add(len) == 0 {
        break;
      }
      len += 1;
    }

    if len == 0 {
      return None;
    }

    let slice = std::slice::from_raw_parts(start_ptr, len);
    *offset += (len + 1) * 2; // Move past the string and null terminator

    Some(String::from_utf16_lossy(slice))
  }

  #[allow(dead_code)]
  fn file_time_to_system_time(file_time: &Foundation::FILETIME) -> Result<Foundation::SYSTEMTIME> {
    let mut system_time = Foundation::SYSTEMTIME::default();
    unsafe {
      Time::FileTimeToSystemTime(file_time, &mut system_time)?;
    }
    Ok(system_time)
  }
}
