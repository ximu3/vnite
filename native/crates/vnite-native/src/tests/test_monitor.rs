use crate::foreground;

#[tokio::test]
async fn test_foreground_hook() {
  foreground::install_hook(None)
    .await
    .expect("install foreground hook");

  foreground::uninstall_hook().await;
}
