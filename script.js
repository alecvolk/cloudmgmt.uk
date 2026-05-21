const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("[data-nav-links]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const samePageScrollLinks = document.querySelectorAll("[data-scroll-target]");
const crossPageScrollLinks = document.querySelectorAll("[data-route-scroll]");
const revealBlocks = document.querySelectorAll("[data-reveal]");
const revealItems = document.querySelectorAll("[data-reveal-item]");
let authRoots = document.querySelectorAll("[data-auth-root]");
const scrollOffset = 96;
const pendingScrollKey = "cloudmgmt-scroll-target";
const supabaseConfig = window.CLOUDMGMT_SUPABASE || {
  url: "https://zzsnnbpzncnhdsludhet.supabase.co",
  anonKey: "sb_publishable_lIlj5ER0FDbkPoa2vWVP4w_L2CqnMoY",
};
let scrollGridFrame = 0;
let authMode = "login";
let supabaseClient = null;

function closeNavMenu() {
  if (!navToggle || !navLinks) {
    return;
  }

  navLinks.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
}

function scrollToTarget(targetId) {
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  const targetTop = target.getBoundingClientRect().top + window.scrollY - scrollOffset;

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });
}

function clearHashFromAddress() {
  if (!window.location.hash) {
    return;
  }

  window.history.replaceState({}, "", window.location.pathname + window.location.search);
}

function resetScrollGrid() {
  const rootStyle = document.documentElement.style;

  rootStyle.setProperty("--grid-scroll-x", "0px");
  rootStyle.setProperty("--grid-scroll-y", "0px");
  rootStyle.setProperty("--hero-grid-scroll-x", "0px");
  rootStyle.setProperty("--hero-grid-scroll-y", "0px");
  rootStyle.setProperty("--grid-opacity", "0.72");
  rootStyle.setProperty("--hero-grid-opacity", "0.9");
}

function updateScrollGrid() {
  scrollGridFrame = 0;

  if (reduceMotion.matches) {
    resetScrollGrid();
    return;
  }

  const scrollY = window.scrollY;
  const rootStyle = document.documentElement.style;
  const gridX = Math.round(scrollY * -0.018);
  const gridY = Math.round(scrollY * 0.052);
  const heroX = Math.round(scrollY * 0.034);
  const heroY = Math.round(scrollY * -0.024);
  const opacityShift = Math.min(0.12, scrollY / 9000);

  rootStyle.setProperty("--grid-scroll-x", `${gridX}px`);
  rootStyle.setProperty("--grid-scroll-y", `${gridY}px`);
  rootStyle.setProperty("--hero-grid-scroll-x", `${heroX}px`);
  rootStyle.setProperty("--hero-grid-scroll-y", `${heroY}px`);
  rootStyle.setProperty("--grid-opacity", String(0.72 - opacityShift));
  rootStyle.setProperty("--hero-grid-opacity", String(0.9 - opacityShift));
}

function requestScrollGridUpdate() {
  if (scrollGridFrame) {
    return;
  }

  scrollGridFrame = window.requestAnimationFrame(updateScrollGrid);
}

function handlePendingScroll() {
  const pendingTarget = window.sessionStorage.getItem(pendingScrollKey);
  const hashTarget = window.location.hash ? window.location.hash.slice(1) : "";
  const targetId = pendingTarget || hashTarget;

  if (!targetId) {
    return;
  }

  window.sessionStorage.removeItem(pendingScrollKey);

  window.requestAnimationFrame(() => {
    scrollToTarget(targetId);
    clearHashFromAddress();
  });
}

function normalizeHeaderNav() {
  document.querySelectorAll("[data-nav-links]").forEach((links) => {
    links.querySelectorAll("[data-scroll-target], [data-route-scroll]").forEach((link) => {
      link.remove();
    });

    links.querySelectorAll("a").forEach((link) => {
      if (link.textContent.trim() === "Applications Closed") {
        link.remove();
      }
    });

    let caseStudyLink = links.querySelector('a[href="/case-study/"]');

    if (!caseStudyLink) {
      caseStudyLink = document.createElement("a");
      caseStudyLink.href = "/case-study/";
      caseStudyLink.textContent = "Case Study";
    }

    let applyLink = links.querySelector('a[href="/application"], a[href="/application/"]');

    if (!applyLink) {
      applyLink = document.createElement("a");
      applyLink.className = "button button-small";
    }

    applyLink.href = "/application";
    applyLink.textContent = "Apply Now";
    applyLink.classList.add("button", "button-small");

    links.prepend(caseStudyLink);
    caseStudyLink.insertAdjacentElement("afterend", applyLink);
  });
}

