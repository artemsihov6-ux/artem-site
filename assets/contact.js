(() => {
  "use strict";
  const d = document;
  const $ = selector => d.querySelector(selector);
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
