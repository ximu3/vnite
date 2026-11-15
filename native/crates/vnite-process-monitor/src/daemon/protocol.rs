use serde::Deserialize;
use serde_json::Value;
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};

pub const VERSION: u32 = 8;
// Snapshots are returned in one frame, including during initialization.
pub const MAX_FRAME: usize = 16 * 1024 * 1024;

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub enum Command {
  Hello {
    version: u32,
    token: String,
    mode: String,
  },
  Refresh,
}

pub async fn read_frame(reader: &mut (impl AsyncRead + Unpin)) -> std::io::Result<Command> {
  let size = reader.read_u32_le().await? as usize;
  if size == 0 || size > MAX_FRAME {
    return Err(std::io::Error::new(
      std::io::ErrorKind::InvalidData,
      "invalid frame length",
    ));
  }
  let mut bytes = vec![0; size];
  reader.read_exact(&mut bytes).await?;
  serde_json::from_slice(&bytes)
    .map_err(|error| std::io::Error::new(std::io::ErrorKind::InvalidData, error))
}

pub async fn write_frame(
  writer: &mut (impl AsyncWrite + Unpin),
  message: &Value,
) -> std::io::Result<()> {
  let bytes = serde_json::to_vec(message)?;
  if bytes.len() > MAX_FRAME {
    return Err(std::io::Error::new(
      std::io::ErrorKind::InvalidData,
      "frame too large",
    ));
  }
  writer.write_u32_le(bytes.len() as u32).await?;
  writer.write_all(&bytes).await
}

#[cfg(test)]
mod tests {
  use super::*;
  #[tokio::test]
  async fn rejects_oversized_and_unknown_commands() {
    let bytes = ((MAX_FRAME + 1) as u32).to_le_bytes();
    let error = read_frame(&mut &bytes[..]).await.err().unwrap();
    assert_eq!(error.kind(), std::io::ErrorKind::InvalidData);
    assert!(serde_json::from_str::<Command>(r#"{"type":"execute","id":1}"#).is_err());
    assert!(serde_json::from_str::<Command>(
      r#"{"type":"hello","version":8,"token":"","mode":"normal","command":"x"}"#
    )
    .is_err());
  }
}
