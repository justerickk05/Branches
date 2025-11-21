/* ==========================================================
   SCRIPT GLOBAL DEL SITIO
========================================================== */

import { cargar, guardar } from "../js/utils.js";

/* ----------------------------------------------------------
   MODO OSCURO GLOBAL
---------------------------------------------------------- */
(function initDarkMode() {
    // Cargar preferencia guardada
    const modo = cargar("modo-oscuro", "claro");

    // Aplicar estilo inicial
    document.body.classList.toggle("dark-mode", modo === "oscuro");

    // Obtener botón
    const boton = document.getElementById("modo-oscuro");
    if (!boton) return;

    // Activar evento
    boton.addEventListener("click", () => {
        const activar = !document.body.classList.contains("dark-mode");

        document.body.classList.toggle("dark-mode", activar);
        guardar("modo-oscuro", activar ? "oscuro" : "claro");
    });
})();

/* ----------------------------------------------------------
   CAMBIO DE TEMA (selector en index.html)
---------------------------------------------------------- */
(function initTemas() {
    const temaGuardado = cargar("tema-activo", "default");

    aplicarTema(temaGuardado);

    const opciones = document.querySelectorAll(".tema-opcion");
    if (!opciones.length) return;

    opciones.forEach(opcion => {
        opcion.addEventListener("click", () => {
            const tema = opcion.dataset.tema;
            aplicarTema(tema);
            guardar("tema-activo", tema);
        });
    });
})();

function aplicarTema(tema) {
    document.body.dataset.tema = tema;
    // Más adelante agregarás estilos especiales para cada tema
    // (moderno, elegante, neon, etc.)
}
