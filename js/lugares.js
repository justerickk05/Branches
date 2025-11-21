/* ==========================================================
   VARIABLES Y ELEMENTOS
========================================================== */
const contenedorLugares = document.getElementById('contenedor-lugares');
const btnAgregar = document.getElementById('btn-agregar');
const formContainer = document.getElementById('form-lugar-container');
const btnVolver = document.getElementById('btn-volver');
const formulario = document.getElementById('formulario-lugar');
const inputBuscar = document.getElementById('buscar-nombre');
const inputDireccion = document.getElementById("direccion");
const selectItems = document.getElementById('items-por-pagina');

const pagCont = document.getElementById("paginacion");

let lugares = JSON.parse(localStorage.getItem('lugares')) || [];

/* Paginación */
let paginaActual = 1;
let totalPaginas = 1;

/* ==========================================================
   MAPA PRINCIPAL
========================================================== */
const map = L.map('mapa').setView([19.432608, -99.133209], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

let marker = L.marker([19.432608, -99.133209], { draggable: true }).addTo(map);

async function actualizarDireccion(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        if (data && data.display_name) inputDireccion.value = data.display_name;
    } catch (err) { console.error(err); }
}

marker.on('dragend', () => {
    const pos = marker.getLatLng();
    actualizarDireccion(pos.lat, pos.lng);
});

map.on('click', e => {
    marker.setLatLng(e.latlng);
    actualizarDireccion(e.latlng.lat, e.latlng.lng);
});

/* ==========================================================
   GEOCODIFICACIÓN
========================================================== */
function geocodificarDireccion(direccion, callback) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}&limit=1`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0) {
                callback({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
            } else callback(null);
        })
        .catch(() => callback(null));
}

/* ==========================================================
   MINI MAPAS — SIEMPRE CENTRADOS + ZOOM ACTIVADO
========================================================== */
function crearMiniMapa(id, lugar) {
    const miniMap = L.map(id, {
        attributionControl: false,
        zoomControl: true,
        scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(miniMap);

    let lat = 19.432608;
    let lng = -99.133209;

    if (lugar.coords && lugar.coords.lat != null && lugar.coords.lng != null) {
        lat = lugar.coords.lat;
        lng = lugar.coords.lng;
    }

    miniMap.setView([lat, lng], 15);
    L.marker([lat, lng]).addTo(miniMap);

    /* Forzar centrado correcto */
    setTimeout(() => {
        miniMap.invalidateSize();
        miniMap.setView([lat, lng], 15);
    }, 150);

    miniMap.whenReady(() => {
        miniMap.invalidateSize();
        miniMap.setView([lat, lng], 15);
    });
}

/* ==========================================================
   PAGINACIÓN NUMÉRICA
========================================================== */
function crearPaginacion(total) {
    totalPaginas = total;
    pagCont.innerHTML = "";

    if (totalPaginas <= 1) return;

    const btnPrev = document.createElement("button");
    btnPrev.textContent = "Anterior";
    btnPrev.className = "pagination-btn";
    btnPrev.disabled = paginaActual === 1;
    btnPrev.onclick = () => cambiarPagina(paginaActual - 1);

    const btnNext = document.createElement("button");
    btnNext.textContent = "Siguiente";
    btnNext.className = "pagination-btn";
    btnNext.disabled = paginaActual === totalPaginas;
    btnNext.onclick = () => cambiarPagina(paginaActual + 1);

    const pagesWrap = document.createElement("div");
    pagesWrap.className = "pagination-pages";

    for (let i = 1; i <= totalPaginas; i++) {
        const b = document.createElement("div");
        b.className = "page-item";
        b.textContent = i;

        if (i === paginaActual) b.classList.add("active");

        b.onclick = () => cambiarPagina(i);

        pagesWrap.appendChild(b);
    }

    pagCont.appendChild(btnPrev);
    pagCont.appendChild(pagesWrap);
    pagCont.appendChild(btnNext);
}

function cambiarPagina(nueva) {
    paginaActual = nueva;
    mostrarLugares();
}

/* ==========================================================
   MOSTRAR TARJETAS
========================================================== */
function mostrarLugares() {
    contenedorLugares.innerHTML = "";

    const filtro = inputBuscar.value.toLowerCase();
    const itemsPorPagina = parseInt(selectItems.value, 10) || 10;

    const filtrados = lugares.filter(l =>
        (l.nombre || "").toLowerCase().includes(filtro)
    );

    totalPaginas = Math.ceil(filtrados.length / itemsPorPagina);
    if (paginaActual > totalPaginas) paginaActual = totalPaginas || 1;

    const inicio = (paginaActual - 1) * itemsPorPagina;
    const pagina = filtrados.slice(inicio, inicio + itemsPorPagina);

    pagina.forEach(lugar => {
        const realIndex = lugares.indexOf(lugar);

        const tarjeta = document.createElement("div");
        tarjeta.classList.add("tarjeta", "show");

        tarjeta.innerHTML = `
            <h3>${lugar.nombre}</h3>
            <p>${lugar.descripcion || ""}</p>
            <p>${lugar.direccion || ""}</p>

            <div class="categorias">
                <span class="categoria">${lugar.categoria || ""}</span>
            </div>

            <div class="etiquetas">
                ${(lugar.etiquetas || "")
                    .split(",")
                    .map(e => e.trim())
                    .filter(Boolean)
                    .map(e => `<span class="etiqueta">${e}</span>`)
                    .join("")}
            </div>

            <div class="mini-mapa" id="mini-${realIndex}"></div>

            <div class="botones">
                <button class="editar-btn" data-index="${realIndex}">Editar</button>
                <button class="eliminar-btn" data-index="${realIndex}">Eliminar</button>
                <button class="abrir-maps-btn" data-direccion="${encodeURIComponent(lugar.direccion || "")}">Abrir en Maps</button>
            </div>
        `;

        contenedorLugares.appendChild(tarjeta);

        crearMiniMapa(`mini-${realIndex}`, lugar);
    });

    agregarEventosTarjetas();
    crearPaginacion(totalPaginas);
}

/* ==========================================================
   EVENTOS DE TARJETAS
========================================================== */
function agregarEventosTarjetas() {
    document.querySelectorAll(".editar-btn").forEach(b =>
        b.onclick = e => {
            const i = e.target.dataset.index;
            cargarFormulario(lugares[i], i);
        }
    );

    document.querySelectorAll(".eliminar-btn").forEach(b =>
        b.onclick = e => {
            const i = e.target.dataset.index;
            if (confirm(`¿Eliminar "${lugares[i].nombre}"?`)) {
                lugares.splice(i, 1);
                localStorage.setItem("lugares", JSON.stringify(lugares));
                mostrarLugares();
            }
        }
    );

    document.querySelectorAll(".abrir-maps-btn").forEach(b =>
        b.onclick = e => {
            const dir = e.target.dataset.direccion;
            window.open(`https://www.google.com/maps/search/?api=1&query=${dir}`, "_blank");
        }
    );
}

