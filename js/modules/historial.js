import { db } from "../firebase.js";
import {
  collection, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { showAlert, obtenerNombreMes } from "../utils.js";


function showLoader() {
  document.getElementById("loader-overlay")?.style.setProperty("display", "flex");
}


function hideLoader() {
  document.getElementById("loader-overlay")?.style.setProperty("display", "none");
}


export async function cargarHistorialPagos() {
  showLoader();
  const tbody = document.querySelector("#tabla-historial-pagos");
  tbody.innerHTML = "";
  try {
    const estudiantesSnapshot = await getDocs(collection(db, "estudiantes"));
    const estudiantesMap = {};
    estudiantesSnapshot.forEach(doc => {
      estudiantesMap[doc.id] = doc.data().nombre;
    });
    const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
    const usuariosMap = {};
    usuariosSnapshot.forEach(doc => {
      usuariosMap[doc.id] = doc.data().nombre;
    });
    const pagosSnapshot = await getDocs(query(collection(db, "pagos"), orderBy("fecha", "desc")));
    // Usar fragment para minimizar repaints
    const fragment = document.createDocumentFragment();
    pagosSnapshot.forEach(docPago => {
      const pago = docPago.data();
      const nombreEstudiante = pago.idEstudiante && estudiantesMap[pago.idEstudiante]
        ? estudiantesMap[pago.idEstudiante]
        : "Desconocido";
      const montoFormateado = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0
      }).format(pago.monto);
      const fechaFormateada = pago.fecha
        ? new Date(pago.fecha).toLocaleString("es-CO")
        : "Sin fecha";
      const nombreRegistrador = usuariosMap[pago.registradoPor] || pago.registradoPor || "N/D";
      const mesPagadoNombre = pago.mesPagado ? obtenerNombreMes(pago.mesPagado) : "N/D";
      const badgeMes = pago.mesPagado
        ? `<span class="historial-badge">${mesPagadoNombre}</span>`
        : '<span class="historial-badge" style="background:#e53e3e">N/D</span>';
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${nombreEstudiante}</td>
        <td class="historial-monto">${montoFormateado}</td>
        <td>${fechaFormateada}</td>
        <td>${badgeMes}</td>
        <td class="historial-registrado">${nombreRegistrador}</td>
      `;
      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  } catch (e) {
    await showAlert("Error cargando historial de pagos: " + e.message);
  }
  hideLoader();
}
