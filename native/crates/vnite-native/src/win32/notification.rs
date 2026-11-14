use quick_xml::escape::escape;
use windows::{core, Data::Xml::Dom::XmlDocument, UI::Notifications};

pub struct WinNotification {
  app_id: String,
  title: String,
  line1: String,
  line2: String,
  image: String,
  silent: String,
}

impl WinNotification {
  // This is used if no AppUserModelID is provided
  #[allow(dead_code)]
  const POWERSHELL_APP_ID: &'static str =
    "{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe";

  pub fn new(app_id: String) -> Self {
    WinNotification {
      app_id: app_id,
      title: String::new(),
      line1: String::new(),
      line2: String::new(),
      image: String::new(),
      silent: "false".to_owned(),
    }
  }

  pub fn title(&mut self, content: String) {
    self.title = format!(r#"<text id="1">{}</text>"#, escape(content));
  }

  pub fn line1(&mut self, content: String) {
    self.line1 = format!(r#"<text id="2">{}</text>"#, escape(content));
  }

  pub fn line2(&mut self, content: String) {
    self.line2 = format!(r#"<text id="3">{}</text>"#, escape(content));
  }

  pub fn image(&mut self, path: String) {
    self.image = format!(
      r#"<image placement="hero" src="file:///{}" alt="image" />"#,
      escape(path)
    );
  }

  pub fn is_silent(&mut self, silent: bool) {
    self.silent = if silent {
      "true".to_owned()
    } else {
      "false".to_owned()
    };
  }

  pub fn show(&self) -> core::Result<()> {
    let doc = XmlDocument::new()?;
    doc.LoadXml(&core::HSTRING::from(format!(
      r#"
      <toast duration="short">
        <visual>
          <binding template="ToastGeneric">
            {}{}{}{}
          </binding>
        </visual>
        <audio src="ms-winsoundevent:Notification.Default" silent="{}" />
      </toast>
    "#,
      self.image, self.title, self.line1, self.line2, self.silent
    )))?;
    let template = Notifications::ToastNotification::CreateToastNotification(&doc)?;
    let notifier = Notifications::ToastNotificationManager::CreateToastNotifierWithId(
      &core::HSTRING::from(&self.app_id),
    )?;
    notifier.Show(&template)?;
    Ok(())
  }
}