/* ==========================================================
   FORMULARIO — AGREGAR / EDITAR
========================================================== */
btnAgregar.addEventListener("click", () => {
    formulario.reset();
    formulario.dataset.editIndex = "";

    contenedorLugares.style.display = "none";
    formContainer.style.display = "flex";

    setTimeout(() => {
        map.invalidateSize();
        map.setView([19.432608, -99.133209], 12);
        marker.setLatLng([19.432608, -99.133209]);
    }, 120);
});

btnVolver.addEventListener("click", () => {
    formContainer.style.display = "none";
    contenedorLugares.style.display = "grid";
    mostrarLugares();
});

function cargarFormulario(lugar, index) {
    formulario.nombre.value = lugar.nombre;
    formulario.descripcion.value = lugar.descripcion;
    formulario.direccion.value = lugar.direccion;
    formulario.numero.value = lugar.numero;
    formulario.link.value = lugar.link;
    formulario.categoria.value = lugar.categoria;
    formulario.etiquetas.value = lugar.etiquetas;

    formulario.dataset.editIndex = index;

    contenedorLugares.style.display = "none";
    formContainer.style.display = "flex";

    setTimeout(() => {
        map.invalidateSize();
        if (lugar.coords) {
            map.setView([lugar.coords.lat, lugar.coords.lng], 15);
            marker.setLatLng([lugar.coords.lat, lugar.coords.lng]);
        }
    }, 120);
}

/* ==========================================================
   GUARDAR FORMULARIO
========================================================== */
formulario.addEventListener("submit", e => {
    e.preventDefault();

    const pos = marker.getLatLng();
    const coords = { lat: pos.lat, lng: pos.lng };

    const nuevo = {
        nombre: formulario.nombre.value,
        descripcion: formulario.descripcion.value,
        direccion: formulario.direccion.value,
        numero: formulario.numero.value,
        link: formulario.link.value,
        categoria: formulario.categoria.value,
        etiquetas: formulario.etiquetas.value,
        coords
    };

    const idx = formulario.dataset.editIndex;
    if (idx !== "") lugares[idx] = nuevo;
    else lugares.push(nuevo);

    localStorage.setItem("lugares", JSON.stringify(lugares));

    formulario.reset();
    formContainer.style.display = "none";
    contenedorLugares.style.display = "grid";

    mostrarLugares();
});

/* ==========================================================
   EVENTOS DE FILTRO Y CARGA
========================================================== */
inputBuscar.addEventListener("input", () => {
    paginaActual = 1;
    mostrarLugares();
});

selectItems.addEventListener("change", () => {
    paginaActual = 1;
    mostrarLugares();
});

window.addEventListener("load", () => {
    mostrarLugares();
});
