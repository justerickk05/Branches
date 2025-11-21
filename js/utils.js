/* ==========================================================
   UTILS — Funciones globales reutilizables
========================================================== */

export function guardar(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function cargar(key, def = null) {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
}

export function crearID() {
    return Math.random().toString(36).substring(2, 10);
}

export function debounce(func, delay = 250) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
}
