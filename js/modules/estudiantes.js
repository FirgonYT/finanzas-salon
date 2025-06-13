import { db } from "../firebase.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { formatearMontoCOP, showAlert } from "../utils.js";

export let estudiantesTablaCache = null;


function showLoader() {
  document.getElementById("loader-overlay")?.style.setProperty("display", "flex");
}


function hideLoader() {
  document.getElementById("loader-overlay")?.style.setProperty("display", "none");
}


export async function cargarEstudiantes() {
  showLoader();
  const tbody = document.querySelector("#tabla-estudiantes tbody");
  // Limpia el tbody ANTES de cargar estudiantes para evitar duplicados
  tbody.innerHTML = "";
  try {
    const estudiantesSnapshot = await getDocs(collection(db, "estudiantes"));
    const estudiantes = estudiantesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true, sensitivity: 'base' }));

    const pagosSnapshot = await getDocs(collection(db, "pagos"));
    let mesFiltro = "";
    if (window._filtroEstudiantes && window._filtroEstudiantes.mes) {
      mesFiltro = window._filtroEstudiantes.mes;
    } else {
      const hoy = new Date();
      mesFiltro = String(hoy.getMonth() + 1).padStart(2, "0");
    }
    const pagosPorEstudiante = {};
    pagosSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.mesPagado === mesFiltro) {
        if (!pagosPorEstudiante[data.idEstudiante]) pagosPorEstudiante[data.idEstudiante] = 0;
        pagosPorEstudiante[data.idEstudiante] += data.monto;
      }
    });

    estudiantesTablaCache = estudiantes.map(est => {
      const montoPagado = pagosPorEstudiante[est.id] || 0;
      let estadoTexto = "";
      let estadoClase = "";
      if (montoPagado >= 15000) {
        estadoTexto = "Al día";
        estadoClase = "status-pagado";
      } else if (montoPagado > 0) {
        estadoTexto = "Al día con menor pago";
        estadoClase = "status-menor-pago";
      } else {
        estadoTexto = "No al día";
        estadoClase = "status-no-pagado";
      }
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${est.nombre}</td>
        <td class="${estadoClase}">${estadoTexto}</td>
        <td>
          <button class="boton-ver-pagos" onclick="verPagosEstudiante('${est.id}', '${est.nombre}')">Ver pagos</button>
        </td>
      `;
      return {
        id: est.id,
        nombre: est.nombre,
        montoPagado,
        estadoTexto,
        estadoClase,
        trElement: tr
      };
    });

    let estadoFiltro = "todos";
    if (window._filtroEstudiantes && window._filtroEstudiantes.estado) {
      estadoFiltro = window._filtroEstudiantes.estado;
    }
    // Usar fragment para minimizar repaints
    const fragment = document.createDocumentFragment();
    estudiantesTablaCache.forEach(e => {
      if (
        (estadoFiltro === "al-dia" && e.estadoClase !== "status-pagado") ||
        (estadoFiltro === "menor-pago" && e.estadoClase !== "status-menor-pago") ||
        (estadoFiltro === "no-al-dia" && e.estadoClase !== "status-no-pagado")
      ) return;
      fragment.appendChild(e.trElement.cloneNode(true));
    });
    tbody.appendChild(fragment);
  } catch (e) {
    await showAlert("Error cargando estudiantes: " + e.message);
  }
  hideLoader();
}


export function filtrarEstudiantes() {
  const filtro = document.getElementById("busqueda-estudiante").value.toLowerCase();
  const estadoFiltro = document.getElementById("ordenar-estado")?.value || "todos";
  const tbody = document.querySelector("#tabla-estudiantes tbody");
  tbody.innerHTML = "";
  if (!estudiantesTablaCache) return;
  estudiantesTablaCache.forEach(est => {
    if (!est.nombre.toLowerCase().includes(filtro)) return;
    if (
      (estadoFiltro === "al-dia" && est.estadoClase !== "status-pagado") ||
      (estadoFiltro === "menor-pago" && est.estadoClase !== "status-menor-pago") ||
      (estadoFiltro === "no-al-dia" && est.estadoClase !== "status-no-pagado")
    ) return;
    tbody.appendChild(est.trElement.cloneNode(true));
  });
}


export function ordenarEstudiantesPorEstado() {
  filtrarEstudiantes();
}


export async function cargarSelectEstudiantes() {
  const select = document.getElementById("select-estudiante");
  select.innerHTML = '<option value="">-- Seleccione --</option>';
  if (!estudiantesTablaCache) return;
  estudiantesTablaCache.forEach(est => {
    const tr = est.trElement;
    const nombre = tr.querySelector("td")?.textContent?.trim();
    const boton = tr.querySelector("button");
    const id = boton?.getAttribute("onclick")?.match(/verPagosEstudiante\('([^']+)'/)?.[1];
    if (nombre && id) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = nombre;
      select.appendChild(option);
    }
  });
  // Búsqueda por letra
  if (!select.dataset.listenerAdded) {
    let searchChar = '';
    let searchTimeout;
    select.addEventListener("keydown", (e) => {
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        searchChar += e.key.toLowerCase();
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => { searchChar = ''; }, 1000);
        for (let option of select.options) {
          if (option.textContent.toLowerCase().startsWith(searchChar)) {
            select.value = option.value;
            break;
          }
        }
      }
    });
    select.dataset.listenerAdded = "true";
  }
}


export async function agregarEstudiante() {
  const nombre = document.getElementById("estudiante-nombre").value.trim();
  if (!nombre) {
    await showAlert("Por favor, ingresa el nombre del estudiante.");
    return;
  }
  try {
    await addDoc(collection(db, "estudiantes"), { nombre });
    await showAlert("Estudiante agregado.");
    document.getElementById("estudiante-nombre").value = "";
    cargarEstudiantes();
  } catch (e) {
    await showAlert("Error agregando estudiante: " + e.message);
  }
}


export function volverAEstudiantes() {
  window.showSection("estudiantes");
  // NO llames a cargarEstudiantes aquí, showSection ya lo hace automáticamente
  // Elimina cualquier referencia a 'tbody' aquí, no es necesario limpiar nada manualmente
}

