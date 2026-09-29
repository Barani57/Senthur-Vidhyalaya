/* Senthur Vidyalaya — Home interactions (no dependencies) */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileNav = window.matchMedia("(max-width: 1279px)");

  /* ---------- Sticky header ---------- */
  const header = $("#header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 60);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Off-canvas menu (tablet / mobile) ---------- */
  const nav = $("#siteNav");
  const toggle = $("#menuToggle");
  const closeBtn = $("#menuClose");
  const overlay = $("#navOverlay");

  function openMenu() {
    nav.classList.add("is-open");
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("is-visible"));
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
    closeBtn.focus();
  }
  function closeMenu() {
    nav.classList.remove("is-open");
    overlay.classList.remove("is-visible");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
    setTimeout(() => { overlay.hidden = true; }, 300);
  }
  toggle.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", () => { closeMenu(); toggle.focus(); });
  overlay.addEventListener("click", closeMenu);
  mobileNav.addEventListener("change", (e) => { if (!e.matches) closeMenu(); });

  /* ---------- Sub-menus (click on mobile, keyboard on desktop) ---------- */
  const dropItems = $$(".has-drop");
  function closeAllSubs(except) {
    dropItems.forEach((item) => {
      if (item === except) return;
      item.classList.remove("is-open");
      $(".sub-toggle", item).setAttribute("aria-expanded", "false");
    });
  }
  dropItems.forEach((item) => {
    const btn = $(".sub-toggle", item);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !item.classList.contains("is-open");
      closeAllSubs(item);
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
    // desktop: leaving the item closes a keyboard/click-opened panel
    item.addEventListener("mouseleave", () => {
      if (!mobileNav.matches) { item.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }
    });
  });
  document.addEventListener("click", (e) => { if (!mobileNav.matches && !e.target.closest(".has-drop")) closeAllSubs(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (nav.classList.contains("is-open")) { closeMenu(); toggle.focus(); }
    closeAllSubs();
  });

  /* ---------- Hero slider ---------- */
  const hero = $("#hero");
  const slides = $$(".hero__slide", hero);
  const bar = $("#heroBar");
  const current = $("#heroCurrent");
  const DURATION = 7000;
  let index = 0;
  let timer = null;

  function restartBar() {
    bar.classList.remove("is-running");
    void bar.offsetWidth; // restart CSS animation
    if (!reduceMotion) bar.classList.add("is-running");
  }
  function show(i) {
    slides[index].classList.remove("is-active");
    index = (i + slides.length) % slides.length;
    slides[index].classList.add("is-active");
    // swap lazy images in early so fades never show a blank frame
    const img = $("img", slides[(index + 1) % slides.length]);
    if (img) img.loading = "eager";
    current.textContent = String(index + 1).padStart(2, "0");
    restartBar();
  }
  function play() { stop(); if (!reduceMotion) timer = setInterval(() => show(index + 1), DURATION); }
  function stop() { clearInterval(timer); timer = null; }

  $("#heroNext").addEventListener("click", () => { show(index + 1); play(); });
  $("#heroPrev").addEventListener("click", () => { show(index - 1); play(); });
  hero.addEventListener("mouseenter", () => { stop(); hero.classList.add("is-paused"); });
  hero.addEventListener("mouseleave", () => { hero.classList.remove("is-paused"); play(); });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : play()));

  // swipe on touch screens
  let startX = 0;
  hero.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) { show(index + (dx < 0 ? 1 : -1)); play(); }
  });

  restartBar();
  play();

  /* ---------- Scroll reveal ---------- */
  if ("IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("is-ready");
    // stagger cards inside grids
    $$(".hl-grid .reveal").forEach((el, i) => el.style.setProperty("--d", (i % 4) * 0.08 + "s"));
    $$(".bento .reveal").forEach((el, i) => el.style.setProperty("--d", i * 0.07 + "s"));
    $$(".welcome__text.reveal").forEach((el) => el.style.setProperty("--d", ".12s"));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  /* ---------- Gallery lightbox ---------- */
  const items = $$(".bento__item");
  const lb = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCount = $("#lbCount");
  let lbIndex = 0;
  let lastFocus = null;

  function lbShow(i) {
    lbIndex = (i + items.length) % items.length;
    const img = $("img", items[lbIndex]);
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCount.textContent = (lbIndex + 1) + " / " + items.length;
  }
  function lbOpen(i) {
    lastFocus = document.activeElement;
    lbShow(i);
    lb.hidden = false;
    document.body.classList.add("no-scroll");
    $("#lbClose").focus();
  }
  function lbClose() {
    lb.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  }
  items.forEach((item, i) => item.addEventListener("click", () => lbOpen(i)));
  $("#lbClose").addEventListener("click", lbClose);
  $("#lbPrev").addEventListener("click", () => lbShow(lbIndex - 1));
  $("#lbNext").addEventListener("click", () => lbShow(lbIndex + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) lbClose(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") lbClose();
    if (e.key === "ArrowRight") lbShow(lbIndex + 1);
    if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
  });

  /* ---------- Back to top & year ---------- */
  $("#toTop").addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
  $("#year").textContent = new Date().getFullYear();
})();
