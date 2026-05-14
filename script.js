import { loadRemotePortfolio } from "./firebase-client.js";
import { defaultFeaturedProjects, defaultPortfolioProjects, defaultSiteContent } from "./site-data.js";

const loader = document.querySelector(".loader");
const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const backTop = document.querySelector("[data-back-top]");
const cursor = document.querySelector(".cursor");
const cursorLabel = document.querySelector(".cursor-label");
const modal = document.querySelector(".project-modal");
const modalClose = document.querySelector(".modal-close");
const modalArt = document.querySelector(".modal-art");
const modalTitle = document.querySelector("#modal-title");
const modalCategory = document.querySelector("#modal-category");
const modalDescription = document.querySelector("#modal-description");
const modalYear = document.querySelector("#modal-year");
const featuredGrid = document.querySelector(".featured-grid");
const portfolioGrid = document.querySelector(".portfolio-grid");
const filterButtons = document.querySelectorAll("[data-filter]");
const form = document.querySelector(".contact-form");
const formMessage = document.querySelector(".form-message");
const artClassNames = [
  "art-cafe",
  "art-social",
  "art-poster",
  "art-artshala",
  "art-product",
  "art-texture",
  "art-studio",
  "art-promo",
  "art-type",
  "art-ad"
];

let revealObserver;

window.addEventListener("load", () => {
  setTimeout(() => loader?.classList.add("is-hidden"), 1250);
});

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMedia(project, kind = "project-art") {
  if (project.mediaUrl && project.mediaType === "video") {
    return `<video class="${kind}" src="${escapeHtml(project.mediaUrl)}" autoplay muted loop playsinline aria-label="${escapeHtml(project.title)} video preview"></video>`;
  }

  if (project.mediaUrl) {
    return `<img class="${kind}" src="${escapeHtml(project.mediaUrl)}" alt="${escapeHtml(project.title)} project preview" loading="lazy" />`;
  }

  return `<div class="${kind} ${escapeHtml(project.artClass || "art-texture")}" role="img" aria-label="${escapeHtml(project.title)} abstract artwork"></div>`;
}

function createMediaElement(url, type, label) {
  if (!url) return null;

  const element = type === "video" ? document.createElement("video") : document.createElement("img");
  element.src = url;

  if (type === "video") {
    element.autoplay = true;
    element.muted = true;
    element.loop = true;
    element.playsInline = true;
    element.setAttribute("aria-label", `${label} video`);
  } else {
    element.alt = `${label} image`;
    element.loading = "lazy";
  }

  return element;
}

function projectDataset(project) {
  return `data-title="${escapeHtml(project.title)}" data-category="${escapeHtml(project.category)}" data-year="${escapeHtml(project.year)}" data-description="${escapeHtml(project.description)}" data-media-url="${escapeHtml(project.mediaUrl || "")}" data-media-type="${escapeHtml(project.mediaType || "")}"`;
}

function renderFeatured(projects) {
  if (!featuredGrid) return;
  featuredGrid.innerHTML = projects
    .map(
      (project, index) => `
        <article class="project-card ${project.size === "large" || index === 0 ? "large" : ""} reveal cursor-project" ${projectDataset(project)}>
          ${renderMedia(project, "project-art")}
          <div class="project-info">
            <h3>${escapeHtml(project.title)}</h3>
            <span>${escapeHtml(project.category)} / ${escapeHtml(project.year)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderPortfolio(projects) {
  if (!portfolioGrid) return;
  portfolioGrid.innerHTML = projects
    .map(
      (project) => `
        <article class="mini-project ${escapeHtml(project.size || "")} reveal cursor-project" data-category-key="${escapeHtml(project.categoryKey || "visuals")}" ${projectDataset(project)}>
          ${renderMedia(project, "mini-art")}
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.category)} / ${escapeHtml(project.year)}</p>
        </article>
      `
    )
    .join("");
}

function applyContent(content) {
  const merged = { ...defaultSiteContent, ...content };
  const mappings = {
    heroName: ".hero-copy .eyebrow",
    heroRole: ".hero-meta span:first-child",
    heroLocation: ".hero-meta span:last-child",
    heroTitle: "#hero-title",
    heroBody: ".hero-text",
    aboutEyebrow: "#about .eyebrow",
    aboutTitle: "#about-title",
    servicesEyebrow: "#services .eyebrow",
    servicesTitle: "#services-title",
    featuredEyebrow: "#work .eyebrow",
    featuredTitle: "#featured-title",
    portfolioEyebrow: ".portfolio .eyebrow",
    portfolioTitle: "#portfolio-title",
    processEyebrow: ".process .eyebrow",
    processTitle: "#process-title",
    experienceEyebrow: ".experience .eyebrow",
    experienceTitle: "#experience-title",
    statementEyebrow: ".statement .eyebrow",
    statementTitle: "#statement-title",
    contactEyebrow: "#contact .eyebrow",
    contactTitle: "#contact-title",
    contactBody: ".contact-copy > p",
    email: ".contact-links a",
    location: ".contact-links span:first-of-type",
    workplace: ".contact-links span:last-of-type"
  };

  Object.entries(mappings).forEach(([key, selector]) => {
    const element = document.querySelector(selector);
    if (!element || merged[key] == null) return;
    element.textContent = merged[key];
    if (key === "email") element.setAttribute("href", `mailto:${merged[key]}`);
  });

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && merged.ogImageUrl) ogImage.setAttribute("content", merged.ogImageUrl);

  ["hero", "about", "services", "process", "experience", "statement", "contact", "footer"].forEach((slot) => {
    const holder = document.querySelector(`[data-media-slot="${slot}"]`);
    const parent = holder?.closest(".hero-visual");
    const url = merged[`${slot}MediaUrl`];
    const type = merged[`${slot}MediaType`] || "image";

    if (!holder) return;
    holder.replaceChildren();
    holder.classList.toggle("has-custom-media", Boolean(url));
    parent?.classList.toggle("has-media", Boolean(url));

    const media = createMediaElement(url, type, `${slot} section`);
    if (media) holder.append(media);
  });
}

function prepareReveal() {
  revealObserver?.disconnect();
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -60px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 6, 5) * 60}ms`;
    revealObserver.observe(item);
  });
}

