---
format: sclaw-plugin/1
name: drive-libreoffice
description: Turn Word, Excel and PowerPoint files into PDF, CSV or each other - one file or a whole folder - using LibreOffice from the command line.
app: LibreOffice
programs: soffice
door: cli
version: 1
author: S-CLAW
triggers: pdf, convert, docx, pptx, word, powerpoint, libreoffice, convert to pdf
categories: office, documents
prompts:
  - Turn every quotation in this folder into a PDF
  - Convert these .doc files to .docx so they open properly
  - Turn this Word invoice into a PDF
---
LibreOffice converts documents from the command line, so do NOT open Word or
Excel and click File > Save As. One command does a whole folder, and it works
on a computer that does not have Microsoft Office at all.

How to do it:

1. Run it with run_command, program "soffice".
2. Always pass `--headless` (no window opens) and `--outdir` (see the first
   trap below).
3. Then CHECK, because soffice lies about whether it worked. See "Reading the
   result" - this part is not optional.

The commands that cover most requests:

- Anything to PDF:
  ["--headless", "--convert-to", "pdf", "--outdir", "<out folder>", "<file>"]
  Works for .docx, .doc, .xlsx, .xls, .pptx, .ppt, .odt, .ods, .rtf, .txt.
- A whole folder in ONE launch - list the files after each other:
  ["--headless", "--convert-to", "pdf", "--outdir", "<out>", "a.docx", "b.xlsx"]
  Do this rather than one launch per file. Starting LibreOffice is the slow
  part, and it only pays it once.
- Spreadsheet to CSV:
  ["--headless", "--convert-to", "csv", "--outdir", "<out>", "<file.xlsx>"]
  Only the FIRST sheet is written. For another sheet, say so plainly rather
  than silently returning the wrong one.
- Old format to new: `--convert-to docx`, `--convert-to xlsx`,
  `--convert-to pptx`. Good for .doc files that will not open.
- To plain text for reading: `--convert-to txt`.

Reading the result - soffice's exit code is worthless:

- It exits 0 when the file does not exist. It prints
  "Error: source file could not be loaded" and exits 0 anyway. (Checked
  against LibreOffice 24.2.)
- It exits 0 on a file that is not really a document, and writes a PDF of
  the gibberish inside it.
- So: after every run, check the output file exists AND read what soffice
  printed. "Error:" in the output means it failed, whatever the exit code
  said. A PDF of a few hundred bytes from a real document is a bad sign too.

Other traps:

- WITHOUT `--outdir` the converted file lands next to the original, which may
  be a folder the person did not authorise. Always pass it.
- It overwrites an existing output file without asking and prints
  "Overwriting: ...". If the person would mind, convert into a new folder.
- Only one LibreOffice can run at a time per profile. If the person has
  LibreOffice open on screen, a headless run can fail or take over their
  window. Add a private profile so it never touches theirs:
  "-env:UserInstallation=file:///C:/Users/<name>/AppData/Local/Temp/claw-lo"
  as the FIRST argument (on Linux or Mac, a file:/// path under /tmp).
- The first run with a new profile is slow - ten or twenty seconds - because
  it is being created. Later runs are quick. Do not treat the first one as a
  hang.
- A warning about "javaldx" or Java is normal and is not a failure. Only
  "Error:" is.
- On Windows the program is usually NOT on the PATH; it lives in
  "C:\Program Files\LibreOffice\program\soffice.exe". If run_command cannot
  find "soffice", say so and tell the person they can add that folder under
  Settings > Limits, rather than guessing paths.
- Layout can shift slightly from Word's, especially fonts the computer does
  not have. For a quotation or an invoice this is fine; if the person needs
  an exact match of a Word layout, tell them so instead of pretending.

A note on CSV, for anyone copying this plugin as a template:

Converting a spreadsheet to CSV is listed above and works. It is deliberately
NOT in `triggers` or `prompts`, because S-CLAW ships a built-in recipe for
spreadsheets and the words "spreadsheet", "excel" and "csv" belong to it.
Claiming them here made S-CLAW pick this plugin for "put these five rows into
an excel file", which it cannot do. Advertising a job whose requests get
routed elsewhere is worse than not advertising it: fill `triggers` and
`prompts` with what your plugin wins cleanly, and leave the rest in the
instructions for when it is chosen for a neighbouring job.
