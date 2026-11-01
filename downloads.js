/*
  S-CLAW download links — the ONLY file you edit when a new version is out.

  Each "url" is a direct file link. Visitors click and the file downloads
  straight away: no GitHub, no sign-in, no extra pages.

  Small files (under ~100 MB) can sit in this site's /downloads folder,
  e.g. "/downloads/S-CLAW-Android.apk".
  Big installers (the Windows ones are 3–7 GB) should be uploaded to file
  storage such as Cloudflare R2, Backblaze B2 or Bunny CDN, then paste the
  public link here.
*/
window.SCLAW_DOWNLOADS = {
  version: "0.5.0",

  windows: {
    label: "Windows 10 & 11",
    builds: [
      {
        id: "standard",
        name: "Standard",
        note: "Most laptops · 8 GB RAM or more",
        size: "3.6 GB",
        url: "/downloads/S-CLAW-0.5.0-Standard-Setup.exe",
      },
      {
        id: "pro",
        name: "Pro",
        note: "Smarter & faster · 16 GB RAM or more",
        size: "6.5 GB",
        url: "/downloads/S-CLAW-0.5.0-Pro-Setup.exe",
      },
    ],
  },

  mac: {
    label: "macOS 12 or later",
    builds: [
      { id: "mac", name: "Apple Silicon & Intel", note: "Universal app · 8 GB RAM or more", size: "3.6 GB",
        url: "/downloads/S-CLAW-0.5.0-mac.dmg" },
    ],
  },

  linux: {
    label: "Ubuntu, Debian, Fedora & more",
    builds: [
      { id: "linux", name: "AppImage", note: "Runs on most distros · 8 GB RAM or more", size: "3.6 GB",
        url: "/downloads/S-CLAW-0.5.0-linux.AppImage" },
    ],
  },

  android: {
    label: "Android 9 or later",
    builds: [
      { id: "android", name: "Phone app", note: "Control S-CLAW on your computer from your phone", size: "48 MB",
        url: "/downloads/S-CLAW-0.5.0-android.apk" },
    ],
  },
};