function wireProjectCards() {
  document.querySelectorAll(".cursor-project").forEach((project) => {
    project.addEventListener("click", () => {
      const mediaUrl = project.dataset.mediaUrl;
      const mediaType = project.dataset.mediaType;
      const artElement = project.querySelector(".project-art, .mini-art");
      const artClass = [...(artElement?.classList || [])].find((className) => artClassNames.includes(className));

      modalArt.replaceChildren();
      modalArt.className = "modal-art";

      if (mediaUrl && mediaType === "video") {
        const video = document.createElement("video");
        video.src = mediaUrl;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        modalArt.append(video);
      } else if (mediaUrl) {
        const img = document.createElement("img");
        img.src = mediaUrl;
        img.alt = `${project.dataset.title} preview`;
        modalArt.append(img);
      } else if (artClass) {
        modalArt.classList.add(artClass);
      }

      modalTitle.textContent = project.dataset.title || "Selected Project";
      modalCategory.textContent = project.dataset.category || "Project";
      modalDescription.textContent =
        project.dataset.description || "A selected creative direction from Zidan Sharma's visual design portfolio.";
      modalYear.textContent = project.dataset.year || "";

      if (typeof modal.showModal === "function") modal.showModal();
    });

    project.addEventListener("mouseenter", () => {
      cursor?.classList.add("is-active");
      cursorLabel?.classList.add("is-visible");
    });

    project.addEventListener("mouseleave", () => {
      cursor?.classList.remove("is-active");
      cursorLabel?.classList.remove("is-visible");
    });
  });
}

async function hydratePortfolio() {
  let content = defaultSiteContent;
  let featuredProjects = defaultFeaturedProjects;
  let portfolioProjects = defaultPortfolioProjects;

  try {
    const remote = await loadRemotePortfolio();
    if (remote) {
      content = { ...content, ...remote.content };
      const remoteProjects = remote.projects.filter((project) => project.status !== "draft");
      if (remoteProjects.length) {
        featuredProjects = remoteProjects.filter((project) => project.featured);
        portfolioProjects = remoteProjects;
      }
    }
  } catch (error) {
    console.warn("Using local portfolio fallback:", error);
  }

  applyContent(content);
  renderFeatured(featuredProjects);
  renderPortfolio(portfolioProjects);
  prepareReveal();
  wireProjectCards();
}

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 20);
  backTop?.classList.toggle("is-visible", window.scrollY > 720);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

const closeMenu = () => {
  menuToggle?.setAttribute("aria-expanded", "false");
  mobileMenu?.classList.remove("is-open");
  header?.classList.remove("is-open");
  document.body.style.overflow = "";
};

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  mobileMenu?.classList.toggle("is-open", !isOpen);
  header?.classList.toggle("is-open", !isOpen);
  document.body.style.overflow = isOpen ? "" : "hidden";
});

document.querySelectorAll(".mobile-menu a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    if (modal?.open) modal.close();
  }
});

backTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const navLinks = [...document.querySelectorAll(".desktop-nav a")];
const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);

const activeNavObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === id);
      });
    });
  },
  { threshold: 0.35 }
);

sections.forEach((section) => activeNavObserver.observe(section));

const parallaxTarget = document.querySelector("[data-parallax]");
window.addEventListener(
  "mousemove",
  (event) => {
    if (!parallaxTarget || window.innerWidth < 900) return;
    const x = (event.clientX / window.innerWidth - 0.5) * 18;
    const y = (event.clientY / window.innerHeight - 0.5) * 18;
    parallaxTarget.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  },
  { passive: true }
);

document.querySelectorAll(".magnetic").forEach((item) => {
  item.addEventListener("mousemove", (event) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = item.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    item.style.transform = `translate(${x * 0.16}px, ${y * 0.18}px)`;
  });

  item.addEventListener("mouseleave", () => {
    item.style.transform = "";
  });
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));

    document.querySelectorAll("[data-category-key]").forEach((item) => {
      const isVisible = filter === "all" || item.dataset.categoryKey === filter;
      item.classList.toggle("is-hidden", !isVisible);
    });
  });
});

modalClose?.addEventListener("click", () => modal.close());
modal?.addEventListener("click", (event) => {
  if (event.target === modal) modal.close();
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    formMessage.textContent = "Please complete each field with a valid email.";
    form.reportValidity();
    return;
  }

  form.reset();
  formMessage.textContent = "Thank you. Your project note is ready to send.";
});

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  window.addEventListener(
    "mousemove",
    (event) => {
      cursor?.classList.add("is-visible");
      cursorLabel.style.left = `${event.clientX}px`;
      cursorLabel.style.top = `${event.clientY}px`;
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    },
    { passive: true }
  );
}

hydratePortfolio();
