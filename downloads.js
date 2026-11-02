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
      name: "Windows", system: "Windows 10 or 11",
      file: "S-CLAW-Windows-Setup.exe", size: "268 MB",
      url: BASE + "S-CLAW-Windows-Setup.exe",
      // what the visitor sees while installing (shown one after another)
      install: [
        { vis: "file", text: "Open <b>S-CLAW-Windows-Setup.exe</b> from your Downloads." },
        { vis: "smartscreen", text: "If Windows says it protected your PC, click <b>More info</b>, then <b>Run anyway</b>. This is normal for new apps." },
        { vis: "installer", text: "Click <b>Install</b>. It takes about a minute, then S-CLAW opens." },
      ],
    },
    mac: {
      name: "Mac", system: "Macs with Apple M-series chips (M1 or newer)",
      file: "S-CLAW-Mac.dmg", size: "",
      url: BASE + "S-CLAW-Mac.dmg",
      note: "Older Intel Macs aren't supported yet.",
      install: [
        { vis: "file", text: "Open <b>S-CLAW-Mac.dmg</b> from your Downloads." },
        { vis: "drag", text: "Drag S-CLAW into your <b>Applications</b> folder." },
        { vis: "rightclick", text: "The first time only: <b>right-click</b> S-CLAW in Applications and choose <b>Open</b>, then <b>Open</b> again." },
      ],
    },
    linux: {
      name: "Linux", system: "Ubuntu, Debian, Fedora and most others",
      file: "S-CLAW-Linux.AppImage", size: "",
      url: BASE + "S-CLAW-Linux.AppImage",
      install: [
        { vis: "exec", text: "Right-click <b>S-CLAW-Linux.AppImage</b>, open <b>Properties</b> and turn on <b>Allow executing as a program</b>." },
        { vis: "file", text: "Double-click the file to open S-CLAW. Nothing to install. Prefer the terminal? <code>chmod +x S-CLAW-Linux.AppImage</code>" },
      ],
    },
    android: { name: "Android", soon: true },

    /* Brains — only for computers without internet, or many computers.
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
