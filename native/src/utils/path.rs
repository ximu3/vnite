pub fn normalize_os_path(mut path: String) -> String {
  if cfg!(windows) {
    path.make_ascii_lowercase();
    path.trim_end_matches(['/', '\\']).replace('/', "\\")
  } else {
    path
  }
}
