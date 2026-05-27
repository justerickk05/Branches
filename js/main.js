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

const serviceTrack = document.getElementById("serviceTrack");
const prevService = document.getElementById("prevService");
const nextService = document.getElementById("nextService");
const carouselDots = document.getElementById("carouselDots");

const exploreTabs = document.querySelectorAll("[data-explore-tab]");
const explorePanel = document.querySelector("[data-explore-panel]");
const exploreMapItems = document.querySelectorAll("[data-explore-map]");

let activeServiceIndex = 0;
let carouselTimer = null;

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

function getVisibleServiceCount() {
  if (window.innerWidth <= 980) {
    return 1;
  }

  return 3;
}

function getVisibleServices() {
  const visibleCount = getVisibleServiceCount();
  const visibleServices = [];

  for (let index = 0; index < visibleCount; index += 1) {
    const serviceIndex = (activeServiceIndex + index) % services.length;
    visibleServices.push(services[serviceIndex]);
  }

  return visibleServices;
}

function renderServices() {
  if (!serviceTrack) {
    return;
  }

  const visibleServices = getVisibleServices();

  serviceTrack.innerHTML = visibleServices
    .map((service) => {
      return `
        <article class="service-card">
          <div class="service-icon">${service.icon}</div>
          <h3>${service.title}</h3>
          <p>${service.description}</p>
          <strong>${service.tag}</strong>
        </article>
      `;
    })
    .join("");

  renderDots();
}

function renderDots() {
  if (!carouselDots) {
    return;
  }

  carouselDots.innerHTML = services
    .map((_, index) => {
      const isActive = index === activeServiceIndex ? "active" : "";

      return `
        <button
          class="${isActive}"
          type="button"
          data-index="${index}"
          aria-label="Ver servicio ${index + 1}"
        ></button>
      `;
    })
    .join("");
}

function goToService(index) {
  activeServiceIndex = (index + services.length) % services.length;
  renderServices();
  restartCarousel();
}

function nextServiceCard() {
  goToService(activeServiceIndex + 1);
}

function prevServiceCard() {
  goToService(activeServiceIndex - 1);
}

function startCarousel() {
  stopCarousel();

  carouselTimer = window.setInterval(() => {
    activeServiceIndex = (activeServiceIndex + 1) % services.length;
    renderServices();
  }, 6500);
}

function stopCarousel() {
  if (carouselTimer) {
    window.clearInterval(carouselTimer);
    carouselTimer = null;
  }
}

function restartCarousel() {
  stopCarousel();
  startCarousel();
}

function renderExploreContent(key = "eventos") {
  if (!explorePanel) {
    return;
  }

  const content = exploreContent[key] || exploreContent.eventos;

  explorePanel.innerHTML = `
    <span class="explore-kicker">${content.kicker}</span>
    <h3>${content.title}</h3>
    <p>${content.description}</p>
    <div class="explore-tags">
      ${content.tags.map((tag) => `<span>${tag}</span>`).join("")}
    </div>
    <a href="${content.href}" class="btn btn-primary">${content.cta}</a>
  `;

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
  if (!exploreTabs.length || !explorePanel) {
    return;
  }

  exploreTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      renderExploreContent(tab.dataset.exploreTab);
    });
  });

  renderExploreContent("eventos");
}

function updateHomeNavVisibility() {
  if (!mainNav || !homeNavLink) {
    return;
  }

  const shouldShowHomeLink = mainNav.classList.contains("is-sticky");

  homeNavLink.hidden = !shouldShowHomeLink;
  homeNavLink.setAttribute("aria-hidden", String(!shouldShowHomeLink));

  if (!shouldShowHomeLink) {
    homeNavLink.classList.remove("active");
  }
}

function handleScrollEffects() {
  const hero = document.querySelector(".hero");

  if (!hero || !mainNav) {
    return;
  }

  const heroHeight = hero.offsetHeight;
  const navSwitchPoint = heroHeight - 110;
  const whatsappSwitchPoint = heroHeight * 0.72;

  if (window.scrollY >= navSwitchPoint) {
    mainNav.classList.add("is-sticky");
  } else {
    mainNav.classList.remove("is-sticky");
  }

  if (whatsappFloat) {
    if (window.scrollY >= whatsappSwitchPoint) {
      whatsappFloat.classList.add("is-visible");
    } else {
      whatsappFloat.classList.remove("is-visible");
    }
  }

  updateActiveNavLink();
  updateHomeNavVisibility();
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

function closeMobileMenu() {
  if (!navLinks || !menuToggle) {
    return;
  }

  navLinks.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function toggleMobileMenu() {
  if (!navLinks || !menuToggle) {
    return;
  }

  const isOpen = navLinks.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function setupEvents() {
  window.addEventListener("scroll", handleScrollEffects, { passive: true });

  window.addEventListener("resize", () => {
    renderServices();
    handleScrollEffects();
    closeMobileMenu();
  });

  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMobileMenu);
  }

  if (navLinks) {
    navLinks.addEventListener("click", (event) => {
      if (event.target.matches("a")) {
        closeMobileMenu();
      }
    });
  }

  if (nextService) {
    nextService.addEventListener("click", nextServiceCard);
  }

  if (prevService) {
    prevService.addEventListener("click", prevServiceCard);
  }

  if (carouselDots) {
    carouselDots.addEventListener("click", (event) => {
      const dot = event.target.closest("button");

      if (!dot) {
        return;
      }

      const dotIndex = Number(dot.dataset.index);
      goToService(dotIndex);
    });
  }

  if (serviceTrack) {
    serviceTrack.addEventListener("mouseenter", stopCarousel);
    serviceTrack.addEventListener("mouseleave", startCarousel);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });
}

function init() {
  updateWhatsappLinks();
  renderServices();
  setupExploreTabs();
  startCarousel();
  setupEvents();
  handleScrollEffects();
}

init();