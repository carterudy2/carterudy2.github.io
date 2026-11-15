/* ============================================================
   Carter Udy — portfolio behavior
   Vanilla JS. Handles: mobile nav, header shadow,
   reveal-on-scroll, and the footer year.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("nav-menu");

  function closeMenu() {
    menu?.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
  }

  toggle?.addEventListener("click", function () {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // Close the menu after tapping a link
  menu?.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  // Close on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- Header shadow on scroll ---------- */
  const header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal-on-scroll ---------- */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealTargets = document.querySelectorAll(".section, .hero");

  if (!reduceMotion && "IntersectionObserver" in window) {
    revealTargets.forEach((el) => el.classList.add("will-reveal"));
    const io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
