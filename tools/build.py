"""Builds the five pages from one shared header/footer.
Run:  python3 tools/build.py   (from the repo root)
Edit page content in tools/pages/*.html, then run this again."""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "tools" / "pages"

NAV = [("/", "Home"), ("/features", "Features"), ("/how-it-works", "How it works"), ("/download", "Download"), ("/faq", "FAQ")]

META = {
    "index": ("/", "S-CLAW — the AI that uses your computer for you",
              "Type what you want done in plain English. S-CLAW does it on your own computer and asks before anything important. Free, private, no account."),
    "features": ("/features", "What S-CLAW can do — S-CLAW",
                 "Messages, documents, the web, your calendar and more. See the sentences you can hand to S-CLAW."),
    "how-it-works": ("/how-it-works", "How S-CLAW works — S-CLAW",
                     "You type a task, S-CLAW plans it, does it on your computer, and waits for your OK before anything important."),
    "download": ("/download", "Download S-CLAW — Windows, Mac and Linux",
                 "Download S-CLAW free for Windows, Mac or Linux. No account. Ready in about five minutes."),
    "faq": ("/faq", "Questions — S-CLAW", "Answers about price, internet, safety, Mac, WhatsApp and offline installs."),
}

HEAD = """<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content="{desc}" />
  <meta name="theme-color" content="#0f1226" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:image" content="/assets/icon-512.png" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/icon-512.png" />
  <link rel="preload" href="/fonts/bricolage.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/figtree.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/styles.css" />
  <script>
    try {{ var t = localStorage.getItem("sclaw-theme"); if (t) document.documentElement.dataset.theme = t;
      else if (matchMedia("(prefers-color-scheme: light)").matches) document.documentElement.dataset.theme = "light"; }} catch (e) {{}}
  </script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
"""

def header(path):
    links = "\n".join(
        f'        <a href="{h}"{" aria-current=\"page\"" if h == path else ""}>{l}</a>' for h, l in NAV)
    return f"""
  <header class="nav" id="nav">
    <div class="wrap nav-inner">
      <a class="brand" href="/" aria-label="S-CLAW home">
        <span class="orb orb-sm" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="brand-name">S-CLAW</span>
      </a>
      <nav class="nav-links" aria-label="Main">
{links}
      </nav>
      <div class="nav-actions">
        <button class="icon-btn" id="themeBtn" type="button" aria-label="Switch to light mode">
          <svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>
          <svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>
        </button>
        <a class="btn btn-primary btn-sm" href="/download">Download</a>
        <button class="icon-btn menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </div>
    </div>
    <nav class="mobile-menu" id="mobileMenu" aria-label="Mobile">
{links}
      <a class="btn btn-primary" href="/download">Download S-CLAW</a>
    </nav>
  </header>
"""

FOOTER = """
  <footer class="foot">
    <div class="wrap">
      <div class="foot-grid">
        <div>
          <a class="brand" href="/"><span class="orb orb-sm" aria-hidden="true"><i></i><i></i><i></i></span><span class="brand-name">S-CLAW</span></a>
          <p class="foot-tag">The free, private AI that uses your computer for you.</p>
        </div>
        <nav aria-label="Product">
          <h4>Product</h4>
          <a href="/features">What it can do</a>
          <a href="/how-it-works">How it works</a>
          <a href="/download">Download</a>
        </nav>
        <nav aria-label="Help">
          <h4>Help</h4>
          <a href="/faq">Questions</a>
          <a href="/download#offline">Install without internet</a>
        </nav>
      </div>
      <p class="foot-bottom">Made by Oluwaseun Joshua, <span id="year">2026</span>.</p>
    </div>
  </footer>
"""

for name, (path, title, desc) in META.items():
    body = (PAGES / f"{name}.html").read_text()
    scripts = '  <script src="/downloads.js"></script>\n  <script src="/app.js"></script>\n'
    if name == "index":
        scripts += ('  <script type="importmap">{ "imports": { "three": "/vendor/three.module.min.js" } }</script>\n'
                    '  <script type="module" src="/hero3d.js"></script>\n')
    html = HEAD.format(title=title, desc=desc) + header(path) + '\n  <main id="main">\n' + body.rstrip() + "\n  </main>\n" + FOOTER + "\n" + scripts + "</body>\n</html>\n"
    (ROOT / f"{name}.html").write_text(html)
    print("built", name)
