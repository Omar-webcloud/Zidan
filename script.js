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

window.addEventListener("load", () => {
  setTimeout(() => loader?.classList.add("is-hidden"), 1250);
});

const setHeaderState = () => {
  const scrolled = window.scrollY > 20;
  header?.classList.toggle("is-scrolled", scrolled);
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

const revealObserver = new IntersectionObserver(
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

const navLinks = [...document.querySelectorAll(".desktop-nav a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

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

const filterButtons = document.querySelectorAll("[data-filter]");
const portfolioItems = document.querySelectorAll("[data-category-key]");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.toggle("active", item === button));

    portfolioItems.forEach((item) => {
      const isVisible = filter === "all" || item.dataset.categoryKey === filter;
      item.classList.toggle("is-hidden", !isVisible);
    });
  });
});

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

document.querySelectorAll(".cursor-project").forEach((project) => {
  project.addEventListener("click", () => {
    const artElement = project.querySelector(".project-art, .mini-art");
    const artClass = [...(artElement?.classList || [])].find((className) => artClassNames.includes(className));

    modalArt.className = "modal-art";
    if (artClass) modalArt.classList.add(artClass);
    modalTitle.textContent = project.dataset.title || "Selected Project";
    modalCategory.textContent = project.dataset.category || "Project";
    modalDescription.textContent =
      project.dataset.description || "A selected creative direction from Zidan Sharma's visual design portfolio.";
    modalYear.textContent = project.dataset.year || "";

    if (typeof modal.showModal === "function") {
      modal.showModal();
    }
  });
});

modalClose?.addEventListener("click", () => modal.close());
modal?.addEventListener("click", (event) => {
  if (event.target === modal) modal.close();
});

const form = document.querySelector(".contact-form");
const formMessage = document.querySelector(".form-message");

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

  document.querySelectorAll(".cursor-project").forEach((project) => {
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
