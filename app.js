(function () {
  "use strict";
  var D = window.SCLAW_DOWNLOADS || {};
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fileName(url) { try { return decodeURIComponent(url.split("?")[0].split("/").pop()); } catch (e) { return ""; } }
  var DL_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>';

  /* ---------- theme ---------- */
  var themeBtn = $("themeBtn");
  function syncTheme() {
    var dark = root.dataset.theme === "dark";
    themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? "#0f1226" : "#f2f3fa";
  }
  themeBtn.addEventListener("click", function () {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("sclaw-theme", root.dataset.theme); } catch (e) {}
    syncTheme();
  });
  syncTheme();

  /* ---------- nav ---------- */
  var nav = $("nav");
  var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 6); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  var menuBtn = $("menuBtn"), menu = $("mobileMenu");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  if ($("year")) $("year").textContent = new Date().getFullYear();

  /* ---------- which computer is the visitor on? ---------- */
  var ua = navigator.userAgent || "";
  var onPhone = /android|iphone|ipad|ipod/i.test(ua);
  function detectOS() {
    if (onPhone) return null;
    if (/mac/i.test(ua)) return "mac";
    if (/linux|x11|cros/i.test(ua)) return "linux";
    if (/win/i.test(ua)) return "windows";
    return null;
  }
  var detected = detectOS();
  var mine = detected && D[detected] && D[detected].url ? D[detected] : null;

  // every "Download S-CLAW" button downloads straight away for this computer
  if (mine) {
    var heroDl = $("heroDl");
    if (heroDl) {
      heroDl.href = mine.url;
      $("heroDlText").textContent = "Download for " + mine.name;
      $("heroFine").innerHTML = "Free" + (mine.size ? ", " + esc(mine.size) : "") + ". Other computers and the install guide are on the <a href=\"/download\">Download page</a>.";
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-os-download]"), function (a) {
      a.href = mine.url; a.innerHTML = DL_ICON + " Download for " + esc(mine.name);
    });
  }

  /* ---------- downloads start in the background (you stay on the site) ---------- */
  var toast;
  function showToast(name) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "dl-toast"; toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.innerHTML = '<span class="dl-toast-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></span>' +
      "<span><b>Download started</b><small>" + esc(name) + " is being saved to your Downloads.</small></span>";
    toast.classList.remove("show"); void toast.offsetWidth; toast.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { toast.classList.remove("show"); }, 5500);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || (a.getAttribute("href") || "").indexOf("/releases/latest/download/") === -1) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    var f = document.createElement("iframe");
    f.style.display = "none"; f.setAttribute("aria-hidden", "true"); f.src = a.href;
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 120000);
    showToast(fileName(a.href));
  });

  /* ---------- Download page ---------- */
  var osPick = $("osPick");
  if (osPick) {
    var VIS = {
      download: function (p) {
        return '<div class="vis v-dl"><div class="v-file"><span class="fi">' + DL_ICON + '</span><span><span class="fn">' + esc(p.file) +
          '</span><br><span class="fs">' + (p.size ? esc(p.size) + ", " : "") + 'saving to Downloads</span><span class="v-bar"><i></i></span></span></div></div>';
      },
      file: function (p) {
        return '<div class="vis v-dl"><div class="v-file hl"><span class="fi">' + DL_ICON + '</span><span><span class="fn">' + esc(p.file) + '</span><br><span class="fs">Double-click to open</span></span></div></div>';
      },
      smartscreen: function () {
        return '<div class="vis"><div class="v-ss"><p class="t">Windows protected your PC</p><p class="s">Microsoft Defender SmartScreen prevented an unrecognised app from starting.</p>' +
          '<p class="m"><u class="hl">More info</u></p><div class="b"><span class="go hl">Run anyway</span><span>Don\'t run</span></div></div></div>';
      },
      installer: function () {
        return '<div class="vis"><div class="v-inst"><div class="row"><span class="orb orb-xs"><i></i><i></i><i></i></span>S-CLAW Setup</div><div class="v-bar"><i></i></div><span class="go hl">Install</span></div></div>';
      },
      drag: function () {
        return '<div class="vis"><div class="v-drag"><span class="app"><span class="orb"><i></i><i></i><i></i></span></span><span class="fold">Applications</span></div></div>';
      },
      rightclick: function () {
        return '<div class="vis"><div class="v-menu"><span class="hl">Open</span><span>Show Package Contents</span><span>Get Info</span><span>Move to Bin</span></div></div>';
      },
      exec: function () {
        return '<div class="vis"><div class="v-exec"><span class="v-tog"></span>Allow executing as a program</div></div>';
      },
      brain: function () {
        return '<div class="vis"><div class="v-brain"><div class="top"><span class="orb orb-xs"><i></i><i></i><i></i></span>S-CLAW</div><div class="body">' +
          '<p class="ttl">Give Claw a brain</p><p class="muted" style="font-size:14px">Recommended for this computer</p>' +
          '<div class="pick"><span><b>Standard</b><small>3.3 GB, fits 8 GB memory</small></span><span class="go hl">Download</span></div>' +
          '<div class="v-bar"><i></i></div></div></div></div>';
      },
    };

    var current = "windows", frames = [], fi = 0, timer = null, auto = !reduce, raf = null, frameStart = 0;
    var FRAME_MS = 3600;
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".player-tabs button"));
    var screen = $("screen"), cap = $("cap");

    function buildFrames(p) {
      var f = [{ step: 0, vis: "download", title: "Download", text: "Click <b>Download</b>. The file saves to your Downloads folder." }];
      p.install.forEach(function (s, i) { f.push({ step: 1, vis: s.vis, title: "Install" + (p.install.length > 1 ? " (" + (i + 1) + " of " + p.install.length + ")" : ""), text: s.text }); });
      f.push({ step: 2, vis: "brain", title: "Open S-CLAW", text: "It offers the right brain for your computer. Press <b>Download</b> once, then just type what you need." });
      return f;
    }
    function showFrame(i) {
      fi = (i + frames.length) % frames.length;
      var fr = frames[fi], p = D[current];
      screen.innerHTML = VIS[fr.vis](p);
      cap.innerHTML = "<h3>" + esc(fr.title) + "</h3><p>" + fr.text + "</p>"; // text is trusted copy from downloads.js
      tabs.forEach(function (t) {
        var s = +t.dataset.step;
        t.setAttribute("aria-selected", String(s === fr.step));
        t.classList.toggle("seen", s < fr.step);
        t.tabIndex = s === fr.step ? 0 : -1;
      });
      frameStart = performance.now();
    }
    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (!auto) return;
      var fr = frames[fi];
      var inStep = frames.filter(function (f) { return f.step === fr.step; });
      var k = inStep.indexOf(fr);
      var prog = (k + Math.min(1, (now - frameStart) / FRAME_MS)) / inStep.length;
      var tab = tabs[fr.step]; if (tab) tab.style.setProperty("--prog", (prog * 100).toFixed(1) + "%");
      if (now - frameStart > FRAME_MS) showFrame(fi + 1);
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        auto = false; t.style.setProperty("--prog", "100%");
        var idx = frames.findIndex(function (f) { return f.step === +t.dataset.step; });
        if (idx >= 0) showFrame(idx);
      });
    });
    $("player").addEventListener("pointerenter", function () { /* keep playing; clicks stop it */ });

    function pickOS(os) {
      current = os;
      var p = D[os];
      Array.prototype.forEach.call(osPick.querySelectorAll("button"), function (b) {
        var on = b.dataset.os === os; b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1;
      });
      $("osLine").textContent = onPhone ? "You're on a phone. Pick the computer you'll install S-CLAW on."
        : os === detected ? "We picked the right version for your computer." : "Pick the computer you'll install S-CLAW on.";
      var box = $("getBox");
      if (p.soon) {
        box.innerHTML = '<p class="get-for">S-CLAW for Android</p><div class="soon-box" style="margin-top:16px"><b>Coming soon.</b> For now S-CLAW runs on Windows, Mac and Linux computers.</div>';
        $("player").style.visibility = "hidden";
        return;
      }
      $("player").style.visibility = "";
      box.innerHTML =
        '<p class="get-for">S-CLAW for ' + esc(p.name) + "</p>" +
        '<p class="get-sys">' + esc(p.system) + "</p>" +
        '<p style="margin-top:22px"><a class="btn btn-primary btn-big get-btn" href="' + esc(p.url) + '">' + DL_ICON + " Download" + (p.size ? " (" + esc(p.size) + ")" : "") + "</a></p>" +
        (p.note ? '<p class="note" style="margin-top:16px">' + esc(p.note) + "</p>" : "") +
        '<ul class="get-facts" style="margin-top:28px"><li><b>Free</b>No account</li><li><b>About 5 min</b>To get going</li><li><b>Always new</b>Latest version</li></ul>';
      frames = buildFrames(p);
      showFrame(0);
    }
    var radios = Array.prototype.slice.call(osPick.querySelectorAll("button"));
    radios.forEach(function (b, i) {
      b.addEventListener("click", function () { pickOS(b.dataset.os); });
      b.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!n) return; e.preventDefault();
        var nx = radios[(i + n + radios.length) % radios.length]; nx.focus(); pickOS(nx.dataset.os);
      });
    });
    pickOS(detected || "windows");
    raf = requestAnimationFrame(tick);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { if (!es[0].isIntersecting) frameStart = performance.now(); }).observe($("player"));
    }

    /* no internet: one question, then only the files that are needed */
    var ramPick = $("ramPick"), brainBox = $("brainBox");
    function pickBrain(id) {
      var br = D.brains.filter(function (b) { return b.id === id; })[0]; if (!br) return;
      Array.prototype.forEach.call(ramPick.querySelectorAll("button"), function (b) { b.setAttribute("aria-checked", String(b.dataset.id === id)); });
      var n = br.files.length;
      brainBox.innerHTML =
        '<p class="bb-name">' + esc(br.name) + ' brain</p><p class="bb-size">' + esc(br.size) + " in " + n + " files</p>" +
        '<ol class="bb-steps">' +
          "<li><b>Download all " + n + " files</b> on any computer with internet." +
            '<ul class="brain-files">' + br.files.map(function (f, i) {
              var label = /mmproj/.test(f) ? "Vision file" : n > 2 ? "Part " + (i + 1) : "Brain file";
              return '<li><a class="file-btn" href="' + esc(D.brainBase + f) + '">' + DL_ICON + "<span><b>" + esc(label) + "</b><small>" + esc(f) + "</small></span></a></li>";
            }).join("") + "</ul></li>" +
          "<li>Put them <b>all in one folder</b> and copy it to the other computer. A flash drive works.</li>" +
          "<li>In S-CLAW open <b>Settings</b>, then <b>Claw's brain</b>, and choose the <b>first file</b>. S-CLAW joins the pieces itself.</li>" +
        "</ol>";
    }
    ramPick.innerHTML = D.brains.map(function (b) {
      return '<button type="button" role="radio" aria-checked="false" data-id="' + esc(b.id) + '"><b>' + esc(b.ram) + "</b><small>" + esc(b.name) + " brain, " + esc(b.size) + "</small></button>";
    }).join("");
    Array.prototype.forEach.call(ramPick.querySelectorAll("button"), function (b) { b.addEventListener("click", function () { pickBrain(b.dataset.id); }); });
    pickBrain("standard");
    if (location.hash === "#offline") $("offline").open = true;
  }
})();
