const header = document.getElementById("topbar");
const toggle = document.getElementById("burger");

function showMenu(open) {
  header.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
}

toggle.addEventListener("click", () => showMenu(!header.classList.contains("open")));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && header.classList.contains("open")) {
    showMenu(false);
    toggle.focus();
  }
});
document.documentElement.classList.add("menu-ready");
