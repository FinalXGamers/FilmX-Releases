# FilmX releases

This repository contains FilmX Android and desktop release assets. The `website-update` folder contains changed website files in their upload paths; copy them to the matching paths on the live FilmX host to publish the website changes. A GitHub commit does not update the InfinityFree-hosted site.

Android updates use `app-update.json` in this repository's main branch. Publish the APK release first, then update the metadata to point to that release asset. Starting with Android 1.8.2, newer updates block the app, download with live progress, and require installation before FilmX can be used. Version 1.8.4 refreshes the FilmX branding and narrow-screen layout.

Desktop installers are built and published by the **Build FilmX desktop apps** workflow in GitHub Actions.

The smaller Windows WebView installer is published by **Build small FilmX Windows app**. It uses the FilmX icon and a standard install wizard, and relies on the system WebView2 runtime instead of bundling Chromium. The Windows download is published at `desktop-v1.0.3`; the existing macOS and Linux downloads remain in `desktop-v1.0.1`.

The separate Android TV edition is published as `FilmX-TV.apk` in `tv-v*` releases. Its updater uses `app-update-tv.json`; Xiaomi TV installation instructions are in [README-ANDROID-TV.md](./README-ANDROID-TV.md).
