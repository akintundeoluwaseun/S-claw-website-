---
format: sclaw-plugin/1
name: drive-inkscape
description: Convert, resize and export vector artwork with Inkscape - SVG to PNG or PDF, change a logo's size, flatten text to paths - by writing its command line.
app: Inkscape
programs: inkscape
door: cli
version: 1
author: S-CLAW
triggers: inkscape, svg, vector, logo, export png, trace, eps
categories: design
prompts:
  - Export this logo.svg as a 1024px wide PNG with a transparent background
  - Turn every SVG in this folder into a PDF
  - Flatten the text in this SVG to paths so it opens anywhere
---
Inkscape takes a full command line, so do NOT drive it with the mouse. One
`run_command` does in a second what clicking through export dialogs does in a
minute, and it can be repeated over a whole folder.

How to do it:

1. Work out the one command that does the job, then run it with run_command,
   program "inkscape".
2. Always pass `--export-filename` so the output goes where the person
   authorised it, not next to the original.
3. Reopen what was written and check it: an export of 0 bytes, or a PNG that
   is entirely transparent, means the drawing was empty or the area was wrong.

The commands that cover most requests:

- SVG to PNG at a chosen width:
  ["--export-type=png", "--export-width=1024",
   "--export-filename=<out.png>", "<in.svg>"]
- SVG to PDF or EPS: `--export-type=pdf` (or `eps`). For PDF, add
  `--export-text-to-path` if the text must look the same on a machine that
  does not have the font.
- Export only the drawing, not the whole page:
  add `--export-area-drawing`. Use `--export-area-page` to force the page.
- Keep transparency: it is the default for PNG. To get a white background
  instead, add `--export-background=white --export-background-opacity=1`.
- Flatten text to paths in an SVG:
  ["--export-type=svg", "--export-plain-svg", "--export-text-to-path",
   "--export-filename=<out.svg>", "<in.svg>"]
- Ask what is in a file before converting it:
  ["--query-width", "<in.svg>"] and `--query-height` print the size.

Things that go wrong and how to avoid them:

- Inkscape 1.x changed the command line. If a command is rejected, check the
  version with ["--version"] first: Inkscape 0.92 used `--export-png=` and
  `--export-area-drawing` behaves differently there.
- `--export-width` and `--export-height` together will stretch the picture.
  Give one of them and let the other follow the aspect ratio.
- Exporting many files: run one command per file rather than building a
  shell loop. Each one is quick, and a loop that fails halfway leaves no
  record of which files were done.
- On Windows the program may be installed as `inkscape.exe` in
  `C:\Program Files\Inkscape\bin`. If run_command cannot find it, say so and
  ask the person to confirm the program is installed, rather than guessing a
  path.
- Inkscape prints warnings about fonts and profiles that are not errors. A
  job failed only if the output file is missing or empty.
