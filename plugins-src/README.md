# Plugin sources

The unzipped text of every plugin in `/downloads/plugins/`. It is here so the
contents of a file people install can be read in a diff, rather than only as a
zip nobody opens.

A plugin is one folder holding `PLUGIN.md`. Rebuild a zip from this folder:

    cd plugins-src && zip -r -X ../downloads/plugins/<name>.zip <name>

`drive-blender` is also shipped inside S-CLAW itself
(`backend/claw/skills/drive-blender/` in the app repository); the copy here is
the same file, offered as a download so the format has a worked example.

Before listing a plugin, install its zip in S-CLAW once. A link that was never
tried is a link that does not work.
