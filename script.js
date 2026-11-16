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

  /* ---------- Back to top (signature + footer link) ----------
     The #top anchor is the sticky header, which never leaves view,
     so the browser won't scroll to it on its own. */
  document.querySelectorAll('a[href="#top"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      closeMenu();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      history.replaceState(null, "", location.pathname + location.search);
    });
  });

  /* ---------- Current section in the nav ----------
     The section is "current" once its top passes 40% of the way down the screen. */
  const navLinks = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  let navTicking = false;
  function markCurrent() {
    navTicking = false;
    const line = window.innerHeight * 0.4;
    let current = null;
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) current = "#" + s.id; });
    // at the very bottom the last section (Contact) can't reach the line, so count it as current
    if (sections.length && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = "#" + sections[sections.length - 1].id;
    navLinks.forEach(function (a) {
      if (a.getAttribute("href") === current) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }
  window.addEventListener("scroll", function () {
    if (!navTicking) { navTicking = true; requestAnimationFrame(markCurrent); }
  }, { passive: true });
  markCurrent();

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
