/*
  S-CLAW download links — the ONLY file you edit for downloads.

  Every link always serves the newest checked release, so nothing here
  needs changing when a new version is published. Clicking a link starts
  the download straight away (no GitHub page is shown).
*/
(function () {
  var BASE = "https://github.com/akintundeoluwaseun/oluwaseun-claw/releases/latest/download/";

  window.SCLAW_DOWNLOADS = {
    version: "", // leave empty: links always give the latest version

    windows: {
      label: "Windows 10 & 11",
      builds: [
        { name: "for Windows", note: "One installer for every PC · brain is set up on first start",
          url: BASE + "S-CLAW-Windows-Setup.exe" },
      ],
      steps: [
        "Open <b>S-CLAW-Windows-Setup.exe</b>.",
        "If Windows shows “Windows protected your PC”, choose <em>More info → Run anyway</em>.",
        "On first start, press <b>Download</b> to give S-CLAW its brain. Then type your first task.",
      ],
    },

    mac: {
      label: "macOS · Apple M-series Macs (M1, M2, M3, M4)",
      builds: [
        { name: "for Mac", note: "For M-series Macs only · not for older Intel Macs",
          url: BASE + "S-CLAW-Mac.dmg" },
      ],
      steps: [
        "Open <b>S-CLAW-Mac.dmg</b> and drag S-CLAW into Applications.",
        "The first time only: <b>right-click</b> S-CLAW → <b>Open</b> → Open. (The app isn't signed by Apple yet.)",
        "On first start, press <b>Download</b> to give S-CLAW its brain.",
      ],
    },

    linux: {
      label: "Ubuntu, Debian, Fedora & most distros",
      builds: [
        { name: "for Linux", note: "AppImage · runs without installing",
          url: BASE + "S-CLAW-Linux.AppImage" },
      ],
      steps: [
        "Right-click <b>S-CLAW-Linux.AppImage</b> → Properties → allow it to run as a program.<br>Or in a terminal: <code>chmod +x S-CLAW-Linux.AppImage</code>",
        "Double-click it to start.",
        "On first start, press <b>Download</b> to give S-CLAW its brain.",
      ],
    },

    android: {
      label: "Android",
      soon: true,
      builds: [],
      steps: [],
    },

    /* Brains — only needed for offline installs or setting up several PCs.
       Big brains come in pieces (GitHub's 2 GB file limit). */
    brains: [
      { id: "light", name: "Light", model: "2B", size: "1.9 GB", fits: "Older or low-memory laptops",
        files: ["S-CLAW-Brain-Light-2B.gguf", "S-CLAW-Brain-Light-2B-mmproj.gguf"] },
      { id: "standard", name: "Standard", model: "4B", size: "3.3 GB", fits: "Most laptops · 8 GB RAM or more", recommended: true,
        files: ["S-CLAW-Brain-Standard-4B-00001-of-00002.gguf", "S-CLAW-Brain-Standard-4B-00002-of-00002.gguf", "S-CLAW-Brain-Standard-4B-mmproj.gguf"] },
      { id: "pro", name: "Pro", model: "8B", size: "6.2 GB", fits: "Smarter · 16 GB RAM or more",
        files: ["S-CLAW-Brain-Pro-8B-00001-of-00003.gguf", "S-CLAW-Brain-Pro-8B-00002-of-00003.gguf", "S-CLAW-Brain-Pro-8B-00003-of-00003.gguf", "S-CLAW-Brain-Pro-8B-mmproj.gguf"] },
    ],
    brainBase: BASE,
  };
})();