function ensureAuthAssetsAndMarkup() {
  if (!document.querySelector('link[href$="auth-grid.css"]')) {
    const authStyles = document.createElement("link");
    authStyles.rel = "stylesheet";
    authStyles.href = "/auth-grid.css";
    document.head.appendChild(authStyles);
  }

  if (!window.CLOUDMGMT_SUPABASE) {
    window.CLOUDMGMT_SUPABASE = supabaseConfig;
  }

  if (!window.supabase && !document.querySelector('script[src*="supabase-js"]')) {
    const supabaseScript = document.createElement("script");
    supabaseScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    supabaseScript.defer = true;
    document.head.appendChild(supabaseScript);
  }

  document.querySelectorAll("[data-nav-links]").forEach((links) => {
    if (links.querySelector("[data-auth-root]")) {
      return;
    }

    links.insertAdjacentHTML(
      "beforeend",
      `
          <div class="auth-shell" data-auth-root>
            <div class="auth-actions" data-auth-logged-out>
              <button class="auth-link" type="button" data-auth-open="login">Log in</button>
              <button class="auth-button" type="button" data-auth-open="signup">Sign up</button>
            </div>
            <div class="auth-user" data-auth-logged-in hidden>
              <button class="auth-button auth-button-muted" type="button" disabled>Logged In</button>
            </div>
            <div class="auth-panel" data-auth-panel hidden>
              <div class="auth-panel-header">
                <div>
                  <p class="auth-kicker" data-auth-kicker>Log in</p>
                  <strong data-auth-title>Access your account</strong>
                </div>
                <button class="auth-close" type="button" aria-label="Close login form" data-auth-close></button>
              </div>
              <div class="auth-mode-toggle" role="group" aria-label="Authentication mode">
                <button type="button" data-auth-mode-button="login">Log in</button>
                <button type="button" data-auth-mode-button="signup">Sign up</button>
              </div>
              <form class="auth-form" data-auth-form>
                <label>
                  <span>Email</span>
                  <input type="email" name="email" autocomplete="email" required />
                </label>
                <label>
                  <span>Password</span>
                  <input type="password" name="password" autocomplete="current-password" minlength="6" required />
                </label>
                <button class="button" type="submit" data-auth-submit>Log in</button>
              </form>
              <p class="auth-message" data-auth-message role="status"></p>
            </div>
          </div>
      `
    );
  });

  authRoots = document.querySelectorAll("[data-auth-root]");

  authRoots.forEach((root) => {
    const loggedIn = root.querySelector("[data-auth-logged-in]");

    if (loggedIn) {
      loggedIn.innerHTML = '<button class="auth-button auth-button-muted" type="button" disabled>Logged In</button>';
    }
  });
}

function hasSupabaseConfig() {
  return (
    typeof supabaseConfig.url === "string" &&
    typeof supabaseConfig.anonKey === "string" &&
    supabaseConfig.url.startsWith("https://") &&
    !supabaseConfig.url.includes("YOUR_PROJECT_REF") &&
    !supabaseConfig.anonKey.includes("YOUR_SUPABASE_ANON_KEY")
  );
}

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!hasSupabaseConfig() || !window.supabase) {
    return null;
  }

  supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
  return supabaseClient;
}

function setAuthMessage(root, message, status = "") {
  const messageEl = root.querySelector("[data-auth-message]");

  if (!messageEl) {
    return;
  }

  messageEl.textContent = message;
  messageEl.classList.toggle("is-error", status === "error");
  messageEl.classList.toggle("is-success", status === "success");
}

function updateAuthMode(root, nextMode) {
  authMode = nextMode;

  const isSignup = authMode === "signup";
  const title = root.querySelector("[data-auth-title]");
  const kicker = root.querySelector("[data-auth-kicker]");
  const submit = root.querySelector("[data-auth-submit]");
  const password = root.querySelector('input[name="password"]');

  if (title) {
    title.textContent = isSignup ? "Create an account" : "Access your account";
  }

  if (kicker) {
    kicker.textContent = isSignup ? "Sign up" : "Log in";
  }

  if (submit) {
    submit.textContent = isSignup ? "Sign up" : "Log in";
  }

  if (password) {
    password.autocomplete = isSignup ? "new-password" : "current-password";
  }

  root.querySelectorAll("[data-auth-mode-button]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.authModeButton === authMode);
  });

  setAuthMessage(root, "");
}

