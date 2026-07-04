/* ============================================================
   Shared behaviors: nav, reveal, counters, role rotator,
   lightbox, and project card / detail builders.
   Pages must define: const ROOT = "../"; (path to portfolio root)
   ============================================================ */

/* ---------- tiny helpers ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- nav ---------- */
function initNav() {
  const nav = document.querySelector(".nav");
  const burger = document.querySelector(".burger");
  const links = document.querySelector(".nav-links");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (burger && links) {
    burger.addEventListener("click", () => {
      burger.classList.toggle("active");
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        burger.classList.remove("active");
        links.classList.remove("open");
      })
    );
  }
  const bar = document.getElementById("progress");
  if (bar) {
    const onProg = () => {
      const h = document.documentElement;
      const p = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      bar.style.width = p + "%";
    };
    window.addEventListener("scroll", onProg, { passive: true });
    onProg();
  }
}

/* ---------- reveal on scroll ---------- */
function initReveal(scope = document) {
  const els = scope.querySelectorAll(".reveal:not(.in)");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = (e.target.dataset.d || 0) + "ms";
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- animated counters ---------- */
function initCounters() {
  const els = document.querySelectorAll("[data-count]");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        io.unobserve(el);
        const target = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const suffix = el.dataset.suffix || "";
        const dur = 1600;
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.4 }
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- rotating role text ---------- */
function initRoles(roles) {
  const el = document.getElementById("role-swap");
  if (!el || !roles.length) return;
  let i = 0;
  el.textContent = roles[0];
  setInterval(() => {
    el.classList.add("swap-out");
    setTimeout(() => {
      i = (i + 1) % roles.length;
      el.textContent = roles[i];
      el.classList.remove("swap-out");
      el.classList.add("swap-in");
      setTimeout(() => el.classList.remove("swap-in"), 380);
    }, 340);
  }, 2600);
}

/* ---------- lightbox ---------- */
const LB = (() => {
  let images = [];
  let idx = 0;
  let root;

  function build() {
    root = document.createElement("div");
    root.className = "lightbox";
    root.innerHTML = `
      <div class="lb-backdrop"></div>
      <img alt="Preview" />
      <button class="lb-btn lb-prev" aria-label="Previous">‹</button>
      <button class="lb-btn lb-next" aria-label="Next">›</button>
      <button class="lb-close" aria-label="Close">✕</button>
      <div class="lb-count"></div>`;
    document.body.appendChild(root);
    root.querySelector(".lb-backdrop").addEventListener("click", close);
    root.querySelector(".lb-close").addEventListener("click", close);
    root.querySelector(".lb-prev").addEventListener("click", () => show(idx - 1));
    root.querySelector(".lb-next").addEventListener("click", () => show(idx + 1));
    window.addEventListener("keydown", (e) => {
      if (!root.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  function show(i) {
    idx = (i + images.length) % images.length;
    root.querySelector("img").src = images[idx];
    root.querySelector(".lb-count").textContent = `${idx + 1} / ${images.length}`;
    const multi = images.length > 1;
    root.querySelector(".lb-prev").style.display = multi ? "" : "none";
    root.querySelector(".lb-next").style.display = multi ? "" : "none";
    root.querySelector(".lb-count").style.display = multi ? "" : "none";
  }

  function open(list, i = 0) {
    if (!root) build();
    images = list;
    root.classList.add("open");
    document.body.classList.add("no-scroll");
    show(i);
  }

  function close() {
    root.classList.remove("open");
    document.body.classList.remove("no-scroll");
  }

  return { open };
})();

/* ---------- project card builder ---------- */
function buildCard(p, { href = null, featured = false } = {}) {
  const el = document.createElement(href ? "a" : "button");
  if (href) el.href = href;
  el.className = "pcard reveal" + (featured ? " featured" : "");
  el.style.setProperty("--pc", p.color);
  if (p.coverPos) el.style.setProperty("--cover-pos", p.coverPos);

  const plats = p.platforms.map((x) => `<span class="plat-tag">${esc(x)}</span>`).join("");
  const chips = p.techStack.slice(0, 4).map((t) => `<span class="chip">${esc(t)}</span>`).join("");

  if (featured) {
    const stats = (p.featStats || [])
      .map((s) => `<div class="feat-stat"><b>${esc(s.b)}</b><span>${esc(s.s)}</span></div>`)
      .join("");
    el.innerHTML = `
      <div class="feat-left">
        <span class="feat-badge">Featured · ${esc(p.type)}</span>
        <h3>${esc(p.name)} <span class="arrow">→</span></h3>
        <div class="pcard-plat">${plats}</div>
        <p class="pdesc">${esc(p.tagline)}</p>
        <div class="feat-stats">${stats}</div>
        <div class="chips">${chips}</div>
      </div>
      <div class="feat-right">
        <img src="${ROOT}assets/img/kompas/kompasid_3.png" alt="" loading="lazy" />
        <img src="${ROOT}assets/img/kompas/kompasid_1.png" alt="${esc(p.name)}" loading="lazy" />
        <img src="${ROOT}assets/img/kompas/kompasid_5.png" alt="" loading="lazy" />
      </div>`;
  } else {
    el.innerHTML = `
      <div class="pcard-cover">
        <span class="pcard-cat">${esc(p.category)}</span>
        <img src="${ROOT}${p.cover}" alt="${esc(p.name)}" loading="lazy" />
      </div>
      <div class="pcard-body">
        <div class="pcard-plat">${plats}</div>
        <h3>${esc(p.name)} <span class="arrow">→</span></h3>
        <p class="pdesc">${esc(p.tagline)}</p>
        <div class="chips">${chips}</div>
      </div>`;
  }
  return el;
}

/* ---------- project detail builder (used by project.html) ---------- */
function buildDetailHTML(p, { backHref = null } = {}) {
  const plats = p.platforms.map((x) => `<span class="plat-tag">${esc(x)}</span>`).join("");
  const about = p.about.map((t) => `<p>${esc(t)}</p>`).join("");
  const chips = p.techStack.map((t) => `<span class="chip">${esc(t)}</span>`).join("");

  const features = p.features
    ? `<div class="d-section"><h3>Key Features</h3><ul class="plain-list">${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>`
    : "";

  const sections = (p.sections || [])
    .map(
      (s) => `
      <div class="d-section">
        <h3>${esc(s.title)}</h3>
        ${s.bullets ? `<ul class="plain-list" style="margin-bottom:14px">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
        ${s.text ? `<p>${esc(s.text)}</p>` : ""}
      </div>`
    )
    .join("");

  const contribs = p.contributions
    ? `<div class="d-section"><h3>My Contributions</h3><ul class="contrib-list">${p.contributions.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>`
    : "";

  const impact = p.impact
    ? `<div class="d-section"><h3>Impact</h3><div class="impact-row">${p.impact.map((i) => `<div class="impact-card">${esc(i)}</div>`).join("")}</div></div>`
    : "";

  let gallery = "";
  if (p.galleryStyle === "phones") {
    gallery = `<div class="d-section"><h3>App Showcase</h3><div class="phone-strip" data-gallery>
      ${p.gallery.map((g, i) => `<button class="g-item" data-i="${i}"><img src="${ROOT}${g.src}" alt="${esc(p.name)} screenshot ${i + 1}" loading="lazy" /></button>`).join("")}
    </div></div>`;
  } else if (p.gallery && p.gallery.length) {
    gallery = `<div class="d-section"><h3>App Showcase</h3><div class="gallery-grid" data-gallery>
      ${p.gallery.map((g, i) => `<button class="g-item${g.tall ? " tall" : ""}" data-i="${i}"><img src="${ROOT}${g.src}" alt="${esc(p.name)} showcase ${i + 1}" loading="lazy" /></button>`).join("")}
    </div></div>`;
  }

  return `
    <div class="detail-hero" style="--pc:${p.color}">
      <div class="wrap-d">
        ${backHref ? `<a class="back-link" href="${backHref}">← Back to all projects</a>` : ""}
        <div class="detail-meta">
          <span class="plat-tag" style="--pc:${p.color}">${esc(p.type)}</span>
          <span class="plat-tag" style="--pc:${p.color}">${esc(p.category)}</span>
          ${plats}
        </div>
        <h1 class="detail-title">${esc(p.name)}</h1>
        <p class="detail-tagline">${esc(p.tagline)}</p>
      </div>
    </div>
    <div class="detail-body" style="--pc:${p.color}">
      <div class="d-cols">
        <div>
          <div class="d-section"><h3>About the Project</h3>${about}</div>
          ${features}
          ${sections}
        </div>
        <div class="d-side">
          <div class="d-side-card"><h5>Platform</h5><div class="pcard-plat" style="--pc:${p.color}">${plats}</div></div>
          ${p.architecture ? `<div class="d-side-card"><h5>Architecture</h5><div class="val">${esc(p.architecture)}</div></div>` : ""}
          <div class="d-side-card"><h5>Tech Stack</h5><div class="chips">${chips}</div></div>
        </div>
      </div>
      ${contribs}
      ${impact}
      ${gallery}
    </div>`;
}

/* attach lightbox behavior to any [data-gallery] inside container */
function bindGalleries(container, p) {
  container.querySelectorAll("[data-gallery]").forEach((gal) => {
    const srcs = p.gallery.map((g) => ROOT + g.src);
    gal.querySelectorAll(".g-item").forEach((btn) => {
      btn.addEventListener("click", () => LB.open(srcs, parseInt(btn.dataset.i, 10)));
    });
  });
}

/* ---------- social icons ---------- */
const ICONS = {
  github: '<svg viewBox="0 0 24 24"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.1 11.1 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.66.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.72 1.47 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm7.85-10.4a1.44 1.44 0 1 1-1.44-1.44 1.44 1.44 0 0 1 1.44 1.44z"/></svg>',
  email: '<svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.24-8 5-8-5V6.5l8 5 8-5v1.74z"/></svg>',
};

function socialLinksHTML() {
  return `
    <a href="${PERSONAL.github}" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">${ICONS.github}</a>
    <a href="${PERSONAL.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn">${ICONS.linkedin}</a>
    <a href="${PERSONAL.instagram}" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram ${PERSONAL.instagramHandle}">${ICONS.instagram}</a>
    <a href="mailto:${PERSONAL.email}" aria-label="Email" title="${PERSONAL.email}">${ICONS.email}</a>`;
}

/* fills the common home-page sections if their elements exist */
function renderCommonSections() {
  const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
  set("hero-summary", (el) => (el.innerHTML = PERSONAL.summary));
  set("about-summary", (el) => (el.innerHTML = PERSONAL.summary));
  set("contact-email", (el) => (el.href = "mailto:" + PERSONAL.email));
  set("contact-linkedin", (el) => (el.href = PERSONAL.linkedin));
  set("hero-socials", (el) => (el.innerHTML = socialLinksHTML()));
  set("contact-socials", (el) => (el.innerHTML = socialLinksHTML()));
  set("stats", (el) => (el.innerHTML = STATS.map(
    (s) => `<div class="stat"><div class="stat-num" data-count="${s.value}" data-suffix="${s.suffix}" data-decimals="${s.decimals || 0}">0</div><div class="stat-label">${s.label}</div></div>`
  ).join("")));
  set("skills-grid", (el) => (el.innerHTML = SKILLS.map(
    (g, gi) => `
      <div class="skill-card reveal" data-d="${gi * 90}">
        <h3><span class="skill-ico">${g.icon}</span> ${g.title}</h3>
        <p class="skill-note">${g.note}</p>
        <div class="chips">${g.items.map((i) => `<span class="chip${g.hl.includes(i) ? " hl" : ""}">${i}</span>`).join("")}</div>
      </div>`
  ).join("")));
  set("marquee-track", (el) => (el.innerHTML = [...MARQUEE, ...MARQUEE].map((m) => `<span>${m}</span>`).join("")));
}

/* ---------- boot shared pieces ---------- */
function bootShared() {
  initNav();
  initReveal();
  initCounters();
  if (typeof PERSONAL !== "undefined") initRoles(PERSONAL.roles);
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}
