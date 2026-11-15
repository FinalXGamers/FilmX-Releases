#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    webview::{NewWindowResponse, WebviewWindowBuilder},
    WebviewUrl,
};
use url::Url;

const FILMX_ORIGIN: &str = "https://filmx.is-best.net";

#[cfg(target_os = "windows")]
const PLATFORM: &str = "win32";
#[cfg(target_os = "macos")]
const PLATFORM: &str = "darwin";
#[cfg(target_os = "linux")]
const PLATFORM: &str = "linux";

fn open_external(url: &Url) {
    if url.scheme() != "https" {
        return;
    }

    if let Err(error) = open::that(url.as_str()) {
        eprintln!("[FilmX] Could not open external link: {error}");
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let url = Url::parse(FILMX_ORIGIN)?;
            let script = format!(
                "window.FMX_DESKTOP = Object.freeze({{version:{:?},platform:{:?},openExternal:function(url){{if(typeof url==='string'&&url.indexOf('https://')===0)location.assign(url)}}}});",
                env!("CARGO_PKG_VERSION"),
                PLATFORM
            );

            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
                .title("FilmX")
                .inner_size(1440.0, 920.0)
                .min_inner_size(900.0, 640.0)
                .initialization_script(script)
                .on_navigation(|url| {
                    if url.origin().ascii_serialization() == FILMX_ORIGIN {
                        return true;
                    }
                    open_external(url);
                    false
                })
                .on_new_window(|url, _| {
                    open_external(&url);
                    NewWindowResponse::Deny
                })
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("FilmX desktop app failed to start");
}
