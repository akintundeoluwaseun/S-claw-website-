/*
  S-CLAW plugin directory — the ONLY file you edit to add a plugin.

  A plugin is written instructions, never a program: the app refuses any file
  that can execute when it installs one, whatever the plugin claims about
  itself. So a .zip here is a few kilobytes of text, and it lives in this
  repository rather than on a release page.

  To add one:
    1. Put <name>.zip in /downloads/plugins/ (the folder inside it holds
       PLUGIN.md).
    2. Add an entry below. `prompts` should be the same lines as the
       plugin's own `prompts:` field - they are what a person types.
    3. Install it once in S-CLAW before you commit, so the link is known to
       work rather than assumed to.
*/
(function () {
  var BASE = "/downloads/plugins/";

  window.SCLAW_PLUGINS = {
    /* The plugin format this directory is written for. The app refuses a
       plugin written for a newer format and says so, rather than
       half-working. */
    format: "sclaw-plugin/1",

    docs: "https://github.com/akintundeoluwaseun/oluwaseun-claw/blob/main/docs/PLUGINS.md",
    submit: "https://github.com/akintundeoluwaseun/oluwaseun-claw/issues/new?title=Plugin%3A%20%3Cname%3E&body=What%20program%20does%20it%20drive%2C%20and%20a%20link%20to%20the%20.zip",

    items: [
      {
        id: "drive-blender",
        name: "Blender",
        by: "S-CLAW",
        category: "Design & 3D",
        door: "Blender Python",
        summary:
          "Make or change a 3D scene — a model, a product render, a turntable — by writing Blender Python and running it, instead of clicking through the interface.",
        prompts: [
          "Make a 3D model of a coffee mug and render it as a PNG",
          "Set up a turntable animation of this model, 60 frames",
          "Render a product shot of the object on a white background",
        ],
        needs: "Blender, installed from blender.org",
        file: "drive-blender.zip",
        size: "1.3 KB",
        url: BASE + "drive-blender.zip",
        shipped: true,
      },
      {
        id: "drive-libreoffice",
        name: "LibreOffice",
        by: "S-CLAW",
        category: "Office & documents",
        door: "Command line",
        summary:
          "Turn Word, Excel and PowerPoint files into PDF \u2014 one file or a whole folder in one go \u2014 or convert between the formats. Works on a computer with no Microsoft Office on it.",
        prompts: [
          "Turn every quotation in this folder into a PDF",
          "Convert these .doc files to .docx so they open properly",
          "Turn this Word invoice into a PDF",
        ],
        needs: "LibreOffice, free from libreoffice.org",
        file: "drive-libreoffice.zip",
        size: "2.3 KB",
        url: BASE + "drive-libreoffice.zip",
      },
      {
        id: "drive-inkscape",
        name: "Inkscape",
        by: "S-CLAW",
        category: "Design",
        door: "Command line",
        summary:
          "Convert, resize and export vector artwork — SVG to PNG or PDF, change a logo's size, flatten text to paths — with one command instead of an export dialog.",
        prompts: [
          "Export this logo.svg as a 1024px wide PNG with a transparent background",
          "Turn every SVG in this folder into a PDF",
          "Flatten the text in this SVG to paths so it opens anywhere",
        ],
        needs: "Inkscape 1.0 or newer, installed from inkscape.org",
        file: "drive-inkscape.zip",
        size: "1.7 KB",
        url: BASE + "drive-inkscape.zip",
      },
    ],
  };
})();
