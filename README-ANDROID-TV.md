# FilmX Android TV

FilmX TV is a separate Android TV app package (`com.finalxgamers.filmxtv`) with a Leanback launcher entry and remote-focused navigation. It installs alongside the FilmX phone app.

## Install on Xiaomi TV

This applies to Xiaomi TVs running Android TV or Google TV:

1. Download `FilmX-TV.apk` from the [FilmX TV 1.0.0 GitHub release](https://github.com/FinalXGamers/FilmX-Releases/releases/download/tv-v1.0.0/FilmX-TV.apk) to a USB drive.
2. Connect the drive to the TV and open the APK using the TV's File Manager.
3. If prompted, allow that file manager to install unknown apps, then return and confirm installation.
4. Open **FilmX TV** from the TV's Apps list and use the D-pad/OK/Back buttons on the remote.

Settings labels differ between Xiaomi TV models and Android versions. Only enable APK installation for the file manager you use, and turn it off again after installation if desired.

## Updates

The TV app checks `app-update-tv.json` and downloads TV APKs from `tv-v*` releases. Keep the TV package ID, increasing version code, and signing key the same for future updates.

## Build from the local project

Keep the `FilmX` and `FilmX-Android` folders side by side in Downloads, install Android SDK 36, Node.js 22+, and JDK 17+, then run:

```powershell
cd "$env:USERPROFILE\Downloads\FilmX-Android"
npm.cmd install
npm.cmd run tv:release
```

The APK is staged at `..\FilmX\downloads\FilmX-TV.apk`.
