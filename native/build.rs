extern crate napi_build;

// use std::fs;
// use std::path::Path;

fn main() {
  napi_build::setup();

  // copy package.json to out directory
  // let out_dir = Path::new("dist");
  // match fs::exists(out_dir) {
  //   Ok(flag) => {
  //     if !flag {
  //       fs::create_dir(out_dir).expect("Failed to create dist directory");
  //     }
  //   }
  //   Err(err) => panic!("Failed to check existence of dist directory: {}", err),
  // }
  // let dst = out_dir.join("package.json");
  // fs::copy("package.json", dst).expect("Failed to copy package.json to dist directory");
}
