import { db } from "../firebase.js";
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { formatearMontoCOP, obtenerNombreMes, showAlert, showConfirm } from "../utils.js";
import { usuarioActual } from "./auth.js";
import { estudiantesTablaCache } from "./estudiantes.js";


function showLoader() {
  document.getElementById("loader-overlay")?.style.setProperty("display", "flex");
}


function hideLoader() {
  document.getElementById("loader-overlay")?.style.setProperty("display", "none");
}


export async function registrarPago() {
  if (!usuarioActual) {
    await showAlert("Debes iniciar sesión para registrar pagos.");
    return;
  }
  const idEstudiante = document.getElementById("select-estudiante").value;
  const rawMonto = document.getElementById("pago-monto").value.replace(/\D/g, "");
  const monto = parseInt(rawMonto, 10);
  const fechaInput = document.getElementById("pago-fecha").value;
  const mesPagado = document.getElementById("mes-pagado").value;
  if (!idEstudiante) return await showAlert("Selecciona un estudiante.");
  if (!monto || monto <= 0) return await showAlert("Ingresa un monto válido.");
  if (!fechaInput) return await showAlert("Selecciona una fecha y hora para el pago.");
  if (!mesPagado) return await showAlert("Selecciona el mes que está pagando.");

  const fecha = new Date(fechaInput);
  const mesRegistro = fecha.getFullYear() + "-" + String(fecha.getMonth() + 1).padStart(2, "0");
  const correoUsuario = usuarioActual.email;

  try {
    await addDoc(collection(db, "pagos"), {
      idEstudiante,
      monto,
      fecha: fecha.toISOString(),
      mesRegistro,
      mesPagado,
      registradoPor: usuarioActual.nombre || correoUsuario
    });
    await showAlert("Pago registrado por " + monto + " COP.");
    document.getElementById("pago-monto").value = "";
    document.getElementById("pago-fecha").value = "";
    document.getElementById("mes-pagado").value = "";
  } catch (e) {
    await showAlert("Error registrando pago: " + e.message);
  }
}


