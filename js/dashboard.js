import * as auth from "./modules/auth.js";
import * as estudiantes from "./modules/estudiantes.js";
import * as pagos from "./modules/pagos.js";
import * as egresos from "./modules/egresos.js";
import * as calendario from "./modules/calendario.js";
import * as historial from "./modules/historial.js";
import * as informes from "./modules/informes.js";
import * as factura from "./modules/factura.js";
import * as modals from "./modules/modals.js";
import * as extras from "./modules/extras.js";

// Exponer funciones globales para los onclick del HTML
window.logout = auth.logout;
window.cargarEstudiantes = estudiantes.cargarEstudiantes;
window.filtrarEstudiantes = estudiantes.filtrarEstudiantes;
window.ordenarEstudiantesPorEstado = estudiantes.ordenarEstudiantesPorEstado;
window.cargarSelectEstudiantes = estudiantes.cargarSelectEstudiantes;
window.registrarPago = pagos.registrarPago;
window.verPagosEstudiante = pagos.verPagosEstudiante;
window.subirFacturaPago = pagos.subirFacturaPago;
window.cargarFinanzas = pagos.cargarFinanzas;
window.registrarEgreso = egresos.registrarEgreso;
window.cargarEgresos = egresos.cargarEgresos;
window.subirArchivoEgreso = egresos.subirArchivoEgreso;
window.eliminarEgreso = egresos.eliminarEgreso;
window.mostrarArchivos = egresos.mostrarArchivos;
window.cerrarModalArchivos = modals.cerrarModalArchivos;
window.abrirModalZoom = modals.abrirModalZoom;
window.cerrarModalZoom = modals.cerrarModalZoom;
window.borrarImagen = modals.borrarImagen;
window.inicializarCalendario = calendario.inicializarCalendario;
window.agregarEvento = calendario.agregarEvento;
window.eliminarEvento = calendario.eliminarEvento;
window.cargarHistorialPagos = historial.cargarHistorialPagos;
window.descargarInformeExcel = informes.descargarInformeExcel;
window.cambiarFormatoFactura = factura.cambiarFormatoFactura;
window.generarFacturaConFormato = factura.generarFacturaConFormato;
window.volverAEstudiantes = estudiantes.volverAEstudiantes;
window.eliminarPago = pagos.eliminarPago;
window.registrarExtra = extras.registrarExtra;
window.abrirModalInforme = function() {
  document.getElementById("modal-informe").style.display = "flex";
  document.getElementById("mes-informe-modal").value = "";
};
window.cerrarModalInforme = function() {
  document.getElementById("modal-informe").style.display = "none";
};
window.descargarInformeExcelModal = function() {
  const mes = document.getElementById("mes-informe-modal").value;
  if (!mes) {
    if (window.showAlert) window.showAlert("Selecciona un mes para el informe.");
    else alert("Selecciona un mes para el informe.");
    return;
  }
  // Llama a la función real pasando el mes seleccionado
  if (window.descargarInformeExcel) window.descargarInformeExcel(mes);
  document.getElementById("modal-informe").style.display = "none";
};


// Estado global para filtros de estudiantes
window._filtroEstudiantes = {
  estado: "todos",
  mes: ""
};


window.abrirModalFiltroEstudiantes = function() {
  document.getElementById("modal-filtro-estudiantes").style.display = "flex";
  document.getElementById("ordenar-estado-modal").value = window._filtroEstudiantes.estado || "todos";
  document.getElementById("mes-lista-estudiantes-modal").value = window._filtroEstudiantes.mes || "";
};


window.cerrarModalFiltroEstudiantes = function() {
  document.getElementById("modal-filtro-estudiantes").style.display = "none";
};


window.aplicarFiltroEstudiantes = function() {
  window._filtroEstudiantes.estado = document.getElementById("ordenar-estado-modal").value;
  window._filtroEstudiantes.mes = document.getElementById("mes-lista-estudiantes-modal").value;
  document.getElementById("modal-filtro-estudiantes").style.display = "none";
  estudiantes.cargarEstudiantes();
};


// Navegación de secciones
window.showSection = function showSection(id) {
  // No recargar si ya está activa
  const currentSection = document.querySelector("section.active");
  if (currentSection && currentSection.id === id) return;

  document.querySelectorAll("#sidebar button").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  const btn = document.querySelector(`#sidebar button[onclick="showSection('${id}')"]`);
  if (btn) btn.classList.add("active");

  if (id === 'estudiantes') {
    estudiantes.cargarEstudiantes();
  } else if (id === 'pagos') {
    estudiantes.cargarSelectEstudiantes();
  } else if (id === 'finanzas') {
    pagos.cargarFinanzas();
  } else if (id === 'egresos') {
    egresos.cargarEgresos();
  } else if (id === 'extras') {
    extras.cargarExtras();
  } else if (id === 'calendario') {
    calendario.inicializarCalendario();
  } else if (id === 'historial') {
    historial.cargarHistorialPagos();
  }
};


document.addEventListener('DOMContentLoaded', () => {
  window.showSection('estudiantes');
  auth.initAuth();
});

// Añade esta línea para exponer la función de eventos con materiales:
window.obtenerEventosConMateriales = calendario.obtenerEventosConMateriales;