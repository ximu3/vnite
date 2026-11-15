fn main() {
  println!("cargo:rerun-if-changed=monitor.manifest");
  if std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("msvc") {
    let manifest =
      std::path::Path::new(&std::env::var("CARGO_MANIFEST_DIR").unwrap()).join("monitor.manifest");
    println!("cargo:rustc-link-arg-bin=vnite-process-monitor=/MANIFEST:EMBED");
    println!(
      "cargo:rustc-link-arg-bin=vnite-process-monitor=/MANIFESTINPUT:{}",
      manifest.display()
    );
  }
}
