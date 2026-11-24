(() => {
  "use strict";
  const d = document;
  const $ = selector => d.querySelector(selector);
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
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

  /* ---------- лаборатория: игра «Поймай пиксель» ---------- */
  const field = $("#gField");
  if (field) {
    const px = $("#gPx"), msg = $("#gMsg"), start = $("#gStart"), text = msg.querySelector("p");
    const elT = $("#gTime"), elS = $("#gScore"), elB = $("#gBest");
    const DUR = 15000, KEY = "artem-px-best";
    let score = 0, best = 0, end = 0, raf = 0, on = false;
    try { best = +localStorage.getItem(KEY) || 0; } catch (e) {}
    elB.textContent = best;
    const place = () => {
      const size = Math.max(22, 56 - score * 2);                       // чем больше счет, тем меньше пиксель
      px.style.width = px.style.height = size + "px";
      px.style.transform = `translate(${Math.random() * (field.clientWidth - size)}px,${Math.random() * (field.clientHeight - size)}px)`;
    };
    const stop = () => {
      on = false; px.hidden = true; elT.textContent = "0.0";
      const rec = score > best;
      if (rec) { best = score; elB.textContent = best; try { localStorage.setItem(KEY, best); } catch (e) {} }
      text.textContent = rec ? `Новый рекорд: ${score}. Попробуй побить.` : `Результат: ${score}. Рекорд: ${best}.`;
      start.textContent = "Еще раз"; msg.hidden = false; start.focus({ preventScroll: true });
    };
    const tick = () => {
      const left = end - performance.now();
      if (left <= 0) return stop();
      elT.textContent = (left / 1000).toFixed(1);
      raf = requestAnimationFrame(tick);
    };
    const hit = () => {
      if (!on) return;
      elS.textContent = ++score; place();
      field.classList.remove("hit"); void field.offsetWidth; field.classList.add("hit");
    };
    start.addEventListener("click", () => {
      score = 0; elS.textContent = "0"; msg.hidden = true; px.hidden = false; on = true;
      place(); end = performance.now() + DUR; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    });
    px.addEventListener("pointerdown", e => { e.preventDefault(); hit(); });
    px.addEventListener("click", e => { if (e.detail === 0) hit(); });   // Enter и пробел с клавиатуры
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


  const motionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle("off", !entry.isIntersecting);
  });
  document.querySelectorAll("[data-live]").forEach(el => motionObserver.observe(el));
})();
