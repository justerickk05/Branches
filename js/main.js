const CONFIG = {
  whatsappNumber: "525637126751",
  whatsappMessage:
    "Hola Kali Studio, quiero información sobre sus servicios de baile y eventos.",
};

const exploreContent = {
  eventos: {
    kicker: "Servicios para eventos",
    title: "Convierte tu evento en una experiencia escénica.",
    description:
      "Explora coreografías, shows, batucadas, bailarines, decoración y paquetes personalizados sin sentir que tienes que decidir todo desde el primer momento.",
    tags: ["XV años", "Shows", "Batucadas", "Producción"],
    href: "#servicios",
    cta: "Ver servicios",
  },
  clases: {
    kicker: "Para alumnos y academias",
    title: "Encuentra dónde bailar o publica tus clases.",
    description:
      "Esta sección está pensada para conectar alumnos, profesores, academias y espacios de baile con opciones claras por zona, estilo, nivel y horario.",
    tags: ["Academias", "Profesores", "Horarios", "Ubicación"],
    href: "#clases",
    cta: "Explorar clases",
  },
  aprender: {
    kicker: "Ideas y aprendizaje",
    title: "Aprende sin saturarte de información.",
    description:
      "Guías, tips y explicaciones simples para chambelanes, quinceañeras, bailarines principiantes y personas que quieren entender mejor el proceso.",
    tags: ["Tips", "Guías", "Diccionario", "Ensayos"],
    href: "#aprender",
    cta: "Ver aprendizaje",
  },
  recursos: {
    kicker: "Material descargable",
    title: "Herramientas útiles para planear mejor.",
    description:
      "Aquí podrán vivir checklists, plantillas, playlists, calendarios de ensayo e ideas prácticas para preparar eventos, clases o presentaciones.",
    tags: ["Plantillas", "Checklists", "Playlists", "Ideas"],
    href: "#recursos",
    cta: "Ver recursos",
  },
  acceso: {
    kicker: "Próximamente",
    title: "Un espacio privado para clientes y colaboradores.",
    description:
      "El acceso podrá servir después para revisar ensayos, pagos, servicios contratados, clases publicadas o recursos exclusivos.",
    tags: ["Clientes", "Bailarines", "Colaboradores", "Portal"],
    href: "#login",
    cta: "Ver acceso",
  },
};

const mainNav = document.getElementById("mainNav");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const homeNavLink = document.querySelector(".nav-links a[href='#inicio']");
const whatsappFloat = document.getElementById("whatsappFloat");
const contactWhatsapp = document.getElementById("contactWhatsapp");
const exploreTabs = document.querySelectorAll("[data-explore-tab]");
const explorePanel = document.querySelector("[data-explore-panel]");
const exploreMapItems = document.querySelectorAll("[data-explore-map]");

let isScrollTicking = false;

function buildWhatsappUrl() {
  const message = encodeURIComponent(CONFIG.whatsappMessage);
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${message}`;
}

function updateWhatsappLinks() {
  const whatsappUrl = buildWhatsappUrl();

  if (whatsappFloat) {
    whatsappFloat.href = whatsappUrl;
  }

  if (contactWhatsapp) {
    contactWhatsapp.href = whatsappUrl;
  }
}

function renderExploreContent(key = "eventos") {
  if (!explorePanel) return;

  const content = exploreContent[key] || exploreContent.eventos;

  explorePanel.classList.remove("is-switching");

  explorePanel.innerHTML = `
    <span class="explore-kicker">${content.kicker}</span>
    <h3>${content.title}</h3>
    <p>${content.description}</p>
    <div class="explore-tags">
      ${content.tags.map((tag) => `<span>${tag}</span>`).join("")}
    </div>
    <a href="${content.href}" class="btn btn-primary">${content.cta}</a>
  `;

  requestAnimationFrame(() => {
    explorePanel.classList.add("is-switching");
  });

  exploreTabs.forEach((tab) => {
    const isActive = tab.dataset.exploreTab === key;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  exploreMapItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.exploreMap === key);
  });
}

function setupExploreTabs() {
  if (!exploreTabs.length || !explorePanel) return;

  exploreTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      renderExploreContent(tab.dataset.exploreTab);
    });

    tab.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      renderExploreContent(tab.dataset.exploreTab);
    });
  });

  explorePanel.setAttribute("aria-live", "polite");
  renderExploreContent("eventos");
}

function updateHomeNavVisibility() {
  if (!mainNav || !homeNavLink) return;

  const shouldShowHomeLink = mainNav.classList.contains("is-sticky");

  homeNavLink.hidden = !shouldShowHomeLink;
  homeNavLink.setAttribute("aria-hidden", String(!shouldShowHomeLink));

  if (!shouldShowHomeLink) {
    homeNavLink.classList.remove("active");
  }
}

function updateActiveNavLink() {
  const sections = document.querySelectorAll("header[id], section[id]");
  const links = document.querySelectorAll(".nav-links a[href^='#']");

  let currentSectionId = "inicio";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 140;

    if (window.scrollY >= sectionTop) {
      currentSectionId = section.getAttribute("id");
    }
  });

  links.forEach((link) => {
    const linkId = link.getAttribute("href").replace("#", "");
    link.classList.toggle("active", linkId === currentSectionId);
  });
}

function handleScrollEffects() {
  const hero = document.querySelector(".hero");

  if (!hero || !mainNav) return;

  const heroHeight = hero.offsetHeight;
  const navSwitchPoint = heroHeight - 110;
  const whatsappSwitchPoint = heroHeight * 0.72;

  mainNav.classList.toggle("is-sticky", window.scrollY >= navSwitchPoint);

  if (whatsappFloat) {
    whatsappFloat.classList.toggle("is-visible", window.scrollY >= whatsappSwitchPoint);
  }

  updateActiveNavLink();
  updateHomeNavVisibility();
}

function requestScrollUpdate() {
  if (isScrollTicking) return;

  isScrollTicking = true;

  requestAnimationFrame(() => {
    handleScrollEffects();
    isScrollTicking = false;
  });
}

function closeMobileMenu() {
  if (!navLinks || !menuToggle) return;

  navLinks.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function toggleMobileMenu() {
  if (!navLinks || !menuToggle) return;

  const isOpen = navLinks.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function setupMobileMenu() {
  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener("click", toggleMobileMenu);

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });
}

function setupRevealAnimations() {
  const revealItems = document.querySelectorAll(
    [
      ".intro-section .explore-copy",
      ".explore-board",
      ".pricing-bridge-content > *",
      ".classes-content > *",
      ".search-preview .class-result",
      ".learning-grid article",
      ".about-grid > *",
      ".login-box",
      ".contact-section > *",
    ].join(",")
  );

  if (!revealItems.length) return;

  revealItems.forEach((item, index) => {
    item.classList.add("reveal-ready");
    item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 80}ms`);
  });

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -80px 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupSoftTilt() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (prefersReducedMotion || !canHover) return;

  const tiltItems = document.querySelectorAll(".main-card, .search-preview, .learning-grid article");

  tiltItems.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const rotateX = ((y / rect.height) - 0.5) * -5;
      const rotateY = ((x / rect.width) - 0.5) * 5;

      item.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    item.addEventListener("pointerleave", () => {
      item.style.transform = "";
    });
  });
}

function setupEvents() {
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
}

function init() {
  document.body.classList.add("is-ready");

  updateWhatsappLinks();
  setupExploreTabs();
  setupMobileMenu();
  setupRevealAnimations();
  setupSoftTilt();
  setupEvents();
  handleScrollEffects();
}

init();