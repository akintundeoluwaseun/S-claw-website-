(function () {
  "use strict";
  var D = window.SCLAW_DOWNLOADS || {};
  var root = document.documentElement;

  /* ---------- theme ---------- */
  var themeBtn = document.getElementById("themeBtn");
  function syncThemeLabel() {
    var dark = root.dataset.theme === "dark";
    themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? "#0b0c10" : "#f7f7fb";
  }
  themeBtn.addEventListener("click", function () {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("sclaw-theme", root.dataset.theme); } catch (e) {}
    syncThemeLabel();
  });
  syncThemeLabel();

  /* ---------- nav ---------- */
  var nav = document.getElementById("nav");
  var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var menuBtn = document.getElementById("menuBtn");
  var menu = document.getElementById("mobileMenu");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  menu.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  document.getElementById("year").textContent = new Date().getFullYear();


  /* ---------- detect visitor's device ---------- */
  function detectOS() {
    var ua = navigator.userAgent || "";
    if (/android/i.test(ua)) return "android";
    if (/iphone|ipad|ipod/i.test(ua)) return null;
    if (/mac/i.test(ua)) return "mac";
    if (/linux|x11|cros/i.test(ua)) return "linux";
    if (/win/i.test(ua)) return "windows";
    return null;
  }
  var NAMES = { windows: "Windows", mac: "Mac", linux: "Linux", android: "Android" };
  var ICONS = {
    windows: '<svg viewBox="0 0 24 24"><path d="M3 5.5 10.5 4.4v7.1H3zM12 4.2 21 3v8.5h-9zM3 13h7.5v7.1L3 19zM12 13h9v8l-9-1.2z" fill="currentColor" stroke="none"/></svg>',
    mac: '<svg viewBox="0 0 24 24"><path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.9-.9-3.1-.8C6.8 7.3 5.3 8.2 4.5 9.7c-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.1.8c1.3 0 2.1-1.2 2.9-2.4.9-1.3 1.3-2.6 1.3-2.7 0 0-2.7-1-2.7-4zM14.1 5.5c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z" fill="currentColor" stroke="none"/></svg>',
    linux: '<svg viewBox="0 0 24 24"><path d="M12 3c-2 0-3.2 1.7-3.2 4 0 1.4.3 2.3-.8 3.9C6.7 12.8 5.5 14.6 5.5 17c0 .7.1 1.2.3 1.6M12 3c2 0 3.2 1.7 3.2 4 0 1.4-.3 2.3.8 3.9 1.3 1.9 2.5 3.7 2.5 6.1 0 .7-.1 1.2-.3 1.6M8 21c-1.6 0-3-.6-3-1.6S6.4 18 8 18.6c1 .4 1.2 2.4 0 2.4zm8 0c1.6 0 3-.6 3-1.6S17.6 18 16 18.6c-1 .4-1.2 2.4 0 2.4zM10 21h4"/><circle cx="10.6" cy="7.4" r=".6" fill="currentColor"/><circle cx="13.4" cy="7.4" r=".6" fill="currentColor"/></svg>',
    android: '<svg viewBox="0 0 24 24"><rect x="5" y="9" width="14" height="10" rx="2.5"/><path d="M5 11a7 7 0 0 1 14 0M8 5.5 9.3 7.6M16 5.5l-1.3 2.1M9 21v-2M15 21v-2"/><circle cx="9.5" cy="10.5" r=".5" fill="currentColor"/></svg>',
  };
  var DL_ICON = '<svg viewBox="0 0 24 24"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>';

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fileName(url) { try { return decodeURIComponent(url.split("?")[0].split("/").pop()); } catch (e) { return ""; } }

  /* ---------- guided download page ---------- */
  var VIS = {
    file: function (os) {
      var f = D[os] && D[os].file || "S-CLAW";
      return '<div class="vis vis-file"><span class="vf-ico">' + DL_ICON + '</span><span class="vf-name">' + esc(f) + '</span><span class="vf-click">double-click</span></div>';
    },
    smartscreen: function () {
      return '<div class="vis vis-ss"><p class="ss-t">Windows protected your PC</p><p class="ss-l"><u class="hl">More info</u></p><div class="ss-btns"><span class="hl hl-btn">Run anyway</span><span>Don\'t run</span></div></div>';
    },
    installer: function () {
      return '<div class="vis vis-inst"><span class="orb orb-xs"><i></i><i></i><i></i></span><b>S-CLAW Setup</b><div class="inst-bar"><i></i></div><span class="hl hl-btn">Install</span></div>';
    },
    drag: function () {
      return '<div class="vis vis-drag"><span class="app-ic"><span class="orb orb-xs"><i></i><i></i><i></i></span></span><span class="drag-arrow">→</span><span class="folder">Applications</span></div>';
    },
    rightclick: function () {
      return '<div class="vis vis-menu"><span class="hl">Open</span><span>Show in Finder</span><span>Get Info</span></div>';
    },
    exec: function () {
      return '<div class="vis vis-exec"><span class="toggle on"><i></i></span><span>Allow executing as a program</span></div>';
    },
    terminal: function () {
      return '<div class="vis vis-term"><code>$ chmod +x S-CLAW-Linux.AppImage</code><code>$ ./S-CLAW-Linux.AppImage</code></div>';
    },
  };

  var osPick = document.getElementById("osPick");
  var dlBox = document.getElementById("dlBox");
  var installCards = document.getElementById("installCards");
  var detected = detectOS();
  var onPhone = /android|iphone|ipad|ipod/i.test(navigator.userAgent || "");

  function pickOS(os) {
    if (!dlBox) return;
    var p = D[os]; if (!p) return;
    Array.prototype.forEach.call(osPick.querySelectorAll("button"), function (b) {
      var on = b.dataset.os === os;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    var line = document.getElementById("osLine");
    if (line) line.textContent = onPhone ? "You're on a phone — pick the computer you'll install S-CLAW on." : os === detected ? "We picked the right version for your computer." : "Not your computer? Pick it below.";
    if (p.soon) {
      dlBox.innerHTML = '<div class="dl-card dl-soon"><span class="dl-os" aria-hidden="true">' + ICONS[os] + "</span>" +
        '<div class="dl-info"><strong>Android app <span class="badge badge-soon">Coming soon</span></strong>' +
        "<span>S-CLAW runs on your computer for now. Open this page on your Windows, Mac or Linux computer to download it.</span></div></div>";
      installCards.innerHTML = '<li class="ic-empty">Install steps appear here when you pick a computer.</li>';
      document.getElementById("step2").classList.add("muted");
      document.getElementById("step3").classList.add("muted");
      return;
    }
    document.getElementById("step2").classList.remove("muted");
    document.getElementById("step3").classList.remove("muted");
    dlBox.innerHTML =
      '<div class="dl-card rec">' +
        '<span class="dl-os" aria-hidden="true">' + ICONS[os] + "</span>" +
        '<div class="dl-info"><strong>S-CLAW for ' + esc(p.name) + "</strong>" +
        "<span>" + esc(p.label) + (p.size ? " · " + esc(p.size) : "") + "</span></div>" +
        '<a class="btn btn-primary btn-shine btn-dl" href="' + esc(p.url) + '">' + DL_ICON +
        "Download" + (p.size ? " · " + esc(p.size) : "") + "</a>" +
      "</div>" + (p.note ? '<p class="dl-note">' + esc(p.note) + "</p>" : "");
    // install steps (text is trusted HTML from downloads.js)
    installCards.innerHTML = p.install.map(function (st, i) {
      return '<li class="ic"><div class="ic-vis">' + (VIS[st.visual] ? VIS[st.visual](os) : "") + "</div>" +
        '<div class="ic-txt"><span class="ic-n">' + (i + 1) + "</span><h3>" + esc(st.title) + "</h3><p>" + st.text + "</p></div></li>";
    }).join("");
    dlBox.classList.remove("fade"); void dlBox.offsetWidth; dlBox.classList.add("fade");
  }

  if (osPick) {
    var btns = Array.prototype.slice.call(osPick.querySelectorAll("button"));
    btns.forEach(function (b, idx) {
      b.addEventListener("click", function () { pickOS(b.dataset.os); });
      b.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!n) return; e.preventDefault();
        var next = btns[(idx + n + btns.length) % btns.length]; next.focus(); pickOS(next.dataset.os);
      });
    });
    pickOS(!onPhone && detected && D[detected] ? detected : "windows");
  }

  /* offline brains: one question, then only the files needed */
  var ramPick = document.getElementById("ramPick");
  var brainBox = document.getElementById("brainBox");
  function pickBrain(id) {
    var br = D.brains.filter(function (b) { return b.id === id; })[0]; if (!br) return;
    Array.prototype.forEach.call(ramPick.querySelectorAll("button"), function (b) { b.setAttribute("aria-checked", String(b.dataset.id === id)); });
    var many = br.files.length;
    brainBox.innerHTML =
      '<div class="bb-head"><div><p class="bb-k">You need the</p><p class="bb-name">' + esc(br.name) + ' brain</p></div><span class="bb-size">' + esc(br.size) + " · " + many + " files</span></div>" +
      '<ol class="bb-steps">' +
        '<li><b>Download all ' + many + ' files</b> below (on any computer with internet).' +
          '<ul class="brain-files">' + br.files.map(function (f, i) {
            var label = /mmproj/.test(f) ? "Vision file" : many > 2 ? "Part " + (i + 1) : "Brain file";
            return '<li><a class="file-btn" href="' + esc(D.brainBase + f) + '">' + DL_ICON + "<span><b>" + esc(label) + "</b><small>" + esc(f) + "</small></span></a></li>";
          }).join("") + "</ul></li>" +
        "<li>Put them <b>all in one folder</b> and copy that folder to the computer (a flash drive works).</li>" +
        "<li>Open S-CLAW → <b>Settings → Claw's brain</b> and choose the <b>first file</b>. S-CLAW joins the pieces itself.</li>" +
      "</ol>";
  }
  if (ramPick && D.brains) {
    ramPick.innerHTML = D.brains.map(function (b) {
      return '<button type="button" role="radio" aria-checked="false" data-id="' + esc(b.id) + '"><b>' + esc(b.ram) + "</b><small>" + esc(b.name) + " brain · " + esc(b.size) + "</small></button>";
    }).join("");
    Array.prototype.forEach.call(ramPick.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () { pickBrain(b.dataset.id); });
    });
    pickBrain("standard");
    if (location.hash === "#brains") document.getElementById("brains").open = true;
  }

  // Hero button on Home: download straight away for the visitor's computer
  var os = detected;
  if (os && D[os] && !D[os].soon && D[os].url) {
    var heroDl = document.getElementById("heroDl");
    if (heroDl) {
      heroDl.href = D[os].url;
      document.getElementById("heroDlText").textContent = "Download for " + NAMES[os];
      document.getElementById("heroFine").innerHTML =
        "Free" + (D[os].size ? " · " + esc(D[os].size) : "") + " · " + '<a href="/download" style="text-decoration:underline">Other computers &amp; setup guide</a>';
    }
  }

  /* ---------- hero command demo ---------- */
  var demos = [
    { cmd: "Reply to Mum on WhatsApp: I'll call at 7", steps: ["Open WhatsApp", 'Find the chat "Mum"', "Type the message"], ask: 'Send "I\'ll call at 7" to Mum?' },
    { cmd: "Find last month's invoice and email it to Tunde", steps: ["Search Documents for invoices", "Pick October's invoice PDF", "Attach it to a new email"], ask: "Send email to Tunde?" },
    { cmd: "Book 30 minutes with Ada on Friday afternoon", steps: ["Check your calendar", "Free slot found: Fri 2:00 PM", "Draft the event"], ask: "Add “Meet Ada” Fri 2:00 PM?" },
  ];
  var cmdText = document.getElementById("cmdText");
  var hasDemo = !!cmdText;
  var stepsEl = document.getElementById("cmdSteps");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var di = 0;

  function paintSteps(d, upto) {
    var html = "";
    d.steps.forEach(function (s, i) { html += '<li class="done' + (i < upto ? " show" : "") + '">' + esc(s) + "</li>"; });
    html += '<li class="ask' + (upto > d.steps.length ? " show" : "") + '">' + esc(d.ask) + ' <span class="chip">Approve</span></li>';
    stepsEl.innerHTML = html;
  }

  function play() {
    var d = demos[di % demos.length];
    if (reduce) { cmdText.textContent = d.cmd; paintSteps(d, 99); return; }
    var i = 0; cmdText.textContent = ""; paintSteps(d, 0);
    var typer = setInterval(function () {
      cmdText.textContent = d.cmd.slice(0, ++i);
      if (i >= d.cmd.length) {
        clearInterval(typer);
        var k = 0;
        var stepper = setInterval(function () {
          k++;
          var items = stepsEl.children;
          if (items[k - 1]) items[k - 1].classList.add("show");
          if (k > d.steps.length) { clearInterval(stepper); di++; setTimeout(play, 2800); }
        }, 650);
      }
    }, 38);
  }
  if (hasDemo) {
    var stg = document.getElementById("stage");
    if (!stg) play();
    else setTimeout(function () { if (!stg.classList.contains("is3d")) play(); }, 1500);
  }

  /* ---------- downloads: start in the background, stay on this page ---------- */
  var toast;
  function showToast(name) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "dl-toast"; toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.innerHTML = '<span class="dl-toast-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></span>' +
      "<span><b>Download started</b><small>" + esc(name) + " — check your browser's downloads.</small></span>";
    toast.classList.remove("show"); void toast.offsetWidth; toast.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { toast.classList.remove("show"); }, 5200);
  }
  function startDownload(url) {
    var f = document.createElement("iframe");
    f.style.display = "none"; f.setAttribute("aria-hidden", "true"); f.src = url;
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 120000);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf("/releases/latest/download/") === -1) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    startDownload(a.href);
    showToast(fileName(a.href));
  });

  /* ---------- 3D tilt + glare on cards ---------- */
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer && !reduce) {
    document.querySelectorAll(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = "perspective(800px) rotateX(" + ((0.5 - y) * 12).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 14).toFixed(2) + "deg) translateY(-4px)";
        el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- count-up stats ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function runCount(el) {
    var end = +el.dataset.count, t0 = null;
    if (reduce || end === 0) { el.textContent = end; return; }
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / 1400), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = v;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { co.observe(c); });
  } else counters.forEach(runCount);

  /* ---------- plugin directory ---------- */
  /* Everything here comes from plugins.js. Adding a plugin is one entry
     there plus the .zip; no markup is edited. esc() is used on every field
     because a plugin's own text ends up in this page. */
  var plugList = document.getElementById("plugList");
  if (plugList) {
    var P = window.SCLAW_PLUGINS || {};
    var items = P.items || [];
    var docsLink = document.getElementById("plugDocs");
    var submitLink = document.getElementById("plugSubmit");
    if (docsLink && P.docs) docsLink.href = P.docs;
    if (submitLink && P.submit) submitLink.href = P.submit;

    plugList.innerHTML = items.map(function (it) {
      var prompts = (it.prompts || []).map(function (s) {
        return '<li>&ldquo;' + esc(s) + '&rdquo;</li>';
      }).join("");
      return '' +
        '<article class="card plug">' +
          '<div class="plug-top">' +
            '<h3>' + esc(it.name) + '</h3>' +
            '<span class="plug-tag">' + esc(it.category || "Plugin") + '</span>' +
          '</div>' +
          '<p>' + esc(it.summary) + '</p>' +
          (prompts ? '<p class="plug-say">Things you can say</p><ul class="plug-prompts">' + prompts + '</ul>' : '') +
          '<dl class="plug-meta">' +
            '<dt>Drives it through</dt><dd>' + esc(it.door || "the mouse") + '</dd>' +
            '<dt>You also need</dt><dd>' + esc(it.needs || "nothing extra") + '</dd>' +
            '<dt>By</dt><dd>' + esc(it.by || "unknown") + (it.shipped ? ' &middot; already in S-CLAW' : '') + '</dd>' +
          '</dl>' +
          '<a class="btn btn-primary btn-sm" href="' + esc(it.url) + '" download>' +
            'Download &middot; ' + esc(it.size || "") +
          '</a>' +
        '</article>';
    }).join("");

    if (!items.length) {
      plugList.innerHTML = '<p class="plug-small">No plugins listed yet.</p>';
    }
  }

  /* ---------- reveal on scroll ---------- */
  var els = document.querySelectorAll(".sec-head, .card, .step, .final, .install");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }
})();
