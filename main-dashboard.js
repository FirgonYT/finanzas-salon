// js/main-dashboard.js
import { onAuthChange, logout } from './auth.js';
import { agregarEstudiante, obtenerEstudiantes } from './estudiantes.js';
import { registrarPago, obtenerPagosPorEstudianteMes, eliminarPago } from './pagos.js';
import { registrarIngreso } from './ingresos.js';
import { registrarEgreso } from './egresos.js';

function showSection(id) {
  document.querySelectorAll("#sidebar button").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  const btn = document.querySelector(`#sidebar button[onclick="showSection('${id}')"]`);
  if(btn) btn.classList.add("active");

  if(id === 'estudiantes' || id === 'pagos') {
    cargarEstudiantes();
    cargarSelectEstudiantes();
  }
}
window.showSection = showSection;

async function cargarEstudiantes() {
  const tbody = document.querySelector("#tabla-estudiantes tbody");
  tbody.innerHTML = "";

  const hoy = new Date();
  const mesActual = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0");

  try {
    const estudiantes = await obtenerEstudiantes();

    for (const estudiante of estudiantes) {
      const pagos = await obtenerPagosPorEstudianteMes(estudiante.id, mesActual);

      let sumaPagos = pagos.reduce((sum, p) => sum + p.monto, 0);

      let estadoTexto = "";
      let estadoClase = "";
      if (sumaPagos >= 15000) {
        estadoTexto = "Al día";
        estadoClase = "status-pagado";
      } else if (sumaPagos > 0 && sumaPagos < 15000) {
        estadoTexto = "Al día con menor pago";
        estadoClase = "status-menor-pago";
      } else {
        estadoTexto = "No al día";
        estadoClase = "status-no-pagado";
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${estudiante.nombre}</td>
        <td class="${estadoClase}">${estadoTexto}</td>
        <td><button class="boton-ver-pagos" onclick="verPagosEstudiante('${estudiante.id}', '${estudiante.nombre}')">Ver pagos</button></td>
      `;
      tbody.appendChild(tr);
    }
  } catch (e) {
    alert("Error cargando estudiantes: " + e.message);
  }
}
window.cargarEstudiantes = cargarEstudiantes;

async function cargarSelectEstudiantes() {
  const select = document.getElementById("select-estudiante");
  select.innerHTML = '<option value="">-- Seleccione --</option>';
  try {
    const estudiantes = await obtenerEstudiantes();
    estudiantes.forEach(est => {
      const option = document.createElement("option");
      option.value = est.id;
      option.textContent = est.nombre;
      select.appendChild(option);
    });
  } catch (e) {
    alert("Error cargando estudiantes para select: " + e.message);
  }
}
window.cargarSelectEstudiantes = cargarSelectEstudiantes;

async function agregarNuevoEstudiante() {
  const nombreInput = document.getElementById("input-nombre-estudiante");
  const nombre = nombreInput.value.trim();
  if (!nombre) {
    alert("Ingrese un nombre para el estudiante");
    return;
  }
  try {
    await agregarEstudiante(nombre);
    nombreInput.value = "";
    cargarEstudiantes();
    cargarSelectEstudiantes();
  } catch (e) {
    alert("Error agregando estudiante: " + e.message);
  }
}
window.agregarNuevoEstudiante = agregarNuevoEstudiante;

async function registrarNuevoPago() {
  const select = document.getElementById("select-estudiante");
  const monto = parseInt(document.getElementById("input-monto-pago").value, 10);
  if (!select.value) {
    alert("Seleccione un estudiante");
    return;
  }
  if (!monto || monto <= 0) {
    alert("Ingrese un monto válido");
    return;
  }
  try {
    await registrarPago(select.value, monto);
    alert("Pago registrado");
    document.getElementById("input-monto-pago").value = "";
  } catch (e) {
    alert("Error registrando pago: " + e.message);
  }
}
window.registrarNuevoPago = registrarNuevoPago;

async function verPagosEstudiante(idEstudiante, nombre) {
  const pagos = await obtenerPagosPorEstudianteMes(idEstudiante, new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0"));
  let html = `<h3>Pagos de ${nombre}</h3><ul>`;
  pagos.forEach(pago => {
    html += `<li>$${pago.monto} - ${new Date(pago.fechaPago.seconds * 1000).toLocaleDateString()} 
      <button onclick="eliminarPago('${pago.id}')">Eliminar</button></li>`;
  });
  html += `</ul><button onclick="cerrarModal()">Cerrar</button>`;
  const modal = document.createElement("div");
  modal.id = "modal-pagos";
  modal.style.position = "fixed";
  modal.style.top = "10%";
  modal.style.left = "50%";
  modal.style.transform = "translateX(-50%)";
  modal.style.backgroundColor = "white";
  modal.style.padding = "20px";
  modal.style.border = "1px solid #ccc";
  modal.style.zIndex = "1000";
  modal.innerHTML = html;
  document.body.appendChild(modal);
}
window.verPagosEstudiante = verPagosEstudiante;

async function eliminarPago(idPago) {
  if (!confirm("¿Eliminar este pago?")) return;
  try {
    await eliminarPago(idPago);
    alert("Pago eliminado");
    cargarEstudiantes();
  } catch (e) {
    alert("Error eliminando pago: " + e.message);
  }
}
window.eliminarPago = eliminarPago;

function cerrarModal() {
  const modal = document.getElementById("modal-pagos");
  if (modal) modal.remove();
}
window.cerrarModal = cerrarModal;

function setupLogout() {
  document.getElementById("btn-logout").addEventListener("click", async () => {
    await logout();
  });
}

onAuthChange(user => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    cargarEstudiantes();
    cargarSelectEstudiantes();
    setupLogout();
  }
});
