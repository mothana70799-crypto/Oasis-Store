import { createUser, getSession, initDB, loginUser } from "./db.js";

initDB();

const state = {
  activeTab: "login",
};

const ui = {
  authCard: document.querySelector("#authCard"),
  tabs: document.querySelectorAll(".auth-tab"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  toast: document.querySelector("#toast"),
};

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");
  setTimeout(() => ui.toast.classList.remove("show"), 2300);
}

function switchTab(tab) {
  state.activeTab = tab;
  ui.tabs.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  ui.loginForm.classList.toggle("hidden", tab !== "login");
  ui.registerForm.classList.toggle("hidden", tab !== "register");
}

function setupCardInteraction() {
  if (window.matchMedia("(max-width: 900px), (hover: none)").matches) {
    return;
  }

  ui.authCard.addEventListener("mousemove", (event) => {
    const rect = ui.authCard.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const rx = ((y / rect.height) * 2 - 1) * 3;
    const ry = ((x / rect.width) * 2 - 1) * -4;

    ui.authCard.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  ui.authCard.addEventListener("mouseleave", () => {
    ui.authCard.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  });
}

function initEvents() {
  ui.tabs.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  ui.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(ui.loginForm);

    try {
      loginUser(String(data.get("email")), String(data.get("password")));
      toast("تم تسجيل الدخول بنجاح");
      setTimeout(() => (location.href = "./index.html"), 600);
    } catch (error) {
      toast(error.message);
    }
  });

  ui.registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(ui.registerForm);

    try {
      createUser({
        name: String(data.get("name")),
        email: String(data.get("email")),
        password: String(data.get("password")),
      });
      loginUser(String(data.get("email")), String(data.get("password")));
      toast("تم إنشاء الحساب وتسجيل الدخول");
      setTimeout(() => (location.href = "./index.html"), 700);
    } catch (error) {
      toast(error.message);
    }
  });
}

function redirectIfLoggedIn() {
  const session = getSession();
  if (session) {
    toast(`أهلًا ${session.name}`);
  }
}

setupCardInteraction();
initEvents();
redirectIfLoggedIn();
