# FilmX releases

This repository contains FilmX Android and desktop release assets. The `website-update` folder contains changed website files in their upload paths; copy them to the matching paths on the live FilmX host to publish the website changes. A GitHub commit does not update the InfinityFree-hosted site.

Android updates use `app-update.json` in this repository's main branch. Publish the APK release first, then update the metadata to point to that release asset.

Desktop installers are built and published by the **Build FilmX desktop apps** workflow in GitHub Actions.
