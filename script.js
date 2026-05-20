const CONFIG = {
  whatsappNumber: "525562069401",
  whatsappMessage:
    "Hola Kali Studio, quiero información sobre sus servicios de baile y eventos."
};

const services = [
  {
    icon: "👑",
    title: "Coreografías para XV",
    description:
      "Vals, baile sorpresa, entrada, montaje para chambelanes y asesoría para que tu momento se vea elegante y seguro.",
    tag: "XV años"
  },
  {
    icon: "🥁",
    title: "Batucadas y shows",
    description:
      "Energía escénica para levantar el ambiente de tu evento con bailarines, ritmo, presencia y coordinación profesional.",
    tag: "Shows en vivo"
  },
  {
    icon: "✨",
    title: "Efectos especiales",
    description:
      "Detalles visuales para momentos clave: entradas, revelaciones, cierres, fotografías y escenas memorables.",
    tag: "Producción"
  },
  {
    icon: "🎈",
    title: "Decoración con globos",
    description:
      "Arcos, fondos, sets para fotos y detalles decorativos alineados al color, tema y presupuesto de tu evento.",
    tag: "Decoración"
  },
  {
    icon: "🍿",
    title: "Barra de snacks",
    description:
      "Una opción práctica y vistosa para complementar tu evento con una experiencia agradable para tus invitados.",
    tag: "Extras"
  },
  {
    icon: "🕺",
    title: "Renta de bailarines",
    description:
      "Bailarines preparados para shows, apoyo escénico, activaciones, eventos sociales y presentaciones especiales.",
    tag: "Talento escénico"
  },
  {
    icon: "🎭",
    title: "Paquetes personalizados",
    description:
      "Armamos una propuesta con lo que realmente necesitas, cuidando calidad, claridad y presupuesto.",
    tag: "A tu medida"
  }
];

const mainNav = document.getElementById("mainNav");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const whatsappFloat = document.getElementById("whatsappFloat");
const contactWhatsapp = document.getElementById("contactWhatsapp");
const serviceTrack = document.getElementById("serviceTrack");
const prevService = document.getElementById("prevService");
const nextService = document.getElementById("nextService");
const carouselDots = document.getElementById("carouselDots");

let activeServiceIndex = 0;
let carouselTimer = null;

function buildWhatsappUrl() {
  const message = encodeURIComponent(CONFIG.whatsappMessage);
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${message}`;
}

function updateWhatsappLinks() {
  const whatsappUrl = buildWhatsappUrl();

  whatsappFloat.href = whatsappUrl;
  contactWhatsapp.href = whatsappUrl;
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
  const visibleServices = getVisibleServices();

  serviceTrack.innerHTML = visibleServices
    .map((service, index) => {
      return `
        <article class="service-card" style="animation-delay: ${index * 90}ms">
          <div class="service-icon" aria-hidden="true">${service.icon}</div>
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
  carouselDots.innerHTML = services
    .map((_, index) => {
      const isActive = index === activeServiceIndex ? "active" : "";
      return `
        <button
          class="${isActive}"
          type="button"
          aria-label="Ver servicio ${index + 1}"
          data-index="${index}"
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

function handleScrollEffects() {
  const heroHeight = document.querySelector(".hero").offsetHeight;
  const navSwitchPoint = heroHeight - 110;
  const whatsappSwitchPoint = heroHeight * 0.72;

  if (window.scrollY >= navSwitchPoint) {
    mainNav.classList.add("is-sticky");
  } else {
    mainNav.classList.remove("is-sticky");
  }

  if (window.scrollY >= whatsappSwitchPoint) {
    whatsappFloat.classList.add("is-visible");
  } else {
    whatsappFloat.classList.remove("is-visible");
  }

  updateActiveNavLink();
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
  navLinks.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function toggleMobileMenu() {
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

  menuToggle.addEventListener("click", toggleMobileMenu);

  navLinks.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      closeMobileMenu();
    }
  });

  nextService.addEventListener("click", nextServiceCard);
  prevService.addEventListener("click", prevServiceCard);

  carouselDots.addEventListener("click", (event) => {
    const dot = event.target.closest("button");

    if (!dot) {
      return;
    }

    const dotIndex = Number(dot.dataset.index);
    goToService(dotIndex);
  });

  serviceTrack.addEventListener("mouseenter", stopCarousel);
  serviceTrack.addEventListener("mouseleave", startCarousel);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });
}

function init() {
  updateWhatsappLinks();
  renderServices();
  startCarousel();
  setupEvents();
  handleScrollEffects();
}

init();