use std::ffi::c_void;
use tokio::sync::{
  broadcast,
  mpsc::{self, error::TrySendError},
};
use windows::{
  core::*,
  Win32::System::{Com, Rpc, Variant, Wmi},
};

use crate::log;
use crate::monitor::{ProcessMessage, ProcessStatus};

/// Receive notification from WMI when a process get created or terminated.
///
/// This function will block forever unless it fails or receives a termination signal.
///
/// Mostly referenced from: https://learn.microsoft.com/en-us/windows/win32/wmisdk/example--receiving-event-notifications-through-wmi-
pub unsafe fn wmi_event_monitor(
  mut rx_term: broadcast::Receiver<()>,
  tx: mpsc::Sender<ProcessMessage>,
) -> Result<()> {
  // Step 1: Initialize COM for this thread
  let hres = Com::CoInitializeEx(None, Com::COINIT_MULTITHREADED);
  if hres.is_err() {
    log::error("CoInitializeEx failed");
    return Err(Error::from(hres));
  }

  // Step 2: Set general COM security levels
  let hr = Com::CoInitializeSecurity(
    None,
    -1,
    None,
    None,
    Com::RPC_C_AUTHN_LEVEL_DEFAULT,
    Com::RPC_C_IMP_LEVEL_IMPERSONATE,
    None,
    Com::EOAC_NONE,
    None,
  );
  if hr.is_err() {
    let err = hr.unwrap_err();
    // Check if error code = 0x80010119
    // Security must be initialized before any interfaces are marshalled or unmarshalled.
    // It cannot be changed once initialized. (0x80010119)
    #[allow(overflowing_literals)]
    if !err.code().eq(&HRESULT(0x80010119)) {
      log::error("CoInitializeSecurity failed");
      Com::CoUninitialize();
      return Err(err);
    }
    log::info("CoInitializeSecurity is already set, skip initializing security");
  }

  // Step 3: Create WMI locator
  let locator: Wmi::IWbemLocator =
    match Com::CoCreateInstance(&Wmi::WbemLocator, None, Com::CLSCTX_INPROC_SERVER) {
      Ok(loc) => loc,
      Err(e) => {
        log::error("CoCreateInstance locator failed");
        Com::CoUninitialize();
        return Err(e);
      }
    };

  // Step 4: Connect to WMI namespace
  let services = match locator.ConnectServer(
    &BSTR::from("ROOT\\CIMV2"),
    &BSTR::new(),
    &BSTR::new(),
    &BSTR::new(),
    0i32, // WBEM_FLAG_CONNECT_USE_MAX_WAIT equivalent
    &BSTR::new(),
    None,
  ) {
    Ok(svc) => svc,
    Err(e) => {
      log::error("IWbemLocator.ConnectServer failed");
      drop(locator);
      Com::CoUninitialize();
      return Err(e);
    }
  };

  // Step 5: Set security levels on the proxy
  let hr = Com::CoSetProxyBlanket(
    &services,
    Rpc::RPC_C_AUTHN_WINNT,
    Rpc::RPC_C_AUTHZ_NONE,
    PCWSTR::null(),
    Com::RPC_C_AUTHN_LEVEL_CALL,
    Com::RPC_C_IMP_LEVEL_IMPERSONATE,
    None,
    Com::EOAC_NONE,
  );
  if hr.is_err() {
    log::error("CoSetProxyBlanket failed");
    drop(services);
    drop(locator);
    Com::CoUninitialize();
    return hr;
  }

  // Use an unsecured apartment for security
  let unsec_app: Wmi::IUnsecuredApartment =
    match Com::CoCreateInstance(&Wmi::UnsecuredApartment, None, Com::CLSCTX_LOCAL_SERVER) {
      Ok(p_unsec) => p_unsec,
      Err(e) => {
        log::error("CoCreateInstance unsec_app failed");
        drop(services);
        drop(locator);
        Com::CoUninitialize();
        return Err(e);
      }
    };

  // spawn a process start sink
  let sink_layout = std::alloc::Layout::new::<Wmi::IWbemObjectSink>();
  let unsafe_p_s_sink: *mut Wmi::IWbemObjectSink =
    std::mem::transmute(std::alloc::alloc(sink_layout));
  let s_unk_stub = match spawn_sink(
    SinkType::ProcessStart,
    tx.clone(),
    &unsec_app,
    unsafe_p_s_sink,
  ) {
    Ok(s) => s,
    Err(e) => {
      log::error("failed to spawn sink");
      std::alloc::dealloc(unsafe_p_s_sink as *mut u8, sink_layout);
      drop(services);
      drop(locator);
      Com::CoUninitialize();
      return Err(e);
    }
  };

  // Receive process start event notifications
  let hr = services.ExecNotificationQueryAsync(
    &BSTR::from("WQL"),
    &BSTR::from(
      "SELECT TargetInstance.ExecutablePath, TargetInstance.ProcessId FROM __InstanceCreationEvent WITHIN 2 WHERE TargetInstance ISA 'Win32_Process'",
    ),
    Wmi::WBEM_FLAG_SEND_STATUS,
    None,
    &*unsafe_p_s_sink,
  );
  if hr.is_err() {
    log::error("ExecNotificationQueryAsync failed");
    std::alloc::dealloc(unsafe_p_s_sink as *mut u8, sink_layout);
    drop(s_unk_stub);
    drop(unsec_app);
    drop(services);
    drop(locator);
    Com::CoUninitialize();
    return hr;
  }

  // spawn a process end sink
  let sink_layout = std::alloc::Layout::new::<Wmi::IWbemObjectSink>();
  let unsafe_p_e_sink: *mut Wmi::IWbemObjectSink =
    std::mem::transmute(std::alloc::alloc(sink_layout));
  let e_unk_stub = match spawn_sink(SinkType::ProcessStop, tx, &unsec_app, unsafe_p_e_sink) {
    Ok(s) => s,
    Err(e) => {
      log::error("failed to spawn sink");
      std::alloc::dealloc(unsafe_p_e_sink as *mut u8, sink_layout);
      std::alloc::dealloc(unsafe_p_s_sink as *mut u8, sink_layout);
      drop(services);
      drop(locator);
      Com::CoUninitialize();
      return Err(e);
    }
  };

  // Receive process end event notifications
  let hr = services.ExecNotificationQueryAsync(
    &BSTR::from("WQL"),
    &BSTR::from(
      "SELECT TargetInstance.ExecutablePath, TargetInstance.ProcessId FROM __InstanceDeletionEvent WITHIN 2 WHERE TargetInstance ISA 'Win32_Process'",
    ),
    Wmi::WBEM_FLAG_SEND_STATUS,
    None,
    &*unsafe_p_e_sink,
  );
  if hr.is_err() {
    log::error("ExecNotificationQueryAsync failed");
    std::alloc::dealloc(unsafe_p_e_sink as *mut u8, sink_layout);
    drop(e_unk_stub);
    std::alloc::dealloc(unsafe_p_s_sink as *mut u8, sink_layout);
    drop(s_unk_stub);
    drop(unsec_app);
    drop(services);
    drop(locator);
    Com::CoUninitialize();
    return hr;
  }

  // block current thread until receiving a termination signal for graceful shutdown
  let _ = rx_term.blocking_recv();

  // do cleanups after receiving signal
  let _ = services.CancelAsyncCall(&*unsafe_p_s_sink);
  std::alloc::dealloc(unsafe_p_e_sink as *mut u8, sink_layout);
  drop(e_unk_stub);
  std::alloc::dealloc(unsafe_p_s_sink as *mut u8, sink_layout);
  drop(s_unk_stub);
  drop(unsec_app);
  drop(services);
  drop(locator);
  Com::CoUninitialize();

  Ok(())
}

