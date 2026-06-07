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
  prevButton.className = "product-carousel-button is-prev";
  nextButton.className = "product-carousel-button is-next";
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
  controls.append(prevButton, nextButton);
  gallery.append(controls, dots);
  gallery.classList.add("is-ready");
  showSlide(0);
});

window.buildInquiryMailto = buildInquiryMailto;

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();