export async function verPagosEstudiante(idEstudiante, nombre) {
  const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
  const usuariosMap = {};
  usuariosSnapshot.forEach(doc => {
    usuariosMap[doc.id] = doc.data().nombre;
  });

  window._estudianteActual = { id: idEstudiante, nombre };
  window.showSection("detalle-pagos");
  document.getElementById("nombre-estudiante-detalle").textContent = nombre;

  const tbody = document.querySelector("#tabla-pagos-detalle tbody");
  tbody.innerHTML = "";

  const hoy = new Date();
  const mesActualNum = hoy.getMonth() + 1;

  try {
    const pagosQuery = query(
      collection(db, "pagos"),
      where("idEstudiante", "==", idEstudiante),
      orderBy("fecha", "desc")
    );
    const pagosSnapshot = await getDocs(pagosQuery);

    let totalPagado = 0;
    let totalHistorico = 0;
    const pagosPorMes = {};
    pagosSnapshot.forEach(docPago => {
      const data = docPago.data();
      const mesPagado = parseInt(data.mesPagado, 10);
      if (!pagosPorMes[mesPagado]) pagosPorMes[mesPagado] = [];
      pagosPorMes[mesPagado].push({ id: docPago.id, ...data });
      totalHistorico += data.monto;
      if (mesPagado === mesActualNum) totalPagado += data.monto;
    });

    const mesesOrdenados = Object.keys(pagosPorMes).sort((a, b) => b - a);
    const fragment = document.createDocumentFragment();
    mesesOrdenados.forEach(mes => {
      const pagos = pagosPorMes[mes];
      let subtotalMes = 0;
      const thMes = document.createElement("tr");
      thMes.innerHTML = `
        <td colspan="4" style="
          background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
          color: #fff;
          text-align: left;
          font-weight: bold;
          font-size: 1.08rem;
          letter-spacing: 0.5px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(59,130,246,0.10);
          padding: 14px 18px;
          border: none;
        ">
          <span style="display:inline-block;vertical-align:middle;margin-right:8px;font-size:1.2em;">📅</span>
          ${obtenerNombreMes(mes)} — <span style="font-size:0.95em;font-weight:400;">${pagos.length} pago(s)</span>
        </td>`;
      fragment.appendChild(thMes);
      const trHeader = document.createElement("tr");
      trHeader.innerHTML = `
        <th>Fecha</th>
        <th>Monto</th>
        <th>Mes Pagado</th>
        <th>Acciones</th>`;
      fragment.appendChild(trHeader);
      pagos.forEach(data => {
        const fechaPago = new Date(data.fecha);
        const mesPagadoNum = parseInt(data.mesPagado, 10);
        let etiquetaMesPagado = obtenerNombreMes(data.mesPagado);
        if (mesPagadoNum > mesActualNum) etiquetaMesPagado += " (adelantado)";
        subtotalMes += data.monto;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${fechaPago.toLocaleString()}</td>
          <td>${formatearMontoCOP(data.monto)}</td>
          <td>${etiquetaMesPagado}</td>
          <td>
            <button class="boton-eliminar-pago" onclick="eliminarPago('${data.id}', '${idEstudiante}', '${nombre}')">Eliminar</button>
            <button class="boton-eliminar-pago" onclick="subirFacturaPago('${data.id}')">Subir Factura</button>
            <button class="boton-eliminar-pago" onclick="generarFacturaConFormato(
              '${nombre}', 
              '${data.fecha}', 
              ${data.monto}, 
              '${usuariosMap[data.registradoPor] || data.registradoPor || "Desconocido"}', 
              '${obtenerNombreMes(data.mesPagado) || "No registrado"}'
            )">Descargar Factura</button>
            ${data.imagenFactura ? `
              <img src="${data.imagenFactura}" 
                alt="Factura" 
                style="width:40px; height:40px; cursor:pointer; border-radius:5px; vertical-align: middle;"
                onclick="abrirModalZoom('${data.imagenFactura}', '${data.id}', 'pago')">` : ''
            }
          </td>`;
        fragment.appendChild(tr);
      });
      const trSubtotal = document.createElement("tr");
      trSubtotal.innerHTML = `
        <td></td>
        <td style="font-weight: bold; color: #2563eb;" colspan="3">Total del mes: ${formatearMontoCOP(subtotalMes)}</td>`;
      fragment.appendChild(trSubtotal);
    });
    tbody.appendChild(fragment);

    document.getElementById("total-pagado").textContent = formatearMontoCOP(totalPagado);
    document.getElementById("total-historico").textContent = formatearMontoCOP(totalHistorico);

    let estadoPago = "";
    if (totalPagado >= 15000) {
      estadoPago = "<span class='status-pagado'>Al día</span>";
    } else if (totalPagado > 0 && totalPagado < 15000) {
      estadoPago = "<span class='status-menor-pago'>Al día con menor pago</span>";
    } else {
      estadoPago = "<span class='status-no-pagado'>No al día</span>";
    }
    document.getElementById("estado-pago-detalle").innerHTML = estadoPago;
  } catch (e) {
    await showAlert("Error cargando pagos: " + e.message);
  }
}


export async function subirFacturaPago(idPago) {
  // ...puedes copiar la función de subirFacturaPago aquí...
}


export async function cargarFinanzas() {
  showLoader();
  let totalIngresos = 0;
  let totalEgresos = 0;
  let totalExtras = 0;
  try {
    const pagosSnapshot = await getDocs(collection(db, "pagos"));
    pagosSnapshot.forEach(doc => { totalIngresos += doc.data().monto; });
  } catch (e) { alert("Error cargando ingresos: " + e.message); }
  try {
    const egresosSnapshot = await getDocs(collection(db, "egresos"));
    egresosSnapshot.forEach(doc => { totalEgresos += doc.data().monto; });
  } catch (e) { alert("Error cargando egresos: " + e.message); }
  try {
    const extrasSnapshot = await getDocs(collection(db, "extras"));
    extrasSnapshot.forEach(doc => { totalExtras += doc.data().monto; });
  } catch (e) { alert("Error cargando extras: " + e.message); }
  document.getElementById("total-ingresos").textContent = formatearMontoCOP(totalIngresos);
  document.getElementById("total-egresos").textContent = formatearMontoCOP(totalEgresos);
  document.getElementById("balance").textContent = formatearMontoCOP(totalIngresos + totalExtras - totalEgresos);
  // Mostrar total extras en finanzas
  let extrasSpan = document.getElementById("total-extras");
  if (!extrasSpan) {
    const p = document.createElement("p");
    p.innerHTML = `<strong>Extras:</strong> <span id="total-extras">0</span>`;
    document.getElementById("finanzas").insertBefore(p, document.getElementById("finanzas").children[2]);
    extrasSpan = document.getElementById("total-extras");
  }
  extrasSpan.textContent = formatearMontoCOP(totalExtras);
  hideLoader();
}


export async function eliminarPago(idPago, idEstudiante, nombre) {
  if (await showConfirm("¿Seguro que deseas eliminar este pago?")) {
    try {
      await deleteDoc(doc(db, "pagos", idPago));
      await showAlert("Pago eliminado.");
      await verPagosEstudiante(idEstudiante, nombre);
      if (window.cargarEstudiantes) window.cargarEstudiantes();
      if (window.cargarFinanzas) window.cargarFinanzas();
    } catch (e) {
      await showAlert("Error eliminando pago: " + e.message);
    }
  }
}