function openAuthPanel(root, nextMode = "login") {
  const panel = root.querySelector("[data-auth-panel]");

  updateAuthMode(root, nextMode);

  if (panel) {
    panel.hidden = false;
  }

  if (!hasSupabaseConfig()) {
    setAuthMessage(
      root,
      "Supabase is wired in. Add the project URL and anon key in the page config to enable live accounts.",
      "error"
    );
  }
}

function closeAuthPanel(root) {
  const panel = root.querySelector("[data-auth-panel]");

  if (panel) {
    panel.hidden = true;
  }
}

function renderAuthState(session) {
  const email = session?.user?.email || "";

  authRoots.forEach((root) => {
    const loggedOut = root.querySelector("[data-auth-logged-out]");
    const loggedIn = root.querySelector("[data-auth-logged-in]");

    if (loggedOut) {
      loggedOut.hidden = Boolean(email);
    }

    if (loggedIn) {
      loggedIn.hidden = !email;
    }

    if (email) {
      closeAuthPanel(root);
    }
  });
}

async function handleAuthSubmit(root, event) {
  event.preventDefault();

  const client = getSupabaseClient();
  const submit = root.querySelector("[data-auth-submit]");
  const form = event.currentTarget;
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!client) {
    setAuthMessage(root, "Supabase config is missing. Add the project URL and anon key first.", "error");
    return;
  }

  if (!email || !password) {
    setAuthMessage(root, "Enter an email and password.", "error");
    return;
  }

  if (submit) {
    submit.disabled = true;
  }

  const result =
    authMode === "signup"
      ? await client.auth.signUp({ email, password })
      : await client.auth.signInWithPassword({ email, password });

  if (submit) {
    submit.disabled = false;
  }

  if (result.error) {
    setAuthMessage(root, result.error.message, "error");
    return;
  }

  setAuthMessage(
    root,
    authMode === "signup" ? "Check your email to confirm your account." : "Logged in.",
    "success"
  );
  form.reset();
}

function initAuth() {
  if (!authRoots.length) {
    return;
  }

  authRoots.forEach((root) => {
    root.querySelectorAll("[data-auth-open]").forEach((button) => {
      button.addEventListener("click", () => {
        openAuthPanel(root, button.dataset.authOpen || "login");
      });
    });

    root.querySelectorAll("[data-auth-mode-button]").forEach((button) => {
      button.addEventListener("click", () => {
        updateAuthMode(root, button.dataset.authModeButton || "login");
      });
    });

    root.querySelector("[data-auth-close]")?.addEventListener("click", () => closeAuthPanel(root));
    root.querySelector("[data-auth-form]")?.addEventListener("submit", (event) => {
      handleAuthSubmit(root, event);
    });

    updateAuthMode(root, authMode);
  });

  const client = getSupabaseClient();

  if (!client) {
    renderAuthState(null);
    return;
  }

  client.auth.getSession().then(({ data }) => {
    renderAuthState(data.session);
  });

  client.auth.onAuthStateChange((_event, session) => {
    renderAuthState(session);
  });
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

window.addEventListener("scroll", requestScrollGridUpdate, { passive: true });
window.addEventListener("resize", requestScrollGridUpdate);

if (typeof reduceMotion.addEventListener === "function") {
  reduceMotion.addEventListener("change", requestScrollGridUpdate);
}

samePageScrollLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("data-scroll-target");

    if (!targetId) {
      return;
    }

    event.preventDefault();
    scrollToTarget(targetId);
    clearHashFromAddress();
    closeNavMenu();
  });
});

crossPageScrollLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const targetId = link.getAttribute("data-route-scroll");

    if (!targetId) {
      return;
    }

    window.sessionStorage.setItem(pendingScrollKey, targetId);
  });
});

if (revealBlocks.length || revealItems.length) {
  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealBlocks.forEach((block) => block.classList.add("reveal-active"));
    revealItems.forEach((item) => item.classList.add("reveal-active"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("reveal-active", entry.isIntersecting);
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.2,
      }
    );

    revealBlocks.forEach((block) => revealObserver.observe(block));
    revealItems.forEach((item) => revealObserver.observe(item));
  }
}

handlePendingScroll();
updateScrollGrid();
normalizeHeaderNav();
ensureAuthAssetsAndMarkup();
initAuth();
