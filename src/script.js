const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const inquiryForms = document.querySelectorAll(".inquiry-form");
const productGalleries = document.querySelectorAll(".product-single-gallery");
const inquiryEmail = "646483619@qq.com";
const pageStartedAt = Date.now();
let exitTracked = false;

function readStorage(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return "";
  }
}

function writeStorage(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage can be blocked in private browsing. Tracking still works for this page.
  }
}

function randomToken(prefix) {
  if (window.crypto?.randomUUID) {
    return `${prefix}${window.crypto.randomUUID()}`;
  }

  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

const existingVisitorId = readStorage(window.localStorage, "mj_visitor_id");
const visitorId = existingVisitorId || randomToken("mj_");
const visitorIsNew = !existingVisitorId;
writeStorage(window.localStorage, "mj_visitor_id", visitorId);

const existingSessionId = readStorage(window.sessionStorage, "mj_session_id");
const sessionId = existingSessionId || randomToken("mjs_");
writeStorage(window.sessionStorage, "mj_session_id", sessionId);

function inferProductSlug(path) {
  const match = path.match(/^\/([^/.]+)(?:\.html)?$/);
  if (!match) return "";
  const slug = match[1];
  const reserved = new Set(["", "index", "about", "products", "admin", "404"]);
  return reserved.has(slug) ? "" : slug;
}

function pageContext(extra = {}) {
  const body = document.body;
  const path = window.location.pathname || "/";
  const pageType = body.dataset.pageType || (inferProductSlug(path) ? "product_detail" : "page");

  return {
    visitor_id: visitorId,
    session_id: sessionId,
    path,
    url: window.location.href,
    referrer: document.referrer || "",
    page_title: body.dataset.pageTitle || document.title || path,
    page_type: pageType,
    product_slug: body.dataset.productSlug || inferProductSlug(path),
    product_title: body.dataset.productTitle || "",
    is_new_visitor: visitorIsNew,
    duration_seconds: Math.round((Date.now() - pageStartedAt) / 1000),
    ...extra
  };
}

function trackAnalytics(eventType, extra = {}, options = {}) {
  const payload = JSON.stringify(pageContext({ event_type: eventType, ...extra }));
  const canBeacon = Boolean(window.navigator?.sendBeacon && window.Blob);

  function sendPixel() {
    if (!document?.createElement) return Promise.resolve();
    const params = new URLSearchParams(JSON.parse(payload));
    params.set("_", String(Date.now()));
    const img = document.createElement("img");
    img.src = `/api/analytics/pixel?${params.toString()}`;
    img.alt = "";
    img.width = 1;
    img.height = 1;
    img.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;";
    document.body?.appendChild(img);
    window.setTimeout(() => img.remove(), 8000);
    return Promise.resolve();
  }

  if ((options.beacon || !window.fetch) && canBeacon) {
    const blob = new window.Blob([payload], { type: "application/json" });
    window.navigator.sendBeacon("/api/analytics/track", blob);
    return Promise.resolve();
  }

  if (!window.fetch) {
    return sendPixel();
  }

  return window.fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  }).catch(() => sendPixel());
}

function buildInquiryMailto(fields, pageUrl) {
  const category = fields["Product Category"] || "Product Inquiry";
  const subject = `MEIJIA DENTAL Inquiry - ${category}`;
  const lines = [
    "New inquiry from MEIJIA DENTAL website",
    "",
    `Name: ${fields.Name || ""}`,
    `Email: ${fields.Email || ""}`,
    `Product Category: ${category}`,
    `Quantity / Case Type: ${fields["Quantity or Case Type"] || ""}`,
    "",
    "Message:",
    fields.Message || "",
    "",
    `Page: ${pageUrl}`,
  ];

  return `mailto:${inquiryEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

function updateHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-label", "Open navigation");
    });
  });
}

inquiryForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const fields = Object.fromEntries(new FormData(form).entries());
    const category = fields["Product Category"] || "";
    const mailtoUrl = buildInquiryMailto(fields, window.location.href);

    trackAnalytics("send_inquiry_click", {
      product_title: category || pageContext().product_title,
      product_slug: pageContext().product_slug
    }, { beacon: true });

    window.location.href = mailtoUrl;
  });
});

productGalleries.forEach((gallery) => {
  const slides = Array.from(gallery.querySelectorAll(".product-single-image"));

  if (slides.length < 2) {
    return;
  }

  let activeIndex = 0;
  const controls = document.createElement("div");
  const prevButton = document.createElement("button");
  const nextButton = document.createElement("button");
  const dots = document.createElement("div");
  const dotButtons = slides.map((_, index) => {
    const dot = document.createElement("button");

    dot.type = "button";
    dot.className = "product-carousel-dot";
    dot.setAttribute("aria-label", `Show image ${index + 1}`);
    dot.addEventListener("click", () => showSlide(index));
    dots.append(dot);

    return dot;
  });

  controls.className = "product-carousel-controls";
  dots.className = "product-carousel-dots";
  prevButton.type = "button";
  nextButton.type = "button";
  prevButton.className = "product-carousel-button";
  nextButton.className = "product-carousel-button";
  prevButton.setAttribute("aria-label", "Show previous image");
  nextButton.setAttribute("aria-label", "Show next image");
  prevButton.textContent = "<";
  nextButton.textContent = ">";

  function showSlide(nextIndex) {
    activeIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;

      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      dotButtons[index].classList.toggle("is-active", isActive);
      dotButtons[index].setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  prevButton.addEventListener("click", () => showSlide(activeIndex - 1));
  nextButton.addEventListener("click", () => showSlide(activeIndex + 1));
  controls.append(prevButton, dots, nextButton);
  gallery.append(controls);
  gallery.classList.add("is-ready");
  showSlide(0);
});

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link) return;

  const href = link.getAttribute("href") || "";
  const absoluteHref = link.href || href;

  if (href.startsWith("mailto:")) {
    trackAnalytics("email_click", {}, { beacon: true });
    return;
  }

  if (/whatsapp|wa\.me/i.test(absoluteHref)) {
    trackAnalytics("whatsapp_click", {}, { beacon: true });
    return;
  }

  if (link.classList.contains("product-card") || link.closest(".product-index-section")) {
    const targetPath = new URL(absoluteHref, window.location.href).pathname;
    trackAnalytics("product_link_click", {
      path: targetPath,
      product_slug: inferProductSlug(targetPath),
      product_title: link.textContent.trim().replace(/\s+/g, " ").slice(0, 160)
    }, { beacon: true });
  }
});

function trackExit() {
  if (exitTracked || document.body.dataset.pageType === "error_404") return;
  exitTracked = true;
  trackAnalytics("page_exit", {}, { beacon: true });
}

if (document.body.dataset.pageType === "error_404") {
  trackAnalytics("not_found");
} else {
  trackAnalytics("page_view");
  window.setInterval(() => {
    trackAnalytics("page_ping", {}, { beacon: true });
  }, 30000);
}

try {
  window.buildInquiryMailto = buildInquiryMailto;
  window.trackAnalytics = trackAnalytics;
} catch {
  // Some embedded preview browsers lock the window object. The site still works normally.
}

window.addEventListener("scroll", updateHeader, { passive: true });
window.addEventListener("pagehide", trackExit);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") trackExit();
});
updateHeader();