/// `unsafe_p_sink` **MUST NOT** be null.
/// It's the caller's responsibility to allocate and deallocate memory for it.
unsafe fn spawn_sink(
  s_type: SinkType,
  tx: mpsc::Sender<ProcessMessage>,
  app: &Wmi::IUnsecuredApartment,
  unsafe_p_sink: *mut Wmi::IWbemObjectSink,
) -> Result<IUnknown> {
  // create a ProcessStartSink and link it to IUnsecuredApartment
  let s_sink: Wmi::IWbemObjectSink = ProcessSink {
    tx: tx,
    s_type: s_type,
  }
  .into();
  let s_unk_stub = match app.CreateObjectStub(&s_sink) {
    Ok(stub) => stub,
    Err(e) => {
      log::error("CreateObjectStub failed");
      return Err(e);
    }
  };
  drop(s_sink);

  let hres = s_unk_stub.query(
    &Wmi::IWbemObjectSink::IID,
    unsafe_p_sink as *mut *mut c_void,
  );
  if hres.is_err() {
    log::error("s_unk query interface failed");
    drop(s_unk_stub);
    return Err(Error::from(hres));
  }
  Ok(s_unk_stub)
}

enum SinkType {
  ProcessStart,
  ProcessStop,
}

#[implement(Wmi::IWbemObjectSink)]
struct ProcessSink {
  tx: mpsc::Sender<ProcessMessage>,
  s_type: SinkType,
}
impl Wmi::IWbemObjectSink_Impl for ProcessSink_Impl {
  fn Indicate(&self, objcount: i32, objarray: *const Option<Wmi::IWbemClassObject>) -> Result<()> {
    // log::debug("get a process WMI notification");
    unsafe {
      for i in 0..objcount {
        let apobject = match &*objarray.offset(i as isize) {
          Some(o) => o,
          None => continue,
        };

        // get TargetInstance
        let mut tgt_instance = Variant::VariantInit();
        let mut cim_type = Wmi::CIM_EMPTY;
        let result = apobject.Get(
          &BSTR::from("TargetInstance"),
          0,
          &mut tgt_instance,
          Some(&mut cim_type as *mut _ as *mut i32),
          None,
        );
        if result.is_err() {
          log::error(
            format!(
              "failed to retrieve TargetInstance from IWbemClassObject: {}",
              result.unwrap_err()
            )
            .as_str(),
          );
          let _ = Variant::VariantClear(&mut tgt_instance);
          continue;
        }
        let p_unknown = match &*tgt_instance.Anonymous.Anonymous.Anonymous.punkVal {
          Some(p) => std::ptr::from_ref(p),
          None => {
            let _ = Variant::VariantClear(&mut tgt_instance);
            continue;
          }
        };

        // query embedded interface
        let unk_layout = std::alloc::Layout::new::<Wmi::IWbemClassObject>();
        let unsafe_p_unknown: *mut Wmi::IWbemClassObject =
          std::mem::transmute(std::alloc::alloc(unk_layout));

        let hres = (*p_unknown).query(
          &Wmi::IWbemClassObject::IID,
          unsafe_p_unknown as *mut *mut c_void,
        );
        if hres.is_err() {
          log::error(
            format!(
              "failed querying interface from p_unknown: {}",
              hres.message()
            )
            .as_str(),
          );
          let _ = Variant::VariantClear(&mut tgt_instance);
          std::alloc::dealloc(std::mem::transmute(unsafe_p_unknown), unk_layout);
          continue;
        }
        let apobject2: *const Wmi::IWbemClassObject = std::mem::transmute(unsafe_p_unknown);

        // get ExecutablePath
        let mut v_path = Variant::VariantInit();
        let mut cim_type = Wmi::CIM_EMPTY;
        let result = (*apobject2).Get(
          &BSTR::from("ExecutablePath"),
          0,
          &mut v_path,
          Some(&mut cim_type as *mut _ as *mut i32),
          None,
        );
        if result.is_err() {
          log::error(
            format!(
              "failed to retrieve ExecutablePath from IWbemClassObject: {}",
              result.unwrap_err()
            )
            .as_str(),
          );
          let _ = Variant::VariantClear(&mut tgt_instance);
          let _ = Variant::VariantClear(&mut v_path);
          std::alloc::dealloc(std::mem::transmute(unsafe_p_unknown), unk_layout);
          continue;
        }

        // get ProcessId
        let mut v_pid = Variant::VariantInit();
        let mut cim_type = Wmi::CIM_EMPTY;
        let result = (*apobject2).Get(
          &BSTR::from("ProcessId"),
          0,
          &mut v_pid,
          Some(&mut cim_type as *mut _ as *mut i32),
          None,
        );
        if result.is_err() {
          log::error(
            format!(
              "failed to retrieve ProcessId from IWbemClassObject: {}",
              result.unwrap_err()
            )
            .as_str(),
          );
          let _ = Variant::VariantClear(&mut tgt_instance);
          let _ = Variant::VariantClear(&mut v_path);
          let _ = Variant::VariantClear(&mut v_pid);
          std::alloc::dealloc(std::mem::transmute(unsafe_p_unknown), unk_layout);
          continue;
        }

        // send message back to RX
        let path = v_path.Anonymous.Anonymous.Anonymous.bstrVal.to_string();
        // if path is null (usually caused by insufficient privilege), continue without sending message
        if path == "" {
          let _ = Variant::VariantClear(&mut tgt_instance);
          let _ = Variant::VariantClear(&mut v_path);
          let _ = Variant::VariantClear(&mut v_pid);
          std::alloc::dealloc(std::mem::transmute(unsafe_p_unknown), unk_layout);
          continue;
        }
        let pid = v_pid.Anonymous.Anonymous.Anonymous.uintVal;
        // check sink type and send corresponding message
        let msg = match self.s_type {
          SinkType::ProcessStart => ProcessMessage {
            path: path,
            pid: pid,
            status: ProcessStatus::Started,
          },
          SinkType::ProcessStop => ProcessMessage {
            path: path,
            pid: pid,
            status: ProcessStatus::Terminated,
          },
        };
        match self.tx.try_send(msg) {
          Ok(_) => {}
          Err(TrySendError::Closed(_)) => {
            let _ = Variant::VariantClear(&mut tgt_instance);
            let _ = Variant::VariantClear(&mut v_path);
            let _ = Variant::VariantClear(&mut v_pid);
            std::alloc::dealloc(std::mem::transmute(unsafe_p_unknown), unk_layout);
            break;
          }
          Err(_) => {}
        }

        // Clean up all resources at the end of each iteration to prevent accumulation
        let _ = Variant::VariantClear(&mut tgt_instance);
        let _ = Variant::VariantClear(&mut v_path);
        let _ = Variant::VariantClear(&mut v_pid);
        std::alloc::dealloc(std::mem::transmute(unsafe_p_unknown), unk_layout);
      }
    }
    Ok(())
  }

  fn SetStatus(
    &self,
    _lflags: i32,
    _hresult: HRESULT,
    _strparam: &BSTR,
    _pobjparam: Ref<Wmi::IWbemClassObject>,
  ) -> Result<()> {
    Ok(())
  }
}
