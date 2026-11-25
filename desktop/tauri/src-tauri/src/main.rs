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

fn is_desktop_update_url(url: &Url) -> bool {
    let asset = match PLATFORM {
        "win32" => "Windows-Setup.exe",
        "darwin" => "macOS.dmg",
        "linux" => "Linux.AppImage",
        _ => return false,
    };
    let segments: Vec<_> = match url.path_segments() {
        Some(segments) => segments.collect(),
        None => return false,
    };
    if url.scheme() != "https"
        || url.host_str() != Some("github.com")
        || segments.len() != 6
        || segments[0] != "FinalXGamers"
        || segments[1] != "FilmX-Releases"
        || segments[2] != "releases"
        || segments[3] != "download"
    {
        return false;
    }

    let release_version = match segments[4].strip_prefix("desktop-v") {
        Some(version) if is_semver(version) => version,
        _ => return false,
    };
    let asset_version = match segments[5]
        .strip_prefix("FilmX-")
        .and_then(|name| name.strip_suffix(&format!("-{asset}")))
    {
        Some(version) if is_semver(version) => version,
        _ => return false,
    };

    release_version == asset_version
}

fn is_semver(version: &str) -> bool {
    let parts: Vec<_> = version.split('.').collect();
    parts.len() == 3
        && parts
            .iter()
            .all(|part| !part.is_empty() && part.bytes().all(|byte| byte.is_ascii_digit()))
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
                .title("FilmX · Made By FinalXGamers")
                .inner_size(1440.0, 920.0)
                .min_inner_size(900.0, 640.0)
                .initialization_script(script)
                .on_navigation(|url| {
                    if url.origin().ascii_serialization() == FILMX_ORIGIN {
                        return true;
                    }
                    if is_desktop_update_url(url) {
                        open_external(url);
                    }
                    false
                })
                .on_new_window(|_, _| NewWindowResponse::Deny)
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("FilmX desktop app failed to start");
}
