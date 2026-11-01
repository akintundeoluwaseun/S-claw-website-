/*
  S-CLAW hero — a 3D laptop where S-CLAW actually does tasks on screen,
  a living orb (the brain) sending work to floating app windows.
  Everything is bundled in /vendor — no outside connections.
*/
import * as THREE from "three";
import { RoundedBoxGeometry } from "/vendor/RoundedBoxGeometry.js";
import { RoomEnvironment } from "/vendor/RoomEnvironment.js";

const stage = document.getElementById("stage");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch (e) { return false; }
}

if (stage && webglOK()) {
  try { start(); } catch (e) { console.warn("3D scene off:", e); stage.classList.add("no3d"); }
} else if (stage) {
  stage.classList.add("no3d");
}

function start() {
  /* ------------------------------------------------------------------ */
  /* basics                                                              */
  /* ------------------------------------------------------------------ */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = "stage-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);

  const C = {
    blue: new THREE.Color("#6e8bff"),
    violet: new THREE.Color("#b38cff"),
    peach: new THREE.Color("#ff8a6b"),
    green: "#3ddc97",
  };

  /* lights */
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x1a1530, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 6, 5);
  scene.add(key);
  const pBlue = new THREE.PointLight(0x6e8bff, 30, 14, 2);
  const pViolet = new THREE.PointLight(0xb38cff, 26, 14, 2);
  const pPeach = new THREE.PointLight(0xff8a6b, 18, 12, 2);
  scene.add(pBlue, pViolet, pPeach);

  /* ------------------------------------------------------------------ */
  /* helpers for canvas textures                                        */
  /* ------------------------------------------------------------------ */
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  const FONT = 'Inter, "Segoe UI", system-ui, sans-serif';
  const DISPLAY = 'Sora, Inter, "Segoe UI", system-ui, sans-serif';
  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp01 = (t) => Math.max(0, Math.min(1, t));
  const lerp = (a, b, t) => a + (b - a) * t;

  function makeCanvasTex(w, h) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return { cv, ctx: cv.getContext("2d"), tex };
  }

  function drawCheck(ctx, x, y, s, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.16; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x - s * 0.28, y + s * 0.02);
    ctx.lineTo(x - s * 0.06, y + s * 0.24);
    ctx.lineTo(x + s * 0.3, y - s * 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function orbGlyph(ctx, x, y, r, t) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "#1a1d2b"); g.addColorStop(1, "#0b0c12");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    const cols = ["#6e8bff", "#b38cff", "#ff8a6b"];
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    cols.forEach((c, i) => {
      const a = t * (0.8 + i * 0.3) + i * 2.1;
      const cx = x + Math.cos(a) * r * 0.32, cy = y + Math.sin(a) * r * 0.32;
      const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.8);
      gg.addColorStop(0, c); gg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    });
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* the tasks S-CLAW performs on screen                                 */
  /* ------------------------------------------------------------------ */
  const TASKS = [
    { cmd: "Reply to Mum on WhatsApp: I'll call at 7", steps: ["Open WhatsApp", "Find the chat “Mum”", "Type the message"],
      ask: "Send “I'll call at 7” to Mum?", done: "Message sent to Mum", app: "chat" },
    { cmd: "Email last month's invoice to Tunde", steps: ["Search Documents for invoices", "Open Invoice-October.pdf", "Attach it to a new email"],
      ask: "Send the email to Tunde?", done: "Email sent with the invoice", app: "files" },
    { cmd: "Book 30 min with Ada on Friday afternoon", steps: ["Check your calendar", "Free slot found: Fri 2:00 PM", "Draft “Meet Ada”"],
      ask: "Add “Meet Ada” Fri 2:00 PM?", done: "Added to your calendar", app: "cal" },
  ];
  const T_TASK = 10.5;           // seconds per task
  const T_TYPE = [0.2, 2.4];     // typing the command
  const T_STEP0 = 2.7, T_STEP = 1.0;
  const T_ASK = 6.0, T_CUR = [6.2, 7.2], T_CLICK = 7.3, T_DONE = 7.6;

  function phaseOf(t) {
    return {
      typed: clamp01((t - T_TYPE[0]) / (T_TYPE[1] - T_TYPE[0])),
      step: clamp01((t - T_STEP0) / (T_STEP * 3)) * 3, // 0..3
      ask: t >= T_ASK && t < T_DONE + 0.2 ? clamp01((t - T_ASK) / 0.35) : 0,
      cur: ease(clamp01((t - T_CUR[0]) / (T_CUR[1] - T_CUR[0]))),
      click: t >= T_CLICK ? clamp01((t - T_CLICK) / 0.45) : 0,
      done: t >= T_DONE ? clamp01((t - T_DONE) / 0.4) : 0,
      fadeOut: t > T_TASK - 0.5 ? clamp01((t - (T_TASK - 0.5)) / 0.5) : 0,
    };
  }

  /* ------------------------------------------------------------------ */
  /* laptop screen UI (drawn every frame)                                */
  /* ------------------------------------------------------------------ */
  const SW = 1280, SH = 800;
  const screen = makeCanvasTex(SW, SH);

  function drawScreen(time, taskIdx, t) {
    const ctx = screen.ctx, task = TASKS[taskIdx], ph = phaseOf(t);
    // wallpaper
    const bg = ctx.createLinearGradient(0, 0, SW, SH);
    bg.addColorStop(0, "#141a33"); bg.addColorStop(0.55, "#1d1636"); bg.addColorStop(1, "#2a1626");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, SW, SH);
    // soft colour blobs on the wallpaper
    [["#6e8bff", 200, 160], ["#b38cff", 1080, 220], ["#ff8a6b", 900, 760]].forEach(([c, x, y], i) => {
      const g = ctx.createRadialGradient(x + Math.sin(time * 0.3 + i) * 40, y, 0, x, y, 420);
      g.addColorStop(0, c + "55"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    });

    // app window
    const wx = 40, wy = 34, ww = SW - 80, wh = SH - 96;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
    rr(ctx, wx, wy, ww, wh, 26); ctx.fillStyle = "#10121a"; ctx.fill();
    ctx.restore();
    rr(ctx, wx, wy, ww, wh, 26); ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 2; ctx.stroke();

    // title bar
    orbGlyph(ctx, wx + 40, wy + 34, 15, time);
    ctx.fillStyle = "#ededf0"; ctx.font = `700 22px ${DISPLAY}`; ctx.textBaseline = "middle";
    ctx.fillText("S-CLAW", wx + 66, wy + 35);
    ctx.font = `500 17px ${FONT}`; ctx.fillStyle = "#3ddc97";
    ctx.beginPath(); ctx.arc(wx + ww - 196, wy + 35, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#a6a7ae"; ctx.fillText("Local brain · offline", wx + ww - 182, wy + 35);
    ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fillRect(wx, wy + 68, ww, 2);

    const alpha = 1 - ph.fadeOut;
    ctx.save(); ctx.globalAlpha = alpha;

    /* ---- left: command + plan ---- */
    const lx = wx + 34, lw = 600;
    // command bar
    const by = wy + 98;
    rr(ctx, lx, by, lw, 66, 33);
    const cbg = ctx.createLinearGradient(lx, by, lx + lw, by);
    cbg.addColorStop(0, "rgba(110,139,255,.16)"); cbg.addColorStop(1, "rgba(179,140,255,.12)");
    ctx.fillStyle = cbg; ctx.fill();
    ctx.strokeStyle = "rgba(140,160,255,.45)"; ctx.lineWidth = 2; ctx.stroke();
    orbGlyph(ctx, lx + 36, by + 33, 14, time * 1.6);
    const shown = task.cmd.slice(0, Math.round(task.cmd.length * ph.typed));
    ctx.font = `500 21px ${FONT}`; ctx.fillStyle = "#f2f3f7";
    ctx.fillText(shown, lx + 62, by + 34);
    if (ph.typed < 1 || Math.floor(time * 2) % 2 === 0) {
      const cw = ctx.measureText(shown).width;
      ctx.fillStyle = "#8aa2ff"; ctx.fillRect(lx + 64 + cw, by + 20, 3, 28);
    }

    // plan
    if (t > T_STEP0 - 0.3) {
      const pa = clamp01((t - (T_STEP0 - 0.3)) / 0.3);
      ctx.save(); ctx.globalAlpha = alpha * pa;
      ctx.font = `600 15px ${FONT}`; ctx.fillStyle = "#8aa2ff";
      ctx.fillText("PLAN", lx + 6, by + 106);
      task.steps.forEach((s, i) => {
        const y = by + 150 + i * 64;
        const st = ph.step - i; // <0 pending, 0..1 running, >=1 done
        rr(ctx, lx, y - 26, lw, 52, 16);
        ctx.fillStyle = st >= 0 && st < 1 ? "rgba(110,139,255,.14)" : "rgba(255,255,255,.035)"; ctx.fill();
        const cx = lx + 30;
        if (st >= 1) {
          ctx.fillStyle = "rgba(61,220,151,.18)"; ctx.beginPath(); ctx.arc(cx, y, 14, 0, 7); ctx.fill();
          drawCheck(ctx, cx, y, 26, "#3ddc97");
        } else if (st >= 0) {
          ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, y, 12, 0, 7); ctx.stroke();
          ctx.strokeStyle = "#8aa2ff"; ctx.beginPath(); ctx.arc(cx, y, 12, time * 7, time * 7 + 1.9); ctx.stroke();
        } else {
          ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, y, 12, 0, 7); ctx.stroke();
        }
        ctx.font = `500 19px ${FONT}`;
        ctx.fillStyle = st >= 1 ? "#a6a7ae" : st >= 0 ? "#ffffff" : "#6d6f78";
        ctx.fillText(s, cx + 30, y + 1);
        if (st >= 1) { ctx.font = `600 14px ${FONT}`; ctx.fillStyle = "#3ddc97"; ctx.fillText("checked", lx + lw - 86, y + 1); }
      });
      ctx.restore();
    }

    // approval card
    const ay = by + 360;
    if (ph.ask > 0 || ph.done > 0) {
      ctx.save();
      const show = ph.done > 0 ? 1 - ph.done : ease(ph.ask);
      ctx.globalAlpha = alpha * show;
      ctx.translate(0, (1 - show) * 18);
      rr(ctx, lx, ay, lw, 120, 22);
      ctx.fillStyle = "rgba(255,210,122,.09)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,210,122,.45)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = `600 14px ${FONT}`; ctx.fillStyle = "#f3b65c"; ctx.fillText("NEEDS YOUR OK", lx + 26, ay + 30);
      ctx.font = `600 21px ${FONT}`; ctx.fillStyle = "#ffffff"; ctx.fillText(task.ask, lx + 26, ay + 64);
      // buttons
      const bx = lx + lw - 170, byy = ay + 78;
      rr(ctx, bx - 120, byy, 108, 32, 16); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
      ctx.font = `600 15px ${FONT}`; ctx.fillStyle = "#c9cad1"; ctx.fillText("Cancel", bx - 92, byy + 17);
      const pressed = ph.click > 0 && ph.click < 1 ? 0.94 : 1;
      ctx.save(); ctx.translate(bx + 72, byy + 16); ctx.scale(pressed, pressed);
      rr(ctx, -72, -16, 144, 32, 16);
      const ag = ctx.createLinearGradient(-72, 0, 72, 0); ag.addColorStop(0, "#6e8bff"); ag.addColorStop(1, "#b38cff");
      ctx.fillStyle = ag; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillText("Approve", -30, 1);
      ctx.restore();
      ctx.restore();
    }

    // done toast
    if (ph.done > 0) {
      ctx.save(); ctx.globalAlpha = alpha * ease(ph.done);
      const ty = ay + 20 + (1 - ease(ph.done)) * 20;
      rr(ctx, lx, ty, lw, 80, 22);
      ctx.fillStyle = "rgba(61,220,151,.12)"; ctx.fill();
      ctx.strokeStyle = "rgba(61,220,151,.5)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "rgba(61,220,151,.22)"; ctx.beginPath(); ctx.arc(lx + 44, ty + 40, 20, 0, 7); ctx.fill();
      drawCheck(ctx, lx + 44, ty + 40, 34, "#3ddc97");
      ctx.font = `600 22px ${FONT}`; ctx.fillStyle = "#fff"; ctx.fillText(task.done, lx + 82, ty + 32);
      ctx.font = `500 16px ${FONT}`; ctx.fillStyle = "#a6a7ae"; ctx.fillText("Every step checked", lx + 82, ty + 58);
      ctx.restore();
    }

    /* ---- right: the app S-CLAW is operating ---- */
    const ax = lx + lw + 36, aw = wx + ww - 34 - ax, ay0 = by, ah = wh - (by - wy) - 34;
    ctx.save();
    rr(ctx, ax, ay0, aw, ah, 20); ctx.fillStyle = "#171a24"; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 2; ctx.stroke();
    rr(ctx, ax, ay0, aw, ah, 20); ctx.clip();
    if (task.app === "chat") drawChatApp(ctx, ax, ay0, aw, ah, ph, t, time);
    else if (task.app === "files") drawFilesApp(ctx, ax, ay0, aw, ah, ph, t, time);
    else drawCalApp(ctx, ax, ay0, aw, ah, ph, t, time);
    ctx.restore();

    // cursor
    let cx, cy;
    const restX = ax + aw * 0.55, restY = ay0 + ah * 0.6;
    const appTarget = appCursor(task.app, ax, ay0, aw, ah, ph);
    const apX = lx + lw - 98, apY = ay + 94;
    if (t < T_CUR[0]) { cx = appTarget[0]; cy = appTarget[1]; }
    else { cx = lerp(appTarget[0], apX, ph.cur); cy = lerp(appTarget[1], apY, ph.cur); }
    if (ph.done > 0) { cx = lerp(apX, restX, ease(ph.done)); cy = lerp(apY, restY, ease(ph.done)); }
    if (ph.click > 0 && ph.click < 1) {
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - ph.click)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(apX, apY, 10 + ph.click * 34, 0, 7); ctx.stroke();
    }
    drawCursor(ctx, cx, cy);
    ctx.restore();

    // taskbar
    ctx.fillStyle = "rgba(10,11,16,.75)"; ctx.fillRect(0, SH - 46, SW, 46);
    orbGlyph(ctx, SW / 2, SH - 23, 13, time);
    ["#2b6cff", "#3ddc97", "#f3b65c", "#ff8a6b"].forEach((c, i) => {
      rr(ctx, SW / 2 + 32 + i * 38, SH - 36, 26, 26, 7); ctx.fillStyle = c + "cc"; ctx.fill();
    });
    ctx.font = `500 16px ${FONT}`; ctx.fillStyle = "#a6a7ae"; ctx.fillText("7:42 PM", SW - 96, SH - 22);

    screen.tex.needsUpdate = true;
  }

  function appCursor(app, ax, ay, aw, ah, ph) {
    if (app === "chat") return [ax + aw * 0.5, ay + ah - 46 - (ph.step < 1 ? 280 : 0) * (1 - clamp01(ph.step - 1))];
    if (app === "files") {
      const row = Math.min(3, Math.floor(ph.step * 3));
      return ph.step < 1 ? [ax + aw * 0.4, ay + 110 + row * 58] : ph.step < 2 ? [ax + aw * 0.4, ay + 110 + 3 * 58] : [ax + aw * 0.7, ay + ah - 70];
    }
    const col = ph.step < 1 ? Math.floor(ph.step * 5) : 4;
    return [ax + 70 + col * ((aw - 80) / 5) + 30, ay + 120 + (ph.step < 1 ? ph.step * 200 : 5 * 52)];
  }

  function drawCursor(ctx, x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(8, 23); ctx.lineTo(14, 36); ctx.lineTo(19, 34); ctx.lineTo(13, 21); ctx.lineTo(23, 21); ctx.closePath();
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.shadowColor = "transparent"; ctx.lineWidth = 2; ctx.strokeStyle = "#111"; ctx.stroke();
    ctx.restore();
  }

  function drawChatApp(ctx, x, y, w, h, ph, t, time) {
    ctx.fillStyle = "#0e1a17"; ctx.fillRect(x, y, w, h);
    const open = clamp01(ph.step);
    // header
    ctx.fillStyle = "#14261f"; ctx.fillRect(x, y, w, 70);
    ctx.fillStyle = "#25d366"; ctx.beginPath(); ctx.arc(x + 42, y + 35, 20, 0, 7); ctx.fill();
    ctx.fillStyle = "#0e1a17"; ctx.font = `700 18px ${FONT}`; ctx.fillText("M", x + 35, y + 36);
    ctx.fillStyle = "#e9edef"; ctx.font = `600 19px ${FONT}`;
    ctx.fillText(open > 0.5 ? "Mum" : "WhatsApp", x + 74, y + 28);
    ctx.fillStyle = "#8696a0"; ctx.font = `400 14px ${FONT}`;
    ctx.fillText(open > 0.5 ? "online" : "Chats", x + 74, y + 50);
    if (ph.step < 1.5) {
      // chat list
      ["Mum", "Tunde", "Shop group", "Ada"].forEach((n, i) => {
        const ry = y + 90 + i * 66;
        const hl = ph.step >= 0.6 && i === 0;
        if (hl) { ctx.fillStyle = "rgba(37,211,102,.12)"; ctx.fillRect(x, ry - 8, w, 60); }
        ctx.fillStyle = ["#25d366", "#6e8bff", "#f3b65c", "#ff8a6b"][i] + "55";
        ctx.beginPath(); ctx.arc(x + 42, ry + 22, 20, 0, 7); ctx.fill();
        ctx.fillStyle = "#e9edef"; ctx.font = `600 17px ${FONT}`; ctx.fillText(n, x + 74, ry + 12);
        ctx.fillStyle = "#8696a0"; ctx.font = `400 14px ${FONT}`;
        ctx.fillText(["Are you calling today?", "Send the invoice pls", "Stock arrived", "Friday works"][i], x + 74, ry + 34);
      });
      return;
    }
    // conversation
    const bubble = (txt, right, by, a) => {
      ctx.save(); ctx.globalAlpha *= a;
      ctx.font = `400 17px ${FONT}`;
      const tw = ctx.measureText(txt).width + 70;
      const bx = right ? x + w - tw - 20 : x + 20;
      rr(ctx, bx, by, tw, 46, 14); ctx.fillStyle = right ? "#005c4b" : "#202c33"; ctx.fill();
      ctx.fillStyle = "#e9edef"; ctx.fillText(txt, bx + 16, by + 24);
      ctx.fillStyle = "#8696a0"; ctx.font = `400 12px ${FONT}`; ctx.fillText(right ? "7:42" : "7:30", bx + tw - 50, by + 32);
      if (right) { ctx.strokeStyle = "#53bdeb"; ctx.lineWidth = 2; drawCheck(ctx, bx + tw - 14, by + 30, 12, "#53bdeb"); drawCheck(ctx, bx + tw - 9, by + 30, 12, "#53bdeb"); }
      ctx.restore();
    };
    bubble("Are you calling today?", false, y + 96, 1);
    bubble("Let me know the time", false, y + 152, 1);
    // input
    const iy = y + h - 74;
    rr(ctx, x + 16, iy, w - 32, 52, 26); ctx.fillStyle = "#202c33"; ctx.fill();
    const msg = "I'll call at 7";
    const typedN = ph.done > 0 ? 0 : Math.round(msg.length * clamp01(ph.step - 2));
    ctx.font = `400 17px ${FONT}`;
    ctx.fillStyle = typedN ? "#e9edef" : "#8696a0";
    ctx.fillText(typedN ? msg.slice(0, typedN) : "Type a message", x + 38, iy + 27);
    if (ph.done > 0) bubble(msg, true, y + 220 + (1 - ease(ph.done)) * 30, ease(ph.done));
  }

  function drawFilesApp(ctx, x, y, w, h, ph, t, time) {
    ctx.fillStyle = "#151821"; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#1c2030"; ctx.fillRect(x, y, w, 64);
    ctx.font = `600 18px ${FONT}`; ctx.fillStyle = "#e9eaf0";
    const view = ph.done > 0 || ph.step >= 2 ? "mail" : ph.step >= 1 ? "pdf" : "files";
    ctx.fillText(view === "mail" ? "New email" : view === "pdf" ? "Invoice-October.pdf" : "Documents › Invoices", x + 24, y + 33);
    if (view === "files") {
      const files = ["Invoice-July.pdf", "Invoice-August.pdf", "Invoice-September.pdf", "Invoice-October.pdf", "Receipts.xlsx"];
      const hl = Math.min(3, Math.floor(ph.step * 4.5));
      files.forEach((f, i) => {
        const ry = y + 84 + i * 58;
        if (i === hl) { rr(ctx, x + 12, ry, w - 24, 50, 12); ctx.fillStyle = "rgba(110,139,255,.2)"; ctx.fill(); }
        rr(ctx, x + 26, ry + 10, 26, 30, 5); ctx.fillStyle = f.endsWith("xlsx") ? "#3ddc97" : "#ff6b6b"; ctx.fill();
        ctx.fillStyle = "#e9eaf0"; ctx.font = `500 16px ${FONT}`; ctx.fillText(f, x + 66, ry + 26);
        ctx.fillStyle = "#7d8090"; ctx.font = `400 13px ${FONT}`; ctx.fillText(["Jul 31", "Aug 31", "Sep 30", "Oct 31", "Oct 31"][i], x + w - 80, ry + 26);
      });
    } else if (view === "pdf") {
      rr(ctx, x + 30, y + 84, w - 60, h - 110, 10); ctx.fillStyle = "#f6f6f8"; ctx.fill();
      ctx.fillStyle = "#16181f"; ctx.font = `700 26px ${DISPLAY}`; ctx.fillText("INVOICE", x + 56, y + 128);
      ctx.font = `400 14px ${FONT}`; ctx.fillStyle = "#666"; ctx.fillText("October 2026 · #INV-0310", x + 56, y + 156);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = "#e3e4ea"; ctx.fillRect(x + 56, y + 192 + i * 34, w - 112, 14); }
      const sweep = clamp01(ph.step - 1);
      ctx.fillStyle = "rgba(110,139,255,.25)"; ctx.fillRect(x + 50, y + 186, (w - 100) * sweep, 5 * 34);
      ctx.fillStyle = "#16181f"; ctx.font = `700 20px ${FONT}`; ctx.fillText("Total  ₦ 485,000", x + 56, y + h - 64);
    } else {
      const rows = [["To", "Tunde"], ["Subject", "October invoice"]];
      rows.forEach(([k, v], i) => {
        const ry = y + 92 + i * 52;
        ctx.fillStyle = "#7d8090"; ctx.font = `500 15px ${FONT}`; ctx.fillText(k, x + 26, ry + 18);
        ctx.fillStyle = "#e9eaf0"; ctx.font = `500 17px ${FONT}`; ctx.fillText(v, x + 110, ry + 18);
        ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fillRect(x + 20, ry + 38, w - 40, 2);
      });
      ctx.fillStyle = "#c9cad1"; ctx.font = `400 16px ${FONT}`;
      ctx.fillText("Hi Tunde, please find October's invoice attached.", x + 26, y + 230);
      const a = clamp01((ph.step - 2) * 2) || (ph.done > 0 ? 1 : 0);
      ctx.save(); ctx.globalAlpha *= a;
      rr(ctx, x + 26, y + 270, 250, 48, 12); ctx.fillStyle = "rgba(255,107,107,.14)"; ctx.fill();
      rr(ctx, x + 38, y + 280, 22, 28, 4); ctx.fillStyle = "#ff6b6b"; ctx.fill();
      ctx.fillStyle = "#e9eaf0"; ctx.font = `500 15px ${FONT}`; ctx.fillText("Invoice-October.pdf", x + 70, y + 295);
      ctx.restore();
      if (ph.done > 0) {
        ctx.save(); ctx.globalAlpha *= ease(ph.done);
        rr(ctx, x + w - 150, y + h - 76, 124, 46, 23); ctx.fillStyle = "#3ddc97"; ctx.fill();
        ctx.fillStyle = "#08130e"; ctx.font = `700 17px ${FONT}`; ctx.fillText("Sent ✓", x + w - 120, y + h - 52);
        ctx.restore();
      }
    }
  }

  function drawCalApp(ctx, x, y, w, h, ph, t, time) {
    ctx.fillStyle = "#151821"; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#e9eaf0"; ctx.font = `600 18px ${FONT}`; ctx.fillText("This week", x + 24, y + 34);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const gx = x + 64, gy = y + 70, cw = (w - 80) / 5, rh = 52;
    days.forEach((d, i) => {
      ctx.fillStyle = i === 4 && ph.step >= 1 ? "#8aa2ff" : "#7d8090"; ctx.font = `600 14px ${FONT}`;
      ctx.fillText(d, gx + i * cw + cw / 2 - 14, gy);
    });
    const hours = ["9", "10", "11", "12", "1", "2", "3", "4"];
    hours.forEach((hr, j) => {
      const ry = gy + 20 + j * rh;
      ctx.fillStyle = "#5d6070"; ctx.font = `400 13px ${FONT}`; ctx.fillText(hr, x + 30, ry + 6);
      ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fillRect(gx, ry, w - 80, 1);
    });
    const busy = [[0, 0, 2, "#6e8bff"], [1, 3, 1, "#b38cff"], [2, 1, 2, "#ff8a6b"], [3, 4, 2, "#6e8bff"], [4, 0, 2, "#f3b65c"], [4, 3, 1, "#b38cff"], [1, 6, 1, "#ff8a6b"]];
    busy.forEach(([d, s, l, c]) => {
      rr(ctx, gx + d * cw + 4, gy + 22 + s * rh, cw - 8, l * rh - 4, 8); ctx.fillStyle = c + "44"; ctx.fill();
      ctx.fillStyle = c; ctx.fillRect(gx + d * cw + 4, gy + 24 + s * rh, 4, l * rh - 8);
    });
    // scanning sweep
    if (ph.step < 1 && ph.step > 0) {
      const sx = gx + (w - 80) * ph.step;
      const g = ctx.createLinearGradient(sx - 80, 0, sx, 0); g.addColorStop(0, "rgba(110,139,255,0)"); g.addColorStop(1, "rgba(110,139,255,.35)");
      ctx.fillStyle = g; ctx.fillRect(sx - 80, gy + 20, 80, rh * 8);
    }
    // the free slot: Fri 2 PM (row 5)
    if (ph.step >= 1) {
      const sx = gx + 4 * cw + 4, sy = gy + 22 + 5 * rh;
      const pulse = 0.5 + 0.5 * Math.sin(time * 5);
      if (ph.step < 2) { rr(ctx, sx, sy, cw - 8, rh - 4, 8); ctx.strokeStyle = `rgba(61,220,151,${0.5 + pulse * 0.5})`; ctx.lineWidth = 3; ctx.stroke(); }
      if (ph.step >= 2) {
        const solid = ph.done > 0;
        rr(ctx, sx, sy, cw - 8, rh - 4, 8);
        ctx.fillStyle = solid ? "#3ddc97" : "rgba(61,220,151,.18)"; ctx.fill();
        if (!solid) { ctx.setLineDash([6, 5]); ctx.strokeStyle = "#3ddc97"; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
        ctx.fillStyle = solid ? "#08130e" : "#3ddc97"; ctx.font = `700 13px ${FONT}`; ctx.fillText("Meet Ada", sx + 10, sy + 25);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* laptop                                                              */
  /* ------------------------------------------------------------------ */
  const laptop = new THREE.Group();
  root.add(laptop);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2e3a, metalness: 0.75, roughness: 0.32 });
  const BW = 4.6, BD = 3.0, BH = 0.16;
  const base = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, BD, 4, 0.08), bodyMat);
  laptop.add(base);

  // keyboard texture
  const kb = makeCanvasTex(1024, 640);
  {
    const k = kb.ctx;
    k.fillStyle = "#14161d"; k.fillRect(0, 0, 1024, 640);
    const rows = [14, 14, 13, 12, 11];
    rows.forEach((n, r) => {
      const kw = 1024 / 14.6;
      for (let i = 0; i < n; i++) {
        let w = kw - 8; let x = 10 + i * kw + (14 - n) * kw * 0.5;
        rr(k, x, 22 + r * 74, w, 62, 10); k.fillStyle = "#1f222c"; k.fill();
        k.strokeStyle = "rgba(140,160,255,.18)"; k.lineWidth = 2; k.stroke();
      }
    });
    rr(k, 260, 22 + 5 * 74, 500, 62, 10); k.fillStyle = "#1f222c"; k.fill();
    kb.tex.needsUpdate = true;
  }
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(BW * 0.86, BD * 0.5),
    new THREE.MeshStandardMaterial({ map: kb.tex, roughness: 0.8, metalness: 0.1, emissive: 0x2a3560, emissiveIntensity: 0.25, emissiveMap: kb.tex }));
  keys.rotation.x = -Math.PI / 2; keys.position.set(0, BH / 2 + 0.002, -0.22);
  laptop.add(keys);
  const pad = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.01, 0.8, 2, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x23262f, metalness: 0.5, roughness: 0.4 }));
  pad.position.set(0, BH / 2 + 0.003, 0.95);
  laptop.add(pad);

  // lid (hinged at the back edge)
  const hinge = new THREE.Group();
  hinge.position.set(0, BH / 2, -BD / 2 + 0.04);
  laptop.add(hinge);
  const LH = 2.95;
  const lid = new THREE.Mesh(new RoundedBoxGeometry(BW, LH, 0.1, 4, 0.06), bodyMat);
  lid.position.set(0, LH / 2, -0.05);
  hinge.add(lid);
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.12, LH - 0.12), new THREE.MeshBasicMaterial({ color: 0x07080b }));
  bezel.position.set(0, LH / 2, 0.002);
  hinge.add(bezel);
  const displayW = BW - 0.3, displayH = displayW * (SH / SW);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(displayW, displayH),
    new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
  display.position.set(0, LH / 2 + 0.04, 0.004);
  hinge.add(display);
  // screen glow onto the keyboard
  const glowL = new THREE.PointLight(0x8aa2ff, 6, 5, 2);
  glowL.position.set(0, 1.2, 0.6); hinge.add(glowL);

  hinge.rotation.x = -0.24; // lid opened ~104°

  laptop.position.set(0, -1.35, 0);
  laptop.rotation.set(0.12, -0.42, 0);

  /* ------------------------------------------------------------------ */
  /* the orb — S-CLAW's brain                                            */
  /* ------------------------------------------------------------------ */
  const orbUniforms = {
    uTime: { value: 0 },
    uA: { value: C.blue }, uB: { value: C.violet }, uC: { value: C.peach },
    uPulse: { value: 0 },
  };
  const orbMat = new THREE.ShaderMaterial({
    uniforms: orbUniforms,
    transparent: true,
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uPulse;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      float wob(vec3 p){
        return sin(p.x*3.1+uTime*1.3)*sin(p.y*3.7+uTime*1.1)*sin(p.z*2.9+uTime*0.9)
             + 0.35*sin(p.x*6.0-uTime*1.7+p.y*4.0);
      }
      void main(){
        vec3 p = position + normal * (wob(position)*0.03*(1.0+uPulse*1.1));
        vP = p;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uPulse;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){
        float fr = pow(1.0 - max(dot(vN, vV), 0.0), 2.2);
        float a = sin(vP.y*3.0 + uTime*1.2)*0.5+0.5;
        float b = sin(vP.x*2.6 - uTime*0.9 + vP.z*2.0)*0.5+0.5;
        vec3 col = mix(uA, uB, a);
        col = mix(col, uC, b*0.55);
        vec3 core = vec3(0.04,0.045,0.08);
        vec3 c = mix(core + col*0.35, col*1.6 + vec3(0.25), fr);
        c += col * 0.35 * uPulse;
        float spec = pow(max(dot(reflect(-vV, vN), normalize(vec3(-0.4,0.7,0.6))),0.0), 24.0);
        c += vec3(1.0)*spec*0.5;
        gl_FragColor = vec4(c, 0.96);
      }`,
  });
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 48), orbMat);
  const orbGroup = new THREE.Group();
  orbGroup.add(orb);
  root.add(orbGroup);

  // halo sprite
  function glowTex(color) {
    const g = makeCanvasTex(256, 256);
    const grd = g.ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, color); grd.addColorStop(0.35, color.replace("1)", "0.35)")); grd.addColorStop(1, "rgba(0,0,0,0)");
    g.ctx.fillStyle = grd; g.ctx.fillRect(0, 0, 256, 256); g.tex.needsUpdate = true;
    return g.tex;
  }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("rgba(140,150,255,1)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85 }));
  halo.scale.set(3.4, 3.4, 1);
  orbGroup.add(halo);

  // rings around the orb
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x8aa2ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.008, 8, 128), ringMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.006, 8, 128), ringMat.clone());
  ring2.material.color = new THREE.Color(0xb38cff);
  orbGroup.add(ring1, ring2);

  /* ------------------------------------------------------------------ */
  /* floating app windows                                                */
  /* ------------------------------------------------------------------ */
  const PW = 640, PH = 420;
  const PANEL_INFO = [
    { title: "WhatsApp", sub: "Reply to Mum", color: "#25d366", kind: "chat" },
    { title: "Email", sub: "Invoice to Tunde", color: "#ff6b6b", kind: "mail" },
    { title: "Calendar", sub: "Meet Ada · Fri 2 PM", color: "#6e8bff", kind: "cal" },
  ];
  function drawPanel(p, i, state) {
    const ctx = p.ctx, info = PANEL_INFO[i];
    ctx.clearRect(0, 0, PW, PH);
    ctx.save();
    rr(ctx, 6, 6, PW - 12, PH - 12, 36);
    const g = ctx.createLinearGradient(0, 0, PW, PH);
    g.addColorStop(0, "rgba(28,31,44,.94)"); g.addColorStop(1, "rgba(18,20,30,.94)");
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = state === "work" ? 6 : 3;
    ctx.strokeStyle = state === "work" ? "rgba(138,162,255,.95)" : state === "done" ? "rgba(61,220,151,.8)" : "rgba(255,255,255,.14)";
    ctx.stroke();
    ctx.clip();
    // header
    rr(ctx, 34, 34, 64, 64, 18); ctx.fillStyle = info.color; ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.95)";
    if (info.kind === "chat") { ctx.beginPath(); ctx.arc(66, 64, 18, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(52, 82); ctx.lineTo(50, 92); ctx.lineTo(60, 80); ctx.fill(); }
    if (info.kind === "mail") { rr(ctx, 46, 50, 40, 28, 5); ctx.fill(); ctx.strokeStyle = info.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(48, 53); ctx.lineTo(66, 67); ctx.lineTo(84, 53); ctx.stroke(); }
    if (info.kind === "cal") { rr(ctx, 46, 46, 40, 38, 6); ctx.fill(); ctx.fillStyle = info.color; ctx.fillRect(46, 56, 40, 4); }
    ctx.fillStyle = "#fff"; ctx.font = `700 34px ${DISPLAY}`; ctx.textBaseline = "middle";
    ctx.fillText(info.title, 120, 56);
    ctx.fillStyle = "#a6a7ae"; ctx.font = `500 24px ${FONT}`; ctx.fillText(info.sub, 120, 90);
    // body lines
    if (info.kind === "chat") {
      rr(ctx, 34, 136, 330, 56, 18); ctx.fillStyle = "#202c33"; ctx.fill();
      ctx.fillStyle = "#e9edef"; ctx.font = `400 24px ${FONT}`; ctx.fillText("Are you calling today?", 54, 165);
      if (state === "done") { rr(ctx, PW - 270, 214, 236, 56, 18); ctx.fillStyle = "#005c4b"; ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillText("I'll call at 7 ✓✓", PW - 252, 243); }
    } else if (info.kind === "mail") {
      for (let k = 0; k < 3; k++) { rr(ctx, 34, 140 + k * 40, [520, 420, 470][k], 18, 9); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill(); }
      rr(ctx, 34, 264, 300, 50, 14); ctx.fillStyle = "rgba(255,107,107,.18)"; ctx.fill();
      ctx.fillStyle = "#ffb3b3"; ctx.font = `500 22px ${FONT}`; ctx.fillText("Invoice-October.pdf", 54, 290);
    } else {
      for (let d = 0; d < 5; d++) for (let r = 0; r < 3; r++) {
        rr(ctx, 34 + d * 112, 136 + r * 58, 100, 48, 10);
        const isSlot = d === 4 && r === 1;
        ctx.fillStyle = isSlot ? (state === "done" ? "#3ddc97" : "rgba(61,220,151,.22)") : ((d + r) % 3 === 0 ? "rgba(110,139,255,.35)" : "rgba(255,255,255,.05)");
        ctx.fill();
      }
    }
    // status pill
    const label = state === "work" ? "S-CLAW is working…" : state === "done" ? "Done ✓" : "Ready";
    ctx.font = `600 24px ${FONT}`;
    const lw = ctx.measureText(label).width + 44;
    rr(ctx, 34, PH - 86, lw, 50, 25);
    ctx.fillStyle = state === "work" ? "rgba(110,139,255,.25)" : state === "done" ? "rgba(61,220,151,.22)" : "rgba(255,255,255,.07)";
    ctx.fill();
    ctx.fillStyle = state === "work" ? "#b9c6ff" : state === "done" ? "#3ddc97" : "#a6a7ae";
    ctx.fillText(label, 56, PH - 60);
    ctx.restore();
    p.tex.needsUpdate = true;
  }

  const panels = PANEL_INFO.map((info, i) => {
    const p = makeCanvasTex(PW, PH);
    drawPanel(p, i, "idle");
    const mat = new THREE.MeshBasicMaterial({ map: p.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0 * PH / PW), mat);
    const g = new THREE.Group(); g.add(mesh);
    // glow behind panel
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("rgba(110,139,255,1)"), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    gl.scale.set(3.6, 2.6, 1); gl.position.z = -0.05; g.add(gl);
    root.add(g);
    return { p, mesh, g, glow: gl, state: "idle", base: new THREE.Vector3(), phase: i * 2.1 };
  });

  /* ------------------------------------------------------------------ */
  /* work beams — particles flowing brain → screen → app                 */
  /* ------------------------------------------------------------------ */
  const BEAM_N = 90;
  function makeBeam(color) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(BEAM_N * 3), 3));
    const mat = new THREE.PointsMaterial({ color, size: 0.14, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex("rgba(255,255,255,1)") });
    const pts = new THREE.Points(geo, mat);
    root.add(pts);
    return { pts, geo, mat, curve: new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()) };
  }
  const beamIn = makeBeam(0x9db4ff);   // orb -> screen
  const beamOut = makeBeam(0xc9b2ff);  // screen -> panel
  function updateBeam(b, from, to, lift, t, speed) {
    b.curve.v0.copy(from); b.curve.v2.copy(to);
    b.curve.v1.copy(from).add(to).multiplyScalar(0.5); b.curve.v1.y += lift;
    const arr = b.geo.attributes.position.array, v = new THREE.Vector3();
    for (let i = 0; i < BEAM_N; i++) {
      const u = (i / BEAM_N + t * speed) % 1;
      b.curve.getPoint(u, v);
      const j = Math.sin(i * 12.9898) * 0.04;
      arr[i * 3] = v.x + j; arr[i * 3 + 1] = v.y + j * 0.7; arr[i * 3 + 2] = v.z - j;
    }
    b.geo.attributes.position.needsUpdate = true;
  }

  /* ambient sparkles */
  const DUST = 260;
  const dGeo = new THREE.BufferGeometry();
  const dPos = new Float32Array(DUST * 3), dCol = new Float32Array(DUST * 3);
  const palette = [C.blue, C.violet, C.peach, new THREE.Color("#ffffff")];
  for (let i = 0; i < DUST; i++) {
    dPos[i * 3] = (Math.random() - 0.5) * 16;
    dPos[i * 3 + 1] = (Math.random() - 0.5) * 9;
    dPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    const c = palette[i % 4]; dCol[i * 3] = c.r; dCol[i * 3 + 1] = c.g; dCol[i * 3 + 2] = c.b;
  }
  dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute("color", new THREE.BufferAttribute(dCol, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex("rgba(255,255,255,1)") }));
  root.add(dust);

  /* ------------------------------------------------------------------ */
  /* layout (responsive) + theme                                         */
  /* ------------------------------------------------------------------ */
  let narrow = false;
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    narrow = camera.aspect < 1.05;
    const wantW = narrow ? 5.4 : 11.0;
    const dist = wantW / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    camera.position.set(0, narrow ? 1.0 : 0.9, Math.max(9, Math.min(dist, 24)));
    camera.lookAt(0, narrow ? -0.1 : -0.25, 0);
    camera.updateProjectionMatrix();

    if (narrow) {
      orbGroup.position.set(0, 2.85, 0); orbGroup.scale.setScalar(0.5);
      panels[0].base.set(-1.75, 1.7, 0);
      panels[1].base.set(0, 1.7, 0);
      panels[2].base.set(1.75, 1.7, 0);
      panels.forEach((p) => p.g.scale.setScalar(0.5));
      laptop.scale.setScalar(0.85); laptop.position.set(0, -1.3, 0);
    } else {
      orbGroup.position.set(3.75, 1.55, 0.2); orbGroup.scale.setScalar(0.9);
      panels[0].base.set(-3.9, 1.3, -0.4);
      panels[1].base.set(4.0, -0.75, -0.2);
      panels[2].base.set(-3.6, -1.2, 0.9);
      panels.forEach((p) => p.g.scale.setScalar(1));
      laptop.scale.setScalar(1.08); laptop.position.set(0, -1.25, 0);
    }
  }
  function applyTheme() {
    const light = document.documentElement.dataset.theme === "light";
    bodyMat.color.set(light ? 0xc9ccd6 : 0x2a2e3a);
    bodyMat.roughness = light ? 0.28 : 0.32;
    dust.material.opacity = light ? 0.45 : 0.7;
    dust.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    dust.material.needsUpdate = true;
  }
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  applyTheme();
  new ResizeObserver(layout).observe(stage);
  layout();

  /* pointer parallax */
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });

  /* ------------------------------------------------------------------ */
  /* loop                                                                */
  /* ------------------------------------------------------------------ */
  let visible = true, running = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.02 }).observe(stage);
  document.addEventListener("visibilitychange", () => { running = !document.hidden; });

  const FORCED = (() => { const v = new URLSearchParams(location.search).get("demo"); return v ? parseFloat(v) : null; })();
  const clock = new THREE.Clock();
  let elapsed = 0, lastTask = -1;
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
  const caption = document.getElementById("stageCaption");

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || !running) return;
    elapsed += reduceMotion ? 0 : dt;
    const time = FORCED != null ? FORCED : reduceMotion ? 8 : elapsed;

    const cycle = time % (T_TASK * TASKS.length);
    const taskIdx = reduceMotion ? 0 : Math.floor(cycle / T_TASK);
    const t = reduceMotion ? T_DONE + 1 : cycle % T_TASK;
    const ph = phaseOf(t);

    if (taskIdx !== lastTask) {
      lastTask = taskIdx;
      if (taskIdx === 0) panels.forEach((p, i) => { p.state = "idle"; drawPanel(p.p, i, "idle"); });
      if (caption) caption.textContent = TASKS[taskIdx].cmd;
    }
    const want = ph.done > 0 ? "done" : t > T_STEP0 ? "work" : panels[taskIdx].state === "done" ? "done" : "idle";
    if (panels[taskIdx].state !== want) { panels[taskIdx].state = want; drawPanel(panels[taskIdx].p, taskIdx, want); }

    drawScreen(time, taskIdx, t);

    // parallax + idle sway
    cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
    root.rotation.y = cur.x * 0.16 + Math.sin(time * 0.25) * 0.05;
    root.rotation.x = cur.y * 0.06;

    laptop.position.y = (narrow ? -1.3 : -1.25) + Math.sin(time * 0.8) * 0.05;

    // orb
    orbUniforms.uTime.value = time;
    const thinking = t > T_TYPE[1] - 0.3 && t < T_STEP0 + T_STEP * 3 ? 1 : 0;
    orbUniforms.uPulse.value += ((thinking ? 0.9 : 0.15) + Math.sin(time * 3) * 0.1 - orbUniforms.uPulse.value) * 0.06;
    orb.position.y = Math.sin(time * 1.1) * 0.08; orb.rotation.y = time * 0.3; orb.rotation.x = Math.sin(time * 0.4) * 0.3;
    const s = 1 + orbUniforms.uPulse.value * 0.08;
    orb.scale.setScalar(s);
    halo.material.opacity = 0.55 + orbUniforms.uPulse.value * 0.4;
    ring1.rotation.set(1.2 + Math.sin(time * 0.5) * 0.2, time * 0.6, 0);
    ring2.rotation.set(-0.9, time * -0.45, 0.4 + Math.cos(time * 0.4) * 0.2);
    

    // coloured lights orbit the orb
    const op = orbGroup.position;
    pBlue.position.set(op.x + Math.cos(time) * 2, op.y + 0.5, op.z + Math.sin(time) * 2);
    pViolet.position.set(-3 + Math.sin(time * 0.6) * 1.5, 1.5, 2.5);
    pPeach.position.set(2 + Math.cos(time * 0.7) * 2, -2, 2.2);

    // panels float
    panels.forEach((p, i) => {
      const active = i === taskIdx && p.state === "work";
      p.g.position.copy(p.base);
      p.g.position.y += Math.sin(time * 0.9 + p.phase) * 0.12;
      p.g.position.z += active ? (narrow ? 0.3 : 0.45) : 0;
      p.g.rotation.y = (Math.abs(p.base.x) < 0.1 ? 0 : p.base.x < 0 ? (narrow ? 0.25 : 0.38) : (narrow ? -0.25 : -0.38)) + Math.sin(time * 0.5 + p.phase) * 0.06;
      p.g.rotation.x = Math.sin(time * 0.7 + p.phase) * 0.04;
      const go = active ? 0.9 : p.state === "done" ? 0.35 : 0.1;
      p.glow.material.opacity += (go - p.glow.material.opacity) * 0.08;
      p.glow.material.color.set(p.state === "done" ? 0x3ddc97 : 0x6e8bff);
    });

    // beams
    display.getWorldPosition(v2);
    root.worldToLocal(v2);
    v1.copy(orbGroup.position);
    v3.copy(panels[taskIdx].g.position);
    updateBeam(beamIn, v1, v2, 0.9, time, 0.35);
    updateBeam(beamOut, v2, v3, 1.4, time, 0.4);
    const inOn = t > T_TYPE[1] - 0.2 && t < T_STEP0 + 1.2 ? 1 : 0;
    const outOn = t > T_STEP0 && t < T_DONE + 1.2 ? 1 : 0;
    beamIn.mat.opacity += (inOn * 0.95 - beamIn.mat.opacity) * 0.08;
    beamOut.mat.opacity += (outOn * 0.9 - beamOut.mat.opacity) * 0.08;

    dust.rotation.y = time * 0.02;
    dust.position.y = Math.sin(time * 0.2) * 0.2;

    renderer.render(scene, camera);
  }
  stage.classList.add("is3d");
  frame();
}
