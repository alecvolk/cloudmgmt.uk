const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("[data-nav-links]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const samePageScrollLinks = document.querySelectorAll("[data-scroll-target]");
const crossPageScrollLinks = document.querySelectorAll("[data-route-scroll]");
const revealBlocks = document.querySelectorAll("[data-reveal]");
const revealItems = document.querySelectorAll("[data-reveal-item]");
const scrollOffset = 96;
const pendingScrollKey = "cloudmgmt-scroll-target";

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

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
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
