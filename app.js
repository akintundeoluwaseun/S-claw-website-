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
  var NAMES = { windows: "Windows", mac: "macOS", linux: "Linux", android: "Android" };
  var ICONS = {
    windows: '<svg viewBox="0 0 24 24"><path d="M3 5.5 10.5 4.4v7.1H3zM12 4.2 21 3v8.5h-9zM3 13h7.5v7.1L3 19zM12 13h9v8l-9-1.2z" fill="currentColor" stroke="none"/></svg>',
    mac: '<svg viewBox="0 0 24 24"><path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.9-.9-3.1-.8C6.8 7.3 5.3 8.2 4.5 9.7c-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.1.8c1.3 0 2.1-1.2 2.9-2.4.9-1.3 1.3-2.6 1.3-2.7 0 0-2.7-1-2.7-4zM14.1 5.5c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z" fill="currentColor" stroke="none"/></svg>',
    linux: '<svg viewBox="0 0 24 24"><path d="M12 3c-2 0-3.2 1.7-3.2 4 0 1.4.3 2.3-.8 3.9C6.7 12.8 5.5 14.6 5.5 17c0 .7.1 1.2.3 1.6M12 3c2 0 3.2 1.7 3.2 4 0 1.4-.3 2.3.8 3.9 1.3 1.9 2.5 3.7 2.5 6.1 0 .7-.1 1.2-.3 1.6M8 21c-1.6 0-3-.6-3-1.6S6.4 18 8 18.6c1 .4 1.2 2.4 0 2.4zm8 0c1.6 0 3-.6 3-1.6S17.6 18 16 18.6c-1 .4-1.2 2.4 0 2.4zM10 21h4"/><circle cx="10.6" cy="7.4" r=".6" fill="currentColor"/><circle cx="13.4" cy="7.4" r=".6" fill="currentColor"/></svg>',
    android: '<svg viewBox="0 0 24 24"><rect x="5" y="9" width="14" height="10" rx="2.5"/><path d="M5 11a7 7 0 0 1 14 0M8 5.5 9.3 7.6M16 5.5l-1.3 2.1M9 21v-2M15 21v-2"/><circle cx="9.5" cy="10.5" r=".5" fill="currentColor"/></svg>',
  };
  var DL_ICON = '<svg viewBox="0 0 24 24"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>';

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fileName(url) { try { return decodeURIComponent(url.split("?")[0].split("/").pop()); } catch (e) { return ""; } }

  /* ---------- download panel ---------- */
  var panel = document.getElementById("dlPanel");
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tabs [role=tab]"));

  function render(os) {
    var p = D[os]; if (!p) return;
    tabs.forEach(function (t) {
      var on = t.dataset.os === os;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    var html = '<p class="dl-meta">' + esc(p.label) + "</p>";
    if (p.soon) {
      html += '<div class="dl-card dl-soon"><span class="dl-os" aria-hidden="true">' + ICONS[os] + "</span>" +
        '<div class="dl-info"><strong>S-CLAW for ' + esc(NAMES[os]) + ' <span class="badge badge-soon">Coming soon</span></strong>' +
        "<span>The phone app is on the way. For now, S-CLAW runs on Windows, Mac and Linux.</span></div></div>";
    }
    (p.builds || []).forEach(function (b) {
      html +=
        '<div class="dl-card rec">' +
          '<span class="dl-os" aria-hidden="true">' + ICONS[os] + "</span>" +
          '<div class="dl-info"><strong>S-CLAW ' + esc(b.name) + "</strong>" +
          "<span>" + esc(b.note) + (b.size ? " · " + esc(b.size) : "") + "</span></div>" +
          '<a class="btn btn-primary btn-shine" href="' + esc(b.url) + '">' + DL_ICON +
          "Download" + (b.size ? " (" + esc(b.size) + ")" : "") + "</a>" +
        "</div>";
    });
    var stepsEl = document.getElementById("dlSteps");
    if (stepsEl) {
      if (p.steps && p.steps.length) {
        // steps are trusted HTML written in downloads.js
        stepsEl.innerHTML = "<h3>Installing takes a minute</h3><ol>" + p.steps.map(function (st) { return "<li>" + st + "</li>"; }).join("") + "</ol>";
        stepsEl.hidden = false;
      } else stepsEl.hidden = true;
    }
    panel.innerHTML = html;
    panel.classList.remove("fade"); void panel.offsetWidth; panel.classList.add("fade");
  }

  tabs.forEach(function (t, idx) {
    t.addEventListener("click", function () { render(t.dataset.os); });
    t.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!n) return;
      var next = tabs[(idx + n + tabs.length) % tabs.length];
      next.focus(); render(next.dataset.os);
    });
  });

  var os = detectOS();
  render(os && D[os] ? os : "windows");

  /* ---------- brain downloads ---------- */
  var brainGrid = document.getElementById("brainGrid");
  if (brainGrid && D.brains) {
    brainGrid.innerHTML = D.brains.map(function (br) {
      var many = br.files.length;
      return '<div class="brain-card' + (br.recommended ? " rec" : "") + '">' +
        '<div class="brain-top"><strong>' + esc(br.name) + "</strong>" +
        (br.recommended ? '<span class="badge">Most laptops</span>' : "") + "</div>" +
        '<p class="brain-fit">' + esc(br.fits) + "</p>" +
        '<p class="brain-size">' + esc(br.size) + " · " + many + " files — download all</p>" +
        '<ul class="brain-files">' + br.files.map(function (f, i) {
          var label = /mmproj/.test(f) ? "Vision file" : many > 2 ? "Part " + (i + 1) : "Brain file";
          return '<li><a class="file-btn" href="' + esc(D.brainBase + f) + '">' + DL_ICON +
            "<span><b>" + esc(label) + "</b><small>" + esc(f) + "</small></span></a></li>";
        }).join("") + "</ul></div>";
    }).join("");
  }

  // Hero button: download straight away for the visitor's device
  if (os && D[os] && !D[os].soon && D[os].builds && D[os].builds[0]) {
    var b = D[os].builds[0];
    var heroDl = document.getElementById("heroDl");
    heroDl.href = b.url;
    document.getElementById("heroDlText").textContent = "Download for " + NAMES[os];
    document.getElementById("heroFine").innerHTML =
      "Free · always the latest version · " + '<a href="#download" style="text-decoration:underline">Other devices</a>';
  }

  /* ---------- hero command demo ---------- */
  var demos = [
    { cmd: "Reply to Mum on WhatsApp: I'll call at 7", steps: ["Open WhatsApp", 'Find the chat "Mum"', "Type the message"], ask: 'Send "I\'ll call at 7" to Mum?' },
    { cmd: "Find last month's invoice and email it to Tunde", steps: ["Search Documents for invoices", "Pick October's invoice PDF", "Attach it to a new email"], ask: "Send email to Tunde?" },
    { cmd: "Book 30 minutes with Ada on Friday afternoon", steps: ["Check your calendar", "Free slot found: Fri 2:00 PM", "Draft the event"], ask: "Add “Meet Ada” Fri 2:00 PM?" },
  ];
  var cmdText = document.getElementById("cmdText");
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
  play();

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

  /* ---------- reveal on scroll ---------- */
  var els = document.querySelectorAll(".sec-head, .card, .step, .final, .install");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }
})();
