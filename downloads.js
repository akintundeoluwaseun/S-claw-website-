/*
  S-CLAW download links — the ONLY file you edit for downloads.

  Links always serve the newest checked release, so nothing here needs
  changing when a new version is published. Downloads start in the
  background; visitors stay on the website.
*/
(function () {
  var BASE = "https://github.com/akintundeoluwaseun/oluwaseun-claw/releases/latest/download/";

  window.SCLAW_DOWNLOADS = {
    windows: {
      name: "Windows", label: "Windows 10 or 11",
      file: "S-CLAW-Windows-Setup.exe", size: "268 MB",
      url: BASE + "S-CLAW-Windows-Setup.exe",
      install: [
        { title: "Open the file", text: "Find <b>S-CLAW-Windows-Setup.exe</b> in your Downloads and double-click it.", visual: "file" },
        { title: "Allow it to run", text: "If a blue box says “Windows protected your PC”, click <b>More info</b>, then <b>Run anyway</b>. This is normal for new apps.", visual: "smartscreen" },
        { title: "Install", text: "Click <b>Install</b> and wait about a minute. S-CLAW opens by itself.", visual: "installer" },
      ],
    },

    mac: {
      name: "Mac", label: "Apple M-series Macs (M1 or newer)",
      file: "S-CLAW-Mac.dmg", size: "",
      url: BASE + "S-CLAW-Mac.dmg",
      note: "For M-series Macs only (M1, M2, M3, M4). Older Intel Macs aren't supported yet.",
      install: [
        { title: "Open the file", text: "Double-click <b>S-CLAW-Mac.dmg</b> in your Downloads.", visual: "file" },
        { title: "Drag to Applications", text: "Drag the S-CLAW icon onto the <b>Applications</b> folder.", visual: "drag" },
        { title: "Open it the first time", text: "In Applications, <b>right-click</b> S-CLAW and choose <b>Open</b>, then <b>Open</b> again. You only do this once.", visual: "rightclick" },
      ],
    },

    linux: {
      name: "Linux", label: "Ubuntu, Debian, Fedora and most others",
      file: "S-CLAW-Linux.AppImage", size: "",
      url: BASE + "S-CLAW-Linux.AppImage",
      install: [
        { title: "Allow it to run", text: "Right-click <b>S-CLAW-Linux.AppImage</b> → <b>Properties</b> → turn on <b>Allow executing as a program</b>.", visual: "exec" },
        { title: "Open it", text: "Double-click the file. No installing needed.", visual: "file" },
        { title: "Optional: terminal way", text: "Prefer typing? Run <code>chmod +x S-CLAW-Linux.AppImage</code> then <code>./S-CLAW-Linux.AppImage</code>", visual: "terminal" },
      ],
    },

    android: { name: "Android", soon: true },

    /* Brains — only for computers without internet, or many PCs.
       Big brains come in pieces (GitHub's 2 GB file limit). */
    brainBase: BASE,
    brains: [
      { id: "light", name: "Light", ram: "Less than 8 GB", size: "1.9 GB",
        files: ["S-CLAW-Brain-Light-2B.gguf", "S-CLAW-Brain-Light-2B-mmproj.gguf"] },
      { id: "standard", name: "Standard", ram: "8 to 15 GB", size: "3.3 GB",
        files: ["S-CLAW-Brain-Standard-4B-00001-of-00002.gguf", "S-CLAW-Brain-Standard-4B-00002-of-00002.gguf", "S-CLAW-Brain-Standard-4B-mmproj.gguf"] },
      { id: "pro", name: "Pro", ram: "16 GB or more", size: "6.2 GB",
        files: ["S-CLAW-Brain-Pro-8B-00001-of-00003.gguf", "S-CLAW-Brain-Pro-8B-00002-of-00003.gguf", "S-CLAW-Brain-Pro-8B-00003-of-00003.gguf", "S-CLAW-Brain-Pro-8B-mmproj.gguf"] },
    ],
  };
})();
