(() => {
  "use strict";
  const d = document;
  const $ = selector => d.querySelector(selector);
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const small = innerWidth < 860;
  /* ---------- услуги: витрина — свайп на телефоне и наклон за мышью ---------- */
  const shop = $("#shop");
  if (shop) {
    const radios = [...shop.querySelectorAll(".sv")];
    const format = new URLSearchParams(location.search).get("format");
    const requestedSlide = new Map([["site", "sv1"], ["landing", "sv2"], ["bot", "sv3"]]).get(format);
    if (requestedSlide) document.getElementById(requestedSlide).checked = true;

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


  const motionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle("off", !entry.isIntersecting);
  });
  document.querySelectorAll("[data-live]").forEach(el => motionObserver.observe(el));
})();
