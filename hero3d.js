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
  const DPR = window.devicePixelRatio || 1;
  const SMALL = Math.min(screen.width, screen.height) < 700;
  const renderer = new THREE.WebGLRenderer({ antialias: DPR < 1.5, alpha: true, powerPreference: "high-performance" });
  let pixelRatio = Math.min(DPR, SMALL ? 1.5 : 1.6);
  renderer.setPixelRatio(pixelRatio);
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
  /* the tasks — shown on the laptop as a fast motion graphic            */
  /* ------------------------------------------------------------------ */
  const TASKS = [
    { cmd: "Reply to Mum on WhatsApp", accent: "#25d366", accent2: "#0fb5a5", app: "chat",
      steps: ["Open WhatsApp", "Find “Mum”", "Type the reply"],
      ask: "Send “I'll call at 7”?", done: "Message sent", icon: "chat" },
    { cmd: "Email the October invoice to Tunde", accent: "#ff6b6b", accent2: "#ff9a5a", app: "mail",
      steps: ["Find the invoice", "Attach the PDF", "Write the email"],
      ask: "Send email to Tunde?", done: "Email sent", icon: "mail" },
    { cmd: "Book 30 min with Ada on Friday", accent: "#6e8bff", accent2: "#b38cff", app: "cal",
      steps: ["Check calendar", "Find a free slot", "Add the event"],
      ask: "Add Fri, 2:00 PM?", done: "Meeting booked", icon: "cal" },
  ];

  // timeline (seconds) for one task
  const T_TASK = 6.6;
  const T_TYPE = [0.15, 1.05];
  const T_STEP0 = 1.3, T_STEP = 0.9;
  const T_APP = 2.0, T_CHECK = [2.65, 3.25, 3.85];
  const T_ASK = 4.0, T_CLICK = 4.55, T_DONE = 4.9, T_WIPE = 6.2;

  function phaseOf(t) {
    return { done: t >= T_DONE ? clamp01((t - T_DONE) / 0.4) : 0 };
  }

  const easeOutBack = (x) => { x = clamp01(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(x)));
  const easeInOut = (x) => ease(x);
  const seg = (t, a, b) => clamp01((t - a) / (b - a));

  /* ------------------------------------------------------------------ */
  /* laptop screen (drawn ~30 times a second)                            */
  /* ------------------------------------------------------------------ */
  const SW = 1280, SH = 800, SCALE = SMALL ? 0.6 : 0.75;
  const screenTex = makeCanvasTex(Math.round(SW * SCALE), Math.round(SH * SCALE));
  let screenOn = 0; // 0..1, fades the screen in after the lid opens

  function icon(ctx, kind, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    if (kind === "chat") { ctx.moveTo(4, 18); ctx.lineTo(5, 14.5); ctx.arc(12, 11, 8, 2.6, 2.2 + Math.PI * 2 - 0.3); ctx.closePath(); }
    else if (kind === "mail") { rr(ctx, 3, 6, 18, 13, 3); ctx.moveTo(4, 8); ctx.lineTo(12, 13.5); ctx.lineTo(20, 8); }
    else { rr(ctx, 3.5, 5, 17, 15, 3); ctx.moveTo(3.5, 10); ctx.lineTo(20.5, 10); ctx.moveTo(8, 3); ctx.lineTo(8, 7); ctx.moveTo(16, 3); ctx.lineTo(16, 7); }
    ctx.stroke(); ctx.restore();
  }

  function drawCursor(ctx, x, y, a) {
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(1.5, 1.5);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(8, 23); ctx.lineTo(14, 36); ctx.lineTo(19, 34); ctx.lineTo(13, 21); ctx.lineTo(23, 21); ctx.closePath();
    ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#0b0c12"; ctx.stroke();
    ctx.restore();
  }

  // app window rectangle
  const AX = 560, AY = 196, AW = 650, AH = 500;

  function cursorPath(task, t) {
    // keyframes: [time, x, y]
    const K = {
      chat: [[2.0, 900, 640], [2.45, 700, 330], [2.9, 700, 330], [3.3, 880, 640], [3.95, 880, 640]],
      mail: [[2.0, 900, 640], [2.4, 760, 420], [2.9, 760, 420], [3.25, 1000, 600], [3.95, 1000, 600]],
      cal:  [[2.0, 700, 640], [2.5, 1110, 520], [3.0, 1110, 520], [3.4, 1110, 470], [3.95, 1110, 470]],
    }[task.app].concat([[4.15, 900, 600], [4.5, 812, 520]]);
    if (t <= K[0][0]) return [K[0][1], K[0][2]];
    for (let i = 1; i < K.length; i++) {
      if (t <= K[i][0]) {
        const u = easeInOut(seg(t, K[i - 1][0], K[i][0]));
        return [lerp(K[i - 1][1], K[i][1], u), lerp(K[i - 1][2], K[i][2], u)];
      }
    }
    return [K[K.length - 1][1], K[K.length - 1][2]];
  }

  function drawScreen(time, taskIdx, t) {
    const ctx = screenTex.ctx, task = TASKS[taskIdx];
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.globalAlpha = 1;

    /* ---- living background ---- */
    const bg = ctx.createLinearGradient(0, 0, SW, SH);
    bg.addColorStop(0, "#0d1022"); bg.addColorStop(1, "#160f24");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, SW, SH);
    const g1 = ctx.createRadialGradient(260 + Math.sin(time * 0.7) * 80, 220, 0, 260, 220, 520);
    g1.addColorStop(0, task.accent + "40"); g1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g1; ctx.fillRect(0, 0, SW, SH);
    const g2 = ctx.createRadialGradient(1050, 650 + Math.cos(time * 0.6) * 60, 0, 1050, 650, 560);
    g2.addColorStop(0, task.accent2 + "38"); g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2; ctx.fillRect(0, 0, SW, SH);
    // moving perspective floor lines
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.05)"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {
      const z = ((i / 9) + time * 0.12) % 1, y = 560 + Math.pow(z, 2) * 240;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SW, y); ctx.stroke();
    }
    for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(SW / 2 + i * 40, 560); ctx.lineTo(SW / 2 + i * 190, SH); ctx.stroke(); }
    ctx.restore();

    /* ---- top bar ---- */
    orbGlyph(ctx, 52, 44, 16, time * 1.4);
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.font = `700 24px ${DISPLAY}`; ctx.fillStyle = "#fff"; ctx.fillText("S-CLAW", 80, 45);
    const working = t < T_DONE;
    rr(ctx, SW - 300, 26, 256, 38, 19); ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fill();
    ctx.fillStyle = working ? task.accent : "#3ddc97";
    ctx.beginPath(); ctx.arc(SW - 278, 45, 7 + (working ? Math.sin(time * 8) * 1.5 : 0), 0, 7); ctx.fill();
    ctx.font = `600 18px ${FONT}`; ctx.fillStyle = "#e9eaf3";
    ctx.fillText(working ? "Working on your PC" : "All steps checked", SW - 260, 46);

    /* ---- A: the command, typed big ---- */
    const pillIn = easeOutBack(seg(t, 0.0, 0.35));
    const toTop = easeOutExpo(seg(t, T_STEP0 - 0.1, T_STEP0 + 0.5));
    const typed = seg(t, T_TYPE[0], T_TYPE[1]);
    const shown = task.cmd.slice(0, Math.round(task.cmd.length * typed));
    ctx.save();
    const pcx = lerp(SW / 2, SW / 2, toTop), pcy = lerp(380, 132, toTop), ps = lerp(1, 0.62, toTop) * (0.6 + 0.4 * pillIn);
    ctx.translate(pcx, pcy); ctx.scale(ps, ps); ctx.globalAlpha = clamp01(pillIn * 1.5);
    ctx.font = `700 50px ${DISPLAY}`;
    const fullW = ctx.measureText(task.cmd).width;
    const pw = fullW + 170, ph2 = 110;
    // glow
    ctx.shadowColor = task.accent; ctx.shadowBlur = 50 * (1 - toTop * 0.6);
    rr(ctx, -pw / 2, -ph2 / 2, pw, ph2, 55);
    const pg = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
    pg.addColorStop(0, "rgba(28,32,58,.96)"); pg.addColorStop(1, "rgba(38,26,58,.96)");
    ctx.fillStyle = pg; ctx.fill(); ctx.shadowBlur = 0;
    // animated gradient border
    const bgd = ctx.createLinearGradient(-pw / 2 + Math.sin(time * 2) * 200, 0, pw / 2, 0);
    bgd.addColorStop(0, task.accent); bgd.addColorStop(0.5, "#b38cff"); bgd.addColorStop(1, task.accent2);
    ctx.strokeStyle = bgd; ctx.lineWidth = 4; ctx.stroke();
    orbGlyph(ctx, -pw / 2 + 58, 0, 24, time * 2);
    ctx.fillStyle = "#fff"; ctx.textAlign = "left";
    ctx.fillText(shown, -pw / 2 + 100, 3);
    if (typed < 1 || (t < T_STEP0 && Math.floor(time * 3) % 2 === 0)) {
      const cw = ctx.measureText(shown).width;
      ctx.fillStyle = task.accent; ctx.fillRect(-pw / 2 + 106 + cw, -26, 5, 52);
    }
    ctx.restore();
    // hint under the command
    if (t < T_STEP0) {
      ctx.save(); ctx.globalAlpha = seg(t, 0.4, 0.8) * (1 - seg(t, T_STEP0 - 0.3, T_STEP0));
      ctx.textAlign = "center"; ctx.font = `500 24px ${FONT}`; ctx.fillStyle = "#a9adc6";
      ctx.fillText("You type one sentence. S-CLAW does the rest.", SW / 2, 480);
      ctx.restore();
    }

    /* ---- B/C: plan steps fly out ---- */
    if (t >= T_STEP0) {
      task.steps.forEach((s, i) => {
        const a = easeOutBack(seg(t, T_STEP0 + 0.12 + i * 0.12, T_STEP0 + 0.62 + i * 0.12));
        const x = lerp(SW / 2 - 200, 70, a), y = lerp(132, 250 + i * 128, a);
        const doneAt = T_CHECK[i], isDone = t >= doneAt;
        const active = !isDone && (i === 0 ? t >= T_APP - 0.2 : t >= T_CHECK[i - 1]);
        ctx.save(); ctx.globalAlpha = clamp01(a * 1.4);
        ctx.translate(x, y);
        const pop = isDone ? 1 + 0.08 * Math.sin(Math.PI * seg(t, doneAt, doneAt + 0.25)) : 1;
        ctx.scale(pop, pop);
        rr(ctx, 0, 0, 440, 100, 26);
        ctx.fillStyle = isDone ? "rgba(61,220,151,.12)" : active ? "rgba(255,255,255,.09)" : "rgba(255,255,255,.04)"; ctx.fill();
        if (active) {
          const sh = ctx.createLinearGradient(-200 + ((time * 600) % 900), 0, 100 + ((time * 600) % 900), 0);
          sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.5, task.accent + "55"); sh.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = sh; ctx.fill();
        }
        ctx.lineWidth = 3; ctx.strokeStyle = isDone ? "rgba(61,220,151,.7)" : active ? task.accent : "rgba(255,255,255,.1)"; ctx.stroke();
        // number / check bubble
        ctx.beginPath(); ctx.arc(52, 50, 26, 0, 7);
        ctx.fillStyle = isDone ? "#3ddc97" : active ? task.accent : "rgba(255,255,255,.1)"; ctx.fill();
        if (isDone) drawCheck(ctx, 52, 50, 40 * easeOutBack(seg(t, doneAt, doneAt + 0.3)), "#06130d");
        else if (active) { ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(52, 50, 14, time * 8, time * 8 + 4); ctx.stroke(); }
        else { ctx.fillStyle = "#c9cbe0"; ctx.font = `700 24px ${DISPLAY}`; ctx.textAlign = "center"; ctx.fillText(String(i + 1), 52, 52); }
        ctx.textAlign = "left"; ctx.font = `600 30px ${FONT}`;
        ctx.fillStyle = isDone ? "#cfeee0" : active ? "#fff" : "#8d90a8";
        ctx.fillText(s, 98, 52);
        ctx.restore();
      });
    }

    /* ---- C: the app, working ---- */
    if (t >= T_APP - 0.3) {
      const a = easeOutBack(seg(t, T_APP - 0.3, T_APP + 0.25));
      const p = seg(t, T_APP, T_ASK);
      ctx.save();
      ctx.globalAlpha = clamp01(a * 1.3);
      ctx.translate(AX + AW / 2, AY + AH / 2); ctx.scale(0.7 + 0.3 * a, 0.7 + 0.3 * a); ctx.rotate((1 - a) * 0.06);
      ctx.translate(-AW / 2, -AH / 2);
      ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
      rr(ctx, 0, 0, AW, AH, 30); ctx.fillStyle = "#121521"; ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.stroke();
      ctx.save(); rr(ctx, 0, 0, AW, AH, 30); ctx.clip();
      // title bar
      ctx.fillStyle = task.accent + "26"; ctx.fillRect(0, 0, AW, 76);
      rr(ctx, 22, 16, 44, 44, 13); ctx.fillStyle = task.accent; ctx.fill();
      icon(ctx, task.icon, 32, 26, 24, "#fff");
      ctx.font = `700 26px ${DISPLAY}`; ctx.fillStyle = "#fff"; ctx.textAlign = "left";
      ctx.fillText({ chat: "WhatsApp", mail: "Email", cal: "Calendar" }[task.app], 82, 40);
      ["#ff5f57", "#febc2e", "#28c840"].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(AW - 90 + k * 26, 38, 8, 0, 7); ctx.fill(); });
      if (task.app === "chat") drawChat(ctx, p, t, time, task);
      else if (task.app === "mail") drawMail(ctx, p, t, time, task);
      else drawCal(ctx, p, t, time, task);
      ctx.restore();
      ctx.restore();
    }

    /* ---- D: approval card ---- */
    if (t >= T_ASK && t < T_DONE + 0.3) {
      const a = easeOutBack(seg(t, T_ASK, T_ASK + 0.35)) * (1 - seg(t, T_DONE, T_DONE + 0.25));
      ctx.save();
      ctx.globalAlpha = clamp01(a);
      ctx.fillStyle = "rgba(6,7,14,.55)"; ctx.fillRect(0, 0, SW, SH);
      ctx.translate(SW / 2, 470 + (1 - a) * 80); ctx.scale(0.85 + 0.15 * a, 0.85 + 0.15 * a);
      ctx.shadowColor = "#f3b65c"; ctx.shadowBlur = 40;
      rr(ctx, -330, -120, 660, 220, 32); ctx.fillStyle = "#1b1a22"; ctx.fill(); ctx.shadowBlur = 0;
      ctx.lineWidth = 3; ctx.strokeStyle = "rgba(243,182,92,.8)"; ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = `700 18px ${FONT}`; ctx.fillStyle = "#f3b65c"; ctx.fillText("NEEDS YOUR OK", 0, -78);
      ctx.font = `700 36px ${DISPLAY}`; ctx.fillStyle = "#fff"; ctx.fillText(task.ask, 0, -28);
      // buttons
      rr(ctx, -250, 20, 200, 62, 31); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
      ctx.font = `600 24px ${FONT}`; ctx.fillStyle = "#c9cad1"; ctx.fillText("Cancel", -150, 52);
      const press = t > T_CLICK && t < T_CLICK + 0.18 ? 0.92 : 1;
      ctx.save(); ctx.translate(140, 51); ctx.scale(press, press);
      rr(ctx, -110, -31, 220, 62, 31);
      const bgr = ctx.createLinearGradient(-110, 0, 110, 0); bgr.addColorStop(0, "#6e8bff"); bgr.addColorStop(1, "#b38cff");
      ctx.fillStyle = bgr; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = `700 24px ${FONT}`; ctx.fillText("Approve", 0, 2);
      ctx.restore();
      ctx.restore();
      if (t > T_CLICK) {
        const r = seg(t, T_CLICK, T_CLICK + 0.45);
        ctx.save(); ctx.globalAlpha = 1 - r; ctx.strokeStyle = "#fff"; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(SW / 2 + 140, 521, 20 + r * 90, 0, 7); ctx.stroke(); ctx.restore();
      }
    }

    /* ---- cursor with motion trail ---- */
    if (t >= T_APP && t < T_DONE) {
      for (let k = 4; k >= 0; k--) {
        const [cx, cy] = cursorPath(task, t - k * 0.035);
        drawCursor(ctx, cx, cy, k === 0 ? 1 : 0.12 * (5 - k) / 5);
      }
    }

    /* ---- E: done celebration ---- */
    if (t >= T_DONE) {
      const d = seg(t, T_DONE, T_DONE + 0.35);
      ctx.save();
      ctx.fillStyle = `rgba(8,9,18,${0.8 * d})`; ctx.fillRect(0, 0, SW, SH);
      const cx = SW / 2, cy = 330;
      // rings
      for (let k = 0; k < 3; k++) {
        const rp = seg(t, T_DONE + k * 0.12, T_DONE + 0.9 + k * 0.12);
        ctx.globalAlpha = (1 - rp) * 0.7; ctx.strokeStyle = k === 1 ? task.accent : "#3ddc97"; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(cx, cy, 110 + rp * 260, 0, 7); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // big circle + drawn tick
      const cs = easeOutBack(seg(t, T_DONE, T_DONE + 0.4));
      ctx.save(); ctx.translate(cx, cy); ctx.scale(cs, cs);
      ctx.shadowColor = "#3ddc97"; ctx.shadowBlur = 60;
      const cg = ctx.createLinearGradient(-110, -110, 110, 110); cg.addColorStop(0, "#3ddc97"); cg.addColorStop(1, task.accent2);
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, 110, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
      const tk = easeOutExpo(seg(t, T_DONE + 0.15, T_DONE + 0.6));
      ctx.strokeStyle = "#06130d"; ctx.lineWidth = 20; ctx.lineCap = "round"; ctx.lineJoin = "round";
      const P = [[-46, 4], [-12, 38], [52, -32]];
      const L1 = Math.hypot(34, 34), L2 = Math.hypot(64, 70), Ltot = L1 + L2, Ld = tk * Ltot;
      ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
      if (Ld <= L1) ctx.lineTo(P[0][0] + 34 * Ld / L1, P[0][1] + 34 * Ld / L1);
      else { ctx.lineTo(P[1][0], P[1][1]); const u = (Ld - L1) / L2; ctx.lineTo(P[1][0] + 64 * u, P[1][1] - 70 * u); }
      ctx.stroke();
      ctx.restore();
      // confetti
      const ct = t - T_DONE;
      const cols = [task.accent, "#3ddc97", "#b38cff", "#ffd27a", "#ff8a6b", "#6e8bff"];
      for (let i = 0; i < 70; i++) {
        const ang = (i * 137.5) * Math.PI / 180, sp = 380 + (i * 53 % 260);
        const x = cx + Math.cos(ang) * sp * ct, y = cy + Math.sin(ang) * sp * ct * 0.8 + 420 * ct * ct;
        const life = 1 - seg(ct, 0.9, 1.6);
        if (life <= 0) continue;
        ctx.save(); ctx.globalAlpha = life; ctx.translate(x, y); ctx.rotate(ct * (6 + i % 5));
        ctx.fillStyle = cols[i % cols.length];
        if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill(); } else ctx.fillRect(-8, -4, 16, 8);
        ctx.restore();
      }
      // text
      const tx = easeOutExpo(seg(t, T_DONE + 0.25, T_DONE + 0.7));
      ctx.globalAlpha = tx; ctx.textAlign = "center";
      ctx.font = `800 72px ${DISPLAY}`; ctx.fillStyle = "#fff";
      ctx.fillText(task.done, cx, 540 + (1 - tx) * 40);
      const sx2 = easeOutExpo(seg(t, T_DONE + 0.4, T_DONE + 0.85));
      ctx.globalAlpha = sx2;
      ctx.font = `600 28px ${FONT}`; ctx.fillStyle = "#a9f0cf";
      ctx.fillText("3 steps · every step checked · 4.6 s", cx, 612 + (1 - sx2) * 30);
      ctx.restore();
    }

    /* ---- wipe transition between tasks ---- */
    const wipeOut = seg(t, T_WIPE, T_TASK), wipeIn = 1 - seg(t, 0, 0.35);
    const w = t >= T_WIPE ? easeInOut(wipeOut) : t < 0.35 ? -easeInOut(1 - wipeIn) : null;
    if (w !== null) {
      const next = TASKS[(taskIdx + (t >= T_WIPE ? 1 : 0)) % TASKS.length];
      const x0 = t >= T_WIPE ? lerp(-SW * 1.4, 0, w) : lerp(0, SW * 1.4, -w);
      ctx.save(); ctx.globalAlpha = 1;
      const wg = ctx.createLinearGradient(x0, 0, x0 + SW * 1.4, 0);
      wg.addColorStop(0, next.accent); wg.addColorStop(0.5, "#b38cff"); wg.addColorStop(1, next.accent2);
      ctx.fillStyle = wg;
      ctx.beginPath(); ctx.moveTo(x0 - 200, 0); ctx.lineTo(x0 + SW * 1.4, 0); ctx.lineTo(x0 + SW * 1.4 - 200, SH); ctx.lineTo(x0 - 400, SH); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // screen power-on fade
    if (screenOn < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - screenOn})`; ctx.fillRect(0, 0, SW, SH); }
    screenTex.tex.needsUpdate = true;
  }

  /* ---- app contents (inside the app window, local coords) ---- */
  function drawChat(ctx, p, t, time, task) {
    ctx.fillStyle = "#0b141a"; ctx.fillRect(0, 76, AW, AH - 76);
    // contact strip
    ctx.fillStyle = "#25d366"; ctx.beginPath(); ctx.arc(52, 118, 24, 0, 7); ctx.fill();
    ctx.fillStyle = "#06130d"; ctx.font = `800 22px ${FONT}`; ctx.textAlign = "center"; ctx.fillText("M", 52, 120);
    ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = `700 24px ${FONT}`; ctx.fillText("Mum", 88, 110);
    ctx.fillStyle = "#25d366"; ctx.font = `500 17px ${FONT}`; ctx.fillText(p > 0.3 && p < 0.9 ? "typing…" : "online", 88, 134);
    const bubble = (txt, right, y, a, col) => {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= clamp01(a);
      ctx.font = `500 26px ${FONT}`;
      const tw = ctx.measureText(txt).width + 60;
      const x = right ? AW - tw - 28 : 28;
      ctx.translate(right ? x + tw : x, y); ctx.scale(easeOutBack(a), easeOutBack(a)); ctx.translate(right ? -tw : 0, 0);
      rr(ctx, 0, 0, tw, 58, 20); ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillText(txt, 22, 30);
      ctx.restore();
    };
    bubble("Are you calling today?", false, 176, seg(t, 2.05, 2.35), "#202c33");
    bubble("What time? 😊", false, 248, seg(t, 2.3, 2.6), "#202c33");
    // input + typing
    const msg = "I'll call at 7 ❤️";
    const n = Math.round(msg.length * seg(t, 3.3, 3.9));
    rr(ctx, 24, AH - 88, AW - 130, 64, 32); ctx.fillStyle = "#202c33"; ctx.fill();
    ctx.font = `500 26px ${FONT}`; ctx.fillStyle = n && t < T_CLICK ? "#fff" : "#8696a0";
    ctx.fillText(n && t < T_CLICK ? msg.slice(0, n) : "Type a message", 52, AH - 54);
    ctx.fillStyle = "#25d366"; ctx.beginPath(); ctx.arc(AW - 64, AH - 56, 32, 0, 7); ctx.fill();
    ctx.fillStyle = "#06130d"; ctx.beginPath(); ctx.moveTo(AW - 76, AH - 70); ctx.lineTo(AW - 46, AH - 56); ctx.lineTo(AW - 76, AH - 42); ctx.closePath(); ctx.fill();
    // sent bubble after approval
    bubble(msg + "  ✓✓", true, 322, seg(t, T_CLICK + 0.05, T_CLICK + 0.3), "#005c4b");
  }

  function drawMail(ctx, p, t, time, task) {
    ctx.fillStyle = "#14161f"; ctx.fillRect(0, 76, AW, AH - 76);
    const files = ["Invoice-August.pdf", "Invoice-September.pdf", "Invoice-October.pdf"];
    const listA = 1 - seg(t, 2.9, 3.15);
    if (listA > 0) {
      ctx.save(); ctx.globalAlpha *= listA;
      ctx.font = `600 20px ${FONT}`; ctx.fillStyle = "#8d90a8"; ctx.fillText("Documents › Invoices", 30, 118);
      const hy = lerp(150, 150 + 2 * 92, easeInOut(seg(t, 2.05, 2.5)));
      rr(ctx, 18, hy, AW - 36, 80, 20); ctx.fillStyle = "rgba(255,107,107,.18)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,107,107,.7)"; ctx.lineWidth = 2; ctx.stroke();
      files.forEach((f, i) => {
        const y = 150 + i * 92;
        rr(ctx, 40, y + 16, 38, 48, 8); ctx.fillStyle = "#ff6b6b"; ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = `800 12px ${FONT}`; ctx.fillText("PDF", 46, y + 46);
        ctx.font = `600 26px ${FONT}`; ctx.fillStyle = "#fff"; ctx.fillText(f, 100, y + 42);
      });
      ctx.restore();
    }
    const mailA = seg(t, 3.0, 3.3);
    if (mailA > 0) {
      ctx.save(); ctx.globalAlpha *= mailA;
      [["To", "Tunde"], ["Subject", "October invoice"]].forEach(([k, v], i) => {
        const y = 122 + i * 60;
        ctx.font = `500 22px ${FONT}`; ctx.fillStyle = "#8d90a8"; ctx.fillText(k, 30, y);
        ctx.font = `600 26px ${FONT}`; ctx.fillStyle = "#fff"; ctx.fillText(v, 140, y);
        ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fillRect(24, y + 24, AW - 48, 2);
      });
      const body = "Hi Tunde, here's October's invoice. Thanks!";
      const n = Math.round(body.length * seg(t, 3.35, 3.95));
      ctx.font = `500 25px ${FONT}`; ctx.fillStyle = "#dfe1ee"; ctx.fillText(body.slice(0, n), 30, 270);
      ctx.restore();
    }
    // PDF flies into attachment slot
    const fly = seg(t, 2.55, 3.1);
    if (fly > 0) {
      const e = easeInOut(fly);
      const sx = 40, sy = 150 + 2 * 92 + 16, tx = 30, ty = 320;
      const x = lerp(sx, tx, e), y = lerp(sy, ty, e) - Math.sin(e * Math.PI) * 90;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(e * Math.PI) * -0.2);
      rr(ctx, 0, 0, 330, 70, 18); ctx.fillStyle = "rgba(255,107,107,.22)"; ctx.fill();
      ctx.strokeStyle = "#ff6b6b"; ctx.lineWidth = 2; ctx.stroke();
      rr(ctx, 14, 12, 34, 46, 7); ctx.fillStyle = "#ff6b6b"; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = `600 22px ${FONT}`; ctx.fillText("Invoice-October.pdf", 62, 42);
      ctx.restore();
    }
    // send button
    if (mailA > 0) {
      const sent = t > T_CLICK;
      rr(ctx, AW - 200, AH - 86, 172, 62, 31);
      ctx.fillStyle = sent ? "#3ddc97" : "#ff6b6b"; ctx.fill();
      ctx.fillStyle = sent ? "#06130d" : "#fff"; ctx.font = `700 24px ${FONT}`; ctx.textAlign = "center";
      ctx.fillText(sent ? "Sent ✓" : "Send", AW - 114, AH - 52); ctx.textAlign = "left";
    }
  }

  function drawCal(ctx, p, t, time, task) {
    ctx.fillStyle = "#13151f"; ctx.fillRect(0, 76, AW, AH - 76);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const gx = 86, gy = 130, cw = (AW - 110) / 5, rh = 58;
    days.forEach((d, i) => {
      ctx.font = `700 22px ${FONT}`; ctx.textAlign = "center";
      ctx.fillStyle = i === 4 && t > 2.75 ? "#8aa2ff" : "#8d90a8";
      ctx.fillText(d, gx + i * cw + cw / 2, gy - 18);
    });
    ctx.textAlign = "left";
    ["9", "10", "11", "12", "1", "2"].forEach((h, j) => {
      ctx.font = `500 18px ${FONT}`; ctx.fillStyle = "#6c6f86"; ctx.fillText(h, 36, gy + j * rh + 30);
      ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fillRect(gx, gy + j * rh, AW - 110, 2);
    });
    const busy = [[0, 0, 2, "#6e8bff"], [1, 2, 1, "#b38cff"], [2, 0, 1, "#ff8a6b"], [2, 3, 2, "#6e8bff"], [3, 1, 2, "#f3b65c"], [4, 0, 2, "#b38cff"], [4, 3, 1, "#ff8a6b"], [0, 4, 2, "#f3b65c"], [1, 4, 1, "#6e8bff"]];
    busy.forEach(([d, s, l, c], i) => {
      const a = easeOutBack(seg(t, 2.0 + i * 0.03, 2.3 + i * 0.03));
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= clamp01(a);
      rr(ctx, gx + d * cw + 6, gy + s * rh + 6, cw - 12, (l * rh - 12) * a, 12); ctx.fillStyle = c + "55"; ctx.fill();
      ctx.fillStyle = c; ctx.fillRect(gx + d * cw + 6, gy + s * rh + 10, 5, Math.max(0, l * rh - 20) * a);
      ctx.restore();
    });
    // scanner
    const sc = seg(t, 2.25, 2.85);
    if (sc > 0 && sc < 1) {
      const x = gx + (AW - 110) * sc;
      const g = ctx.createLinearGradient(x - 120, 0, x, 0); g.addColorStop(0, "rgba(110,139,255,0)"); g.addColorStop(1, "rgba(138,162,255,.55)");
      ctx.fillStyle = g; ctx.fillRect(x - 120, gy, 120, rh * 6);
      ctx.fillStyle = "#c6d2ff"; ctx.fillRect(x - 2, gy, 4, rh * 6);
    }
    // the free slot Fri 2pm (row 5)
    const sx = gx + 4 * cw + 6, sy = gy + 5 * rh + 6, sw = cw - 12, sh = rh - 12;
    if (t > 2.85) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 9);
      if (t < 3.45) { rr(ctx, sx, sy, sw, sh, 12); ctx.lineWidth = 4; ctx.strokeStyle = `rgba(61,220,151,${0.5 + 0.5 * pulse})`; ctx.stroke(); }
      else {
        const g = easeOutBack(seg(t, 3.45, 3.8));
        const solid = t > T_CLICK;
        ctx.save(); ctx.translate(sx + sw / 2, sy + sh / 2); ctx.scale(g, g);
        rr(ctx, -sw / 2, -sh / 2, sw, sh, 12);
        ctx.fillStyle = solid ? "#3ddc97" : "rgba(61,220,151,.25)"; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = "#3ddc97"; ctx.stroke();
        ctx.fillStyle = solid ? "#06130d" : "#3ddc97"; ctx.font = `800 18px ${FONT}`; ctx.textAlign = "center";
        ctx.fillText("Meet Ada", 0, 2); ctx.textAlign = "left";
        ctx.restore();
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
    new THREE.MeshBasicMaterial({ map: screenTex.tex, toneMapped: false }));
  display.position.set(0, LH / 2 + 0.04, 0.004);
  hinge.add(display);
  // screen glow onto the keyboard
  const glowL = new THREE.PointLight(0x8aa2ff, 6, 5, 2);
  glowL.position.set(0, 1.2, 0.6); hinge.add(glowL);

  hinge.rotation.x = 1.45; // starts closed, opens on arrival

  laptop.position.set(0, -1.35, 0);
  laptop.rotation.set(0.1, -0.26, 0);

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
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, SMALL ? 16 : 24), orbMat);
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
  const DUST = SMALL ? 120 : 200;
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
  let narrow = false, camZ = 9, camY = 0.9, intro = 0;
  const camTarget = new THREE.Vector3();
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    narrow = camera.aspect < 1.05;
    const wantW = narrow ? 5.4 : 10.8;
    const dist = wantW / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    camZ = Math.max(6, Math.min(dist, 24)); camY = narrow ? 1.0 : 0.85;
    camera.position.set(0, camY, camZ);
    camTarget.set(0, narrow ? 0.25 : -0.05, 0); camera.lookAt(camTarget);
    camera.updateProjectionMatrix();

    if (narrow) {
      orbGroup.position.set(0, 3.05, 0); orbGroup.scale.setScalar(0.48);
      panels[0].base.set(-1.75, 2.0, -0.3);
      panels[1].base.set(0, 2.0, -0.3);
      panels[2].base.set(1.75, 2.0, -0.3);
      panels.forEach((p) => p.g.scale.setScalar(0.5));
      laptop.scale.setScalar(0.92); laptop.position.set(0, -1.45, 0);
    } else {
      orbGroup.position.set(4.0, 1.6, -0.8); orbGroup.scale.setScalar(0.85);
      panels[0].base.set(-4.15, 1.2, -1.3);
      panels[1].base.set(4.35, -0.95, -1.1);
      panels[2].base.set(-4.0, -1.25, -0.5);
      panels.forEach((p) => p.g.scale.setScalar(0.88));
      laptop.scale.setScalar(1.16); laptop.position.set(0, -1.45, 0);
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
  let elapsed = 0, lastTask = -1, frameNo = 0, avg = 0.016, screenEvery = 2;
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
  const caption = document.getElementById("stageCaption");

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.25);
    if (!visible || !running) return;
    elapsed += reduceMotion ? 0 : dt;
    frameNo++;
    // adaptive quality: if the device struggles, render fewer pixels
    if (frameNo > 30 && frameNo < 400) {
      avg = avg * 0.92 + dt * 0.08;
      if (frameNo % 60 === 0 && avg > 0.024 && pixelRatio > 1) {
        pixelRatio = Math.max(1, pixelRatio - 0.3); renderer.setPixelRatio(pixelRatio); layout();
      }
      if (frameNo % 60 === 0 && avg > 0.03) screenEvery = 3;
    }
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

    if (frameNo % screenEvery === 0 || FORCED != null) drawScreen(time, taskIdx, t);

    // parallax + idle sway
    cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
    root.rotation.y = cur.x * 0.16 + Math.sin(time * 0.25) * 0.05;
    root.rotation.x = cur.y * 0.06;

    laptop.position.y = (narrow ? -1.45 : -1.45) + Math.sin(time * 0.8) * 0.04;
    // lid opens + screen powers on when the visitor arrives
    intro = reduceMotion || FORCED != null ? 1 : Math.min(1, intro + dt / 1.4);
    const lid = easeOutBack(seg(intro, 0, 0.75));
    hinge.rotation.x = lerp(1.45, -0.24, lid);
    screenOn = seg(intro, 0.5, 0.95);
    // slow cinematic camera drift
    camera.position.x = Math.sin(time * 0.22) * (narrow ? 0.15 : 0.45);
    camera.position.y = camY + Math.sin(time * 0.17) * 0.12;
    camera.lookAt(camTarget);

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
