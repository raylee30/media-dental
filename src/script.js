const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const inquiryForms = document.querySelectorAll(".inquiry-form");
const productGalleries = document.querySelectorAll(".product-single-gallery");
const inquiryEmail = "646483619@qq.com";

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
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

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

inquiryForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const fields = Object.fromEntries(new FormData(form).entries());
    const mailtoUrl = buildInquiryMailto(fields, window.location.href);

    window.location.href = mailtoUrl;
  });
});

productGalleries.forEach((gallery) => {
  const slides = Array.from(gallery.querySelectorAll(".product-single-image"));
  const autoplayDelay = 2000;

  if (slides.length < 2) {
    return;
  }

  let activeIndex = 0;
  let autoplayTimer = null;
  const controls = document.createElement("div");
  const prevButton = document.createElement("button");
  const nextButton = document.createElement("button");
  const dots = document.createElement("div");
  const dotButtons = slides.map((_, index) => {
    const dot = document.createElement("button");

    dot.type = "button";
    dot.className = "product-carousel-dot";
    dot.setAttribute("aria-label", `Show image ${index + 1}`);
    dot.addEventListener("click", () => {
      showSlide(index, index >= activeIndex ? "next" : "prev");
      restartAutoplay();
    });
    dots.append(dot);

    return dot;
  });

  controls.className = "product-carousel-controls";
  dots.className = "product-carousel-dots";
  prevButton.type = "button";
  nextButton.type = "button";
  prevButton.className = "product-carousel-button is-prev";
  nextButton.className = "product-carousel-button is-next";
  prevButton.setAttribute("aria-label", "Show previous image");
  nextButton.setAttribute("aria-label", "Show next image");
  prevButton.textContent = "<";
  nextButton.textContent = ">";

  function showSlide(nextIndex, direction = "next") {
    const previousIndex = activeIndex;
    const normalizedIndex = (nextIndex + slides.length) % slides.length;
    const isReady = gallery.classList.contains("is-ready");

    if (normalizedIndex === activeIndex && isReady) {
      return;
    }

    if (isReady) {
      const enteringSlide = slides[normalizedIndex];

      enteringSlide.classList.remove("is-active", "is-before", "is-after");
      enteringSlide.classList.add(direction === "next" ? "is-after" : "is-before");
      enteringSlide.setAttribute("aria-hidden", "true");
      enteringSlide.getBoundingClientRect();
    }

    activeIndex = normalizedIndex;

    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;

      slide.classList.toggle("is-active", isActive);
      slide.classList.toggle(
        "is-before",
        !isActive && (index === previousIndex ? direction === "next" : index < activeIndex)
      );
      slide.classList.toggle(
        "is-after",
        !isActive && (index === previousIndex ? direction === "prev" : index > activeIndex)
      );
      slide.setAttribute("aria-hidden", String(!isActive));
      dotButtons[index].classList.toggle("is-active", isActive);
      dotButtons[index].setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function startAutoplay() {
    if (autoplayTimer) return;
    autoplayTimer = window.setInterval(() => showSlide(activeIndex + 1, "next"), autoplayDelay);
  }

  function stopAutoplay() {
    if (!autoplayTimer) return;
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  prevButton.addEventListener("click", () => {
    showSlide(activeIndex - 1, "prev");
    restartAutoplay();
  });
  nextButton.addEventListener("click", () => {
    showSlide(activeIndex + 1, "next");
    restartAutoplay();
  });
  controls.append(prevButton, nextButton);
  gallery.append(controls, dots);
  showSlide(0, "next");
  gallery.classList.add("is-ready");
  startAutoplay();
});

window.buildInquiryMailto = buildInquiryMailto;

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();
