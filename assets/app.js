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

  /* ---------- услуги: витрина — свайп на телефоне и наклон за мышью ---------- */
  const shop = $("#shop");
  if (shop) {
    const radios = [...shop.querySelectorAll(".sv")];
    const go = step => {
      const i = radios.findIndex(r => r.checked);
      radios[(i + step + radios.length) % radios.length].checked = true;
    };
    let sx = 0, sy = 0;
    shop.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    shop.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    }, { passive: true });
    if (fine && !reduce && !small) {
      let r = 0, x = 0, y = 0;
      shop.addEventListener("pointermove", e => {
        x = e.clientX; y = e.clientY;
        if (r) return;
        r = requestAnimationFrame(() => {
          r = 0;
          const b = shop.getBoundingClientRect();
          shop.style.setProperty("--tx", (((x - b.left) / b.width - .5) * 16).toFixed(1));
          shop.style.setProperty("--ty", (((y - b.top) / b.height - .5) * -10).toFixed(1));
        });
      }, { passive: true });
    }
  }

  /* ---------- услуги: демо бота записи ----------
     Повторяет сценарий и тексты barber-booking-bot. Все считается в браузере, наружу ничего не уходит. */
  const chat = $("#chat");
  if (chat) {
    const log = $("#chatLog"), kb = $("#chatKb"), form = $("#chatForm"), inp = $("#chatInput");
    const NAME = "BarberShop «Борода»", ADDR = "г. Москва, ул. Примерная, 1", PHONE = "+7 (900) 000-00-00";
    const SERVICES = [["Мужская стрижка", 1500, 60], ["Стрижка бороды", 900, 30], ["Стрижка + борода", 2200, 90], ["Детская стрижка", 1000, 30]]
      .map(([title, price, dur]) => ({ title, price, dur }));
    const WORK_DAYS = [0, 1, 2, 3, 4, 5], OPEN = 10, CLOSE = 20, STEP = 30, AHEAD = 7, MIN = 6e4;
    const WD = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
    const MON = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    const MENU = ["📅 Записаться", "🗂 Мои записи", "💈 Услуги и цены", "📍 Контакты"];
    const DEMO_PHONE = "+7 900 123-45-67";
    const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const wd = t => (t.getDay() + 6) % 7;                                   // 0 = понедельник, как в Python
    const two = n => String(n).padStart(2, "0");
    const fmtDate = t => `${WD[wd(t)]}, ${t.getDate()} ${MON[t.getMonth()]}`;
    const hm = t => two(t.getHours()) + ":" + two(t.getMinutes());
    const fmtDt = t => `${fmtDate(t)} в ${hm(t)}`;
    const at = (day, h, m) => { const t = new Date(day); t.setHours(h, m, 0, 0); return t; };

    const bookings = [];
    let nextId = 1, st = {}, step = "", flow = null;

    /* --- расчет свободных окон: та же логика, что в slots.py --- */
    const workingDates = () => {
      const out = [], today = at(new Date(), 0, 0);
      for (let i = 0; i < AHEAD; i++) {
        const t = new Date(today); t.setDate(today.getDate() + i);
        if (WORK_DAYS.includes(wd(t))) out.push(t);
      }
      return out;
    };
    const busy = day => {                                                  // для демо часть окон занята «другими клиентами»
      const k = day.getDate() % 3;
      const other = [[at(day, 11 + k, 0), 60], [at(day, 15, k % 2 * 30), 90]].map(([t, dur]) => [+t, +t + dur * MIN]);
      return other.concat(bookings.filter(b => !b.off).map(b => [b.start, b.start + b.dur * MIN]));
    };
    const freeSlots = (day, dur) => {
      const res = [], iv = busy(day), now = Date.now(), close = +at(day, CLOSE, 0);
      for (let s = +at(day, OPEN, 0); s + dur * MIN <= close; s += STEP * MIN) {
        const e = s + dur * MIN;
        if (s > now && iv.every(([bs, be]) => !(s < be && bs < e))) res.push(new Date(s));
      }
      return res;
    };

    /* --- интерфейс чата --- */
    const down = () => { log.scrollTop = log.scrollHeight; };
    const button = ([text, fn, wide]) => {
      const b = d.createElement("button");
      b.type = "button"; b.textContent = text; if (wide) b.className = "wide";
      b.addEventListener("click", fn);
      return b;
    };
    const add = (html, me) => {
      const m = d.createElement("div");
      m.className = me ? "msg me" : "msg"; m.innerHTML = html;
      log.appendChild(m); down();
      return m;
    };
    const say = html => add(html);
    const ikb = (m, cols, btns) => {                                       // inline-кнопки под сообщением
      let k = m.nextElementSibling;
      if (!k || !k.classList.contains("ikb")) { k = d.createElement("div"); k.className = "ikb"; m.after(k); }
      k.textContent = ""; k.hidden = !btns.length; k.style.setProperty("--c", cols);
      btns.forEach(b => k.appendChild(button(b)));
      down();
    };
    const edit = (m, html, cols, btns) => { m.innerHTML = html; ikb(m, cols || 1, btns || []); };
    const setKb = btns => { kb.textContent = ""; btns.forEach(b => kb.appendChild(button(b))); down(); };
    const menuKb = () => setKb(MENU.map((t, i) => [t, () => user(t), i === 0 || i === 3]));
    const user = text => { add(esc(text), true); handle(text); };

    /* --- сценарий --- */
    const start = () => {
      step = ""; st = {};
      say(`Привет! 👋\nЯ бот записи в <b>${NAME}</b>.\n\nЗапишитесь в пару нажатий, а я напомню о визите заранее.`);
      menuKb();
    };
    const showServices = m => edit(m, "Выберите услугу:", 1, SERVICES.map(s => [`${s.title} — ${s.price} ₽`, () => { st = { s }; showDates(m); }]));
    const showDates = m => {
      const s = st.s, dates = workingDates().filter(t => freeSlots(t, s.dur).length);
      if (!dates.length) return edit(m, "😔 На ближайшие дни свободных окон нет. Попробуйте позже или позвоните нам: " + PHONE);
      edit(m, `<b>${s.title}</b> — ${s.price} ₽\n\nВыберите день:`, 2,
        dates.map(t => [fmtDate(t), () => showTimes(m, t)]).concat([["⬅️ Назад", () => showServices(m), true]]));
    };
    const showTimes = (m, day) => {
      const s = st.s;
      edit(m, `<b>${s.title}</b>, ${fmtDate(day)}\n\nВыберите время:`, 4,
        freeSlots(day, s.dur).map(t => [hm(t), () => pickTime(m, t)]).concat([["⬅️ Назад", () => showDates(m), true]]));
    };
    const pickTime = (m, t) => {
      st.start = +t; step = "name";
      edit(m, `<b>${st.s.title}</b>, ${fmtDt(t)}`);
      say("Как вас зовут?"); setKb([]);
      inp.placeholder = "Введите имя"; inp.focus({ preventScroll: true });
    };
    const confirm = (m, yes) => {
      if (step !== "confirm") return;
      const s = st.s, t = new Date(st.start);
      step = "";
      if (!yes) edit(m, "Запись отменена.");
      else if (!freeSlots(at(t, 0, 0), s.dur).some(x => +x === st.start)) edit(m, "😔 Увы, это время только что заняли. Начните запись заново.");
      else {
        const id = nextId++;
        bookings.push({ id, s, start: st.start, dur: s.dur });
        edit(m, `✅ <b>Вы записаны!</b> (запись #${id})\n\n💈 ${s.title}\n🗓 ${fmtDt(t)}\n📍 ${ADDR}\n\nНапомню о визите заранее. Отменить можно в разделе «🗂 Мои записи».`);
      }
      say("Главное меню:"); menuKb();
    };
    const renderList = m => {
      const items = bookings.filter(b => !b.off && b.start > Date.now()).sort((a, b) => a.start - b.start);
      if (!items.length) return edit(m, "У вас нет предстоящих записей. Нажмите «📅 Записаться» 🙂");
      edit(m, "<b>Ваши записи:</b>\n\n" + items.map(b => `#${b.id} · ${fmtDt(new Date(b.start))} · ${b.s.title}`).join("\n"), 2,
        items.map(b => [`❌ Отменить #${b.id}`, () => { b.off = true; renderList(m); }]));
    };
    const handle = text => {
      if (text === "/start") return start();
      if (text === MENU[0] || text === "/book") {
        if (flow) ikb(flow, 1, []);                                        // старые кнопки больше не действуют
        step = ""; st = {}; inp.placeholder = "Сообщение";
        return showServices(flow = say(""));
      }
      if (text === MENU[2]) return say("💈 <b>Услуги и цены</b>\n\n" + SERVICES.map(s => `• ${s.title} — <b>${s.price} ₽</b> (${s.dur} мин)`).join("\n"));
      if (text === MENU[3]) return say(`📍 <b>${NAME}</b>\nАдрес: ${ADDR}\nТелефон: ${PHONE}\nРаботаем: ${OPEN}:00–${CLOSE}:00`);
      if (step === "name") {
        const name = text.trim();
        if (name.length < 2 || name.length > 50) return say("Введите имя длиной от 2 до 50 символов.");
        st.name = name; step = "phone"; inp.placeholder = "Номер телефона";
        say("Оставьте номер телефона: нажмите кнопку ниже или введите вручную.");
        return setKb([["📱 Отправить мой номер", () => user(DEMO_PHONE), true]]);
      }
      if (step === "phone") {
        const raw = text.trim(), digits = raw.replace(/\D/g, "");
        if (digits.length < 10 || digits.length > 15) return say("Похоже, номер некорректный. Пример: " + DEMO_PHONE);
        st.phone = raw.startsWith("+") ? raw : "+" + digits;
        step = "confirm"; inp.placeholder = "Сообщение"; setKb([]);
        say("Номер сохранён ✅");
        const s = st.s;
        flow = say(`<b>Проверьте запись:</b>\n\n💈 ${s.title} — ${s.price} ₽\n🗓 ${fmtDt(new Date(st.start))}\n👤 ${esc(st.name)}\n📞 ${esc(st.phone)}`);
        return ikb(flow, 2, [["✅ Подтвердить", () => confirm(flow, true)], ["✖️ Отмена", () => confirm(flow, false)]]);
      }
      if (text === MENU[1]) return renderList(say(""));
      say("Не понял вас 🙂 Воспользуйтесь меню ниже."); menuKb();
    };
    form.addEventListener("submit", e => {
      e.preventDefault();
      const text = inp.value.trim();
      if (!text) return;
      inp.value = ""; user(text);
    });
    log.textContent = ""; start();
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

  /* ---------- отзывы: список из assets/reviews.json ---------- */
  const revs = $("#revs");
  if (revs) {
    fetch("assets/reviews.json").then(r => r.ok ? r.json() : []).then(list => {
      if (!Array.isArray(list) || !list.length) return;
      revs.textContent = "";
      for (const r of list) {
        const n = Math.max(1, Math.min(5, Math.round(+r.rating) || 5));
        const fig = d.createElement("figure"), stars = d.createElement("div"), off = d.createElement("i");
        const text = d.createElement("blockquote"), cap = d.createElement("figcaption"), name = d.createElement("b");
        fig.className = "rev"; stars.className = "rev-stars"; cap.className = "label";
        stars.setAttribute("aria-label", `Оценка ${n} из 5`);
        stars.textContent = "★".repeat(n); off.textContent = "★".repeat(5 - n); stars.appendChild(off);
        text.textContent = String(r.text || "");
        name.textContent = String(r.name || "Без имени");
        cap.append(name, [r.service, r.date].filter(Boolean).map(x => " · " + x).join(""));
        fig.append(stars, text, cap); revs.appendChild(fig);
      }
    }).catch(() => {});
  }

  /* ---------- отзывы: форма собирает сообщение и открывает Telegram ---------- */
  const revForm = $("#revForm");
  if (revForm) {
    const name = $("#revName"), service = $("#revService"), text = $("#revText"), count = $("#revCount"), note = $("#toast");
    let nt;
    text.addEventListener("input", () => { count.textContent = text.value.length + " / " + text.maxLength; });
    revForm.addEventListener("submit", async e => {
      e.preventDefault();
      const rating = revForm.querySelector("[name=rating]:checked").value;
      const msg = `Отзыв с сайта\n\nИмя: ${name.value.trim()}\nУслуга: ${service.value}\nОценка: ${rating} из 5\n\n${text.value.trim()}`;
      open(revForm.action + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
      let copied = false;
      try { await navigator.clipboard.writeText(msg); copied = true; } catch (err) {}
      note.textContent = copied ? "Открываю Telegram. Текст отзыва также скопирован." : "Открываю Telegram с готовым сообщением.";
      note.classList.add("on");
      clearTimeout(nt); nt = setTimeout(() => note.classList.remove("on"), 4000);
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
