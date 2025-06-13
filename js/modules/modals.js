import { db } from "../firebase.js";
import { doc, getDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";


export function cerrarModalArchivos() {
  document.getElementById("modal-archivos").style.display = "none";
}


export function abrirModalZoom(url, id, tipo = "egreso") {
  const modalZoom = document.getElementById("modal-zoom");
  const imagenZoom = document.getElementById("imagen-zoom");
  imagenZoom.src = url;
  modalZoom.style.display = "flex";
  window._urlImagenActual = url;
  window._tipoImagenActual = tipo;
  window._idDocumentoImagen = id;
}


export function cerrarModalZoom() {
  document.getElementById("modal-zoom").style.display = "none";
}


export async function borrarImagen() {
  const url = window._urlImagenActual;
  const tipo = window._tipoImagenActual;
  const id = window._idDocumentoImagen;
  if (!url || !tipo || !id) {
    alert("No se pudo identificar el origen de la imagen.");
    return;
  }
  if (!confirm("¿Seguro que deseas borrar esta imagen?")) return;
  try {
    const ref = doc(db, tipo === "pago" ? "pagos" : "egresos", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      alert("No se encontró el documento.");
      return;
    }
    const data = snap.data();
    if (tipo === "egreso") {
      const archivos = data.archivosImgur || [];
      const nuevos = archivos.filter(link => link !== url);
      await updateDoc(ref, { archivosImgur: nuevos });
    } else {
      await updateDoc(ref, { imagenFactura: deleteField() });
    }
    alert("Imagen borrada correctamente.");
    cerrarModalZoom();
    if (window.cerrarModalArchivos) window.cerrarModalArchivos();
    if (tipo === "egreso" && window.cargarEgresos) {
      window.cargarEgresos();
    } else if (window._estudianteActual && window.verPagosEstudiante) {
      await window.verPagosEstudiante(window._estudianteActual.id, window._estudianteActual.nombre);
    }
  } catch (e) {
    alert("Error borrando imagen: " + e.message);
  }
}
