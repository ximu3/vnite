#[derive(Debug, PartialEq)]
pub enum ProcessStatus {
  Started,
  Terminated,
}

pub struct ProcessMessage {
  pub pid: u32,
  pub status: ProcessStatus,
  pub path: String,
}

pub struct ProcessInfo {
  pub pid: u32,
  pub full_path: String,
}
