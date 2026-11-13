/* ARTEM — общий скрипт. Каждый блок включается только если на странице есть его элемент. */
(() => {
  "use strict";
  const d = document, root = d.documentElement;
  const $ = s => d.querySelector(s), $$ = s => d.querySelectorAll(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const small = innerWidth < 860;

  /* Запускает enter, когда элемент на экране и вкладка активна; leave — когда нет. */
  function onView(el, enter, leave) {
    let on = false, vis = false;
    const upd = () => {
      const v = vis && !d.hidden;
      if (v === on) return;
      on = v;
      if (v) enter(); else if (leave) leave();
    };
    new IntersectionObserver(es => { vis = es[es.length - 1].isIntersecting; upd(); }).observe(el);
    d.addEventListener("visibilitychange", upd);
  }

  /* ---------- меню на телефоне ---------- */
  const top = $("#topbar"), burger = $("#burger");
  if (burger) {
    const set = o => { top.classList.toggle("open", o); burger.setAttribute("aria-expanded", o); };
    burger.addEventListener("click", () => set(!top.classList.contains("open")));
    d.addEventListener("keydown", e => {
      if (e.key === "Escape" && top.classList.contains("open")) { set(false); burger.focus(); }
    });
  }

  /* ---------- появление блоков при прокрутке ---------- */
  const io = new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { threshold: .12, rootMargin: "0px 0px -30px 0px" });
  $$(".rv").forEach(el => io.observe(el));

  /* ---------- анимации не работают, пока блок за экраном ---------- */
  $$("[data-live]").forEach(el => onView(el, () => el.classList.remove("off"), () => el.classList.add("off")));

  /* ---------- главная: счетчики ---------- */
  const nums = $$("[data-count]");
  if (nums.length && !reduce) {
    nums.forEach(c => { c.textContent = "0"; });
    setTimeout(() => {
      const t0 = performance.now();
      const run = t => {
        const p = Math.min(1, (t - t0) / 1200), k = 1 - Math.pow(1 - p, 3);
        nums.forEach(c => { c.textContent = Math.round(c.dataset.count * k); });
        if (p < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    }, root.classList.contains("intro") ? 1400 : 300);
  }

  /* ---------- главная: звезды на canvas ---------- */
  const cv = $("#stars");
  if (cv && !reduce) {
    const ctx = cv.getContext("2d");
    const N = small ? 80 : 200, gap = small ? 40 : 30;   // телефон: меньше звезд и реже кадры
    let W = 0, H = 0, P = [], raf = 0, last = 0, mx = 0, my = 0;
    const size = () => {
      const dpr = small ? 1 : Math.min(devicePixelRatio || 1, 1.5);
      W = cv.clientWidth; H = cv.clientHeight;
      if (!W) return;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#fff";
      P = Array.from({ length: N }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * .9 + .1, t: Math.random() * 6.28 }));
    };
    const frame = t => {
      raf = requestAnimationFrame(frame);
      if (t - last < gap) return;
      last = t;
      ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y -= p.z * .35; p.t += .05;
        if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
        ctx.globalAlpha = (.3 + .7 * Math.abs(Math.sin(p.t))) * p.z;
        const s = p.z * 2.2;
        ctx.fillRect(p.x - mx * p.z * .02, p.y - my * p.z * .02, s, s);
      }
    };
    if (fine) addEventListener("pointermove", e => { mx = e.clientX - W / 2; my = e.clientY - H / 2; }, { passive: true });
    onView(cv, () => { if (!W) size(); raf = requestAnimationFrame(frame); }, () => cancelAnimationFrame(raf));
    let lw = innerWidth, rt;
    addEventListener("resize", () => {
      if (innerWidth === lw) return;            // на телефоне высота скачет из-за адресной строки — игнорируем
      lw = innerWidth; clearTimeout(rt); rt = setTimeout(size, 200);
    });
  }

  /* ---------- главная: параллакс хакера (только мышь, только десктоп) ---------- */
  const hk = $(".hacker");
  if (hk && fine && !reduce && !small) {
    let r = 0, x = 0, y = 0;
    addEventListener("pointermove", e => {
      x = e.clientX; y = e.clientY;
      if (r) return;
      r = requestAnimationFrame(() => {
        r = 0;
        hk.style.transform = `translate(${(x / innerWidth - .5) * -20}px,${(y / innerHeight - .5) * -10}px)`;
      });
    }, { passive: true });
  }

  /* ---------- лаборатория: глаз ---------- */
  const stage = $("#eyeStage");
  if (stage) {
    const iris = $("#iris");
    let tx = 0, ty = 0, cx = 0, cy = 0, px = 0, py = 0, tick = false, dirty = false, active = false, blinkT = 0;
    const move = () => {
      if (dirty) {
        dirty = false;
        const r = stage.getBoundingClientRect();
        const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy) || 1, m = Math.min(1, dist / 400);
        tx = dx / dist * m * 20; ty = dy / dist * m * 20;
      }
      cx += (tx - cx) * .25; cy += (ty - cy) * .25;
      iris.style.transform = `translate(${cx}%,${cy}%)`;
      if (Math.abs(tx - cx) > .1 || Math.abs(ty - cy) > .1) requestAnimationFrame(move); else tick = false;
    };
    if (!fine || reduce) iris.classList.add("auto");
    else addEventListener("pointermove", e => {
      if (!active) return;
      px = e.clientX; py = e.clientY; dirty = true;
      if (!tick) { tick = true; requestAnimationFrame(move); }
    }, { passive: true });
    const hit = () => {
      stage.classList.remove("pulse"); void stage.offsetWidth; stage.classList.add("pulse");
      setTimeout(() => stage.classList.remove("pulse"), 900);
    };
    stage.addEventListener("click", hit);
    stage.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hit(); } });
    onView(stage, () => {
      active = true;
      if (!reduce) blinkT = setInterval(() => {
        stage.classList.add("blink"); setTimeout(() => stage.classList.remove("blink"), 240);
      }, 4200);
    }, () => { active = false; clearInterval(blinkT); });
  }

  /* ---------- лаборатория: терминал печатает текст, который уже есть в HTML ---------- */
  const term = $("#term");
  if (term && !reduce) {
    const lines = [...term.children].map(r => [r.className === "p", r.textContent]);
    const cur = term.querySelector(".cur");
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let done = false;
    onView(term, async () => {
      if (done) return;
      done = true;
      term.style.minHeight = term.offsetHeight + "px";   // чтобы страница не прыгала, пока текст печатается
      term.textContent = "";
      for (const [p, t] of lines) {
        const row = d.createElement("div");
        if (p) row.className = "p";
        term.appendChild(row);
        for (let i = 1; i <= t.length; i++) { row.textContent = t.slice(0, i); await sleep(p ? 50 : 14); }
        await sleep(180);
      }
      if (cur) term.lastChild.appendChild(cur);
    });
  }

  /* ---------- контакты: копирование ника ---------- */
  const copy = $("#copy"), toast = $("#toast");
  if (copy && toast) {
    let tt;
    copy.addEventListener("click", async () => {
      const nick = copy.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(nick); ok = true; } catch (e) {}
      toast.textContent = ok ? "Скопировано: " + nick : "Не вышло скопировать — ник " + nick;
      toast.classList.add("on");
      clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("on"), 1800);
    });
  }
})();
