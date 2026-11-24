(() => {
  "use strict";
  const d = document;
  const $ = selector => d.querySelector(selector);
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

})();
