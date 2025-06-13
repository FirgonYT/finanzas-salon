import { db } from "../firebase.js";
import {
  collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { formatearMontoCOP, showAlert, showConfirm } from "../utils.js";


function showLoader() {
  document.getElementById("loader-overlay")?.style.setProperty("display", "flex");
}


function hideLoader() {
  document.getElementById("loader-overlay")?.style.setProperty("display", "none");
}


export async function registrarEgreso() {
  const titulo = document.getElementById("titulo-egreso")?.value?.trim() || "";
  const descripcion = document.getElementById("descripcion-egreso").value.trim();
  const montoRaw = document.getElementById("monto-egreso").value;
  const montoLimpio = montoRaw.replace(/\D/g, "");
  const monto = parseInt(montoLimpio, 10);

  if (!titulo) {
    await showAlert("Por favor, ingresa el título del egreso.");
    return;
  }
  if (!descripcion) {
    await showAlert("Por favor, ingresa la descripción del egreso.");
    return;
  }
  if (!monto || monto <= 0) {
    await showAlert("Ingresa un monto válido para el egreso.");
    return;
  }

  try {
    await addDoc(collection(db, "egresos"), {
      titulo,
      descripcion,
      monto,
      fecha: new Date().toISOString()
    });
    // Cerrar el modal antes de mostrar la alerta
    const modal = document.getElementById("modal-egreso");
    if (modal) modal.style.display = "none";
    await showAlert("Egreso registrado.");
    document.getElementById("titulo-egreso").value = "";
    document.getElementById("descripcion-egreso").value = "";
    document.getElementById("monto-egreso").value = "";
    cargarEgresos();
    if (window.cargarFinanzas) window.cargarFinanzas();
  } catch (e) {
    await showAlert("Error registrando egreso: " + e.message);
  }
}


export async function cargarEgresos() {
  showLoader();
  const contenedor = document.getElementById("tabla-egresos-lista");
  if (!contenedor) return;
  contenedor.innerHTML = "";
  try {
    const egresosSnapshot = await getDocs(query(collection(db, "egresos"), orderBy("fecha", "desc")));
    egresosSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const egresoId = docSnap.id;
      const titulo = data.titulo || "(Sin título)";
      const monto = formatearMontoCOP(data.monto);
      const fecha = new Date(data.fecha).toLocaleString();
      const card = document.createElement("div");
      card.className = "egreso-card";
      card.innerHTML = `
        <div class="egreso-card-header" tabindex="0">
          <div class="egreso-card-title">${titulo}</div>
          <div class="egreso-card-monto">${monto}</div>
          <div class="egreso-card-fecha">${fecha}</div>
        </div>
        <div class="egreso-card-body" style="display:none;">
          <div class="egreso-card-desc"><strong>Descripción:</strong> <span class="egreso-desc-text">${data.descripcion || ""}</span></div>
          <div class="egreso-card-archivos"></div>
          <div class="egreso-card-actions">
            <button class="boton-eliminar-egreso" onclick="eliminarEgreso('${egresoId}')">Eliminar</button>
            <button class="boton-eliminar-egreso" onclick="subirArchivoEgreso('${egresoId}')">Adjuntar archivo</button>
            <button class="boton-eliminar-egreso" onclick="editarEgreso('${egresoId}')">Editar</button>
          </div>
        </div>
      `;
      // Mostrar archivos adjuntos
      const archivosDiv = card.querySelector(".egreso-card-archivos");
      if (data.archivosImgur && data.archivosImgur.length > 0) {
        data.archivosImgur.forEach(url => {
          const img = document.createElement("img");
          img.src = url;
          img.alt = "Archivo egreso";
          img.style.maxWidth = "120px";
          img.style.maxHeight = "120px";
          img.style.margin = "6px";
          img.style.borderRadius = "7px";
          img.style.cursor = "pointer";
          img.onclick = () => window.abrirModalZoom(url, egresoId, "egreso");
          archivosDiv.appendChild(img);
        });
      } else {
        archivosDiv.innerHTML = "<span style='color:#b5bcc9;'>Sin archivos adjuntos</span>";
      }
      // Expandir/colapsar ventana
      const header = card.querySelector(".egreso-card-header");
      const body = card.querySelector(".egreso-card-body");
      header.onclick = () => {
        const expanded = body.style.display === "block";
        document.querySelectorAll(".egreso-card-body").forEach(b => b.style.display = "none");
        if (!expanded) body.style.display = "block";
      };
      contenedor.appendChild(card);
    });
  } catch (e) {
    await showAlert("Error cargando egresos: " + e.message);
  }
  hideLoader();
}


export async function eliminarEgreso(id) {
  if (await showConfirm("¿Deseas eliminar este egreso?")) {
    try {
      await deleteDoc(doc(db, "egresos", id));
      await showAlert("Egreso eliminado.");
      cargarEgresos();
      if (window.cargarFinanzas) window.cargarFinanzas();
    } catch (e) {
      await showAlert("Error eliminando egreso: " + e.message);
    }
  }
}


export async function subirArchivoEgreso(idEgreso) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    progressContainer.style.display = 'block';
    progressBar.value = 0;
    progressText.textContent = '0%';

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.imgur.com/3/image", true);
    xhr.setRequestHeader("Authorization", "Client-ID 37c14a30903a3e1");

    xhr.upload.onprogress = function(event) {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        progressBar.value = percent;
        progressText.textContent = percent + '%';
      }
    };

    xhr.onload = async function() {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        if (result.success) {
          const url = result.data.link;
          const egresoRef = doc(db, "egresos", idEgreso);
          const egresoSnap = await getDoc(egresoRef);
          const dataActual = egresoSnap.data();
          const archivosActuales = dataActual.archivosImgur || [];
          await updateDoc(egresoRef, {
            archivosImgur: [...archivosActuales, url]
          });
          alert("Archivo subido con éxito.");
          cargarEgresos();
        } else {
          alert("Error subiendo a Imgur.");
        }
      } else {
        alert("Error en la carga: " + xhr.statusText);
      }
      progressContainer.style.display = 'none';
    };

    xhr.onerror = function() {
      alert("Error en la carga.");
      progressContainer.style.display = 'none';
    };

    xhr.send(formData);
  };

  input.click();
}


export function mostrarArchivos(archivos, idEgreso) {
  const contenedor = document.getElementById("contenedor-archivos");
  contenedor.innerHTML = "";
  if (!archivos || archivos.length === 0) {
    contenedor.innerHTML = "<p>No hay archivos para este egreso.</p>";
  } else {
    archivos.forEach((url, index) => {
      const img = document.createElement("img");
      img.src = url;
      img.style.maxWidth = "300px";
      img.style.maxHeight = "300px";
      img.style.border = "1px solid #ccc";
      img.style.borderRadius = "6px";
      img.style.cursor = "pointer";
      img.style.margin = "5px";
      img.alt = "Archivo egreso " + (index + 1);
      img.addEventListener("click", () => window.abrirModalZoom(url, idEgreso));
      contenedor.appendChild(img);
    });
  }
  window._egresoActual = idEgreso;
  document.getElementById("modal-archivos").style.display = "flex";
}

// Nueva función para editar egreso
window.editarEgreso = async function(egresoId) {
  try {
    const egresoRef = doc(db, "egresos", egresoId);
    const egresoSnap = await getDoc(egresoRef);
    if (!egresoSnap.exists()) {
      await showAlert("No se encontró el egreso.");
      return;
    }
    const data = egresoSnap.data();
    // Abre el modal y rellena los campos
    window._egresoEditandoId = egresoId;
    document.getElementById("editar-titulo-egreso").value = data.titulo || "";
    document.getElementById("editar-descripcion-egreso").value = data.descripcion || "";
    document.getElementById("modal-editar-egreso").style.display = "flex";
  } catch (e) {
    await showAlert("Error editando egreso: " + e.message);
  }
};

// Editar egreso desde modal
window.guardarEdicionEgresoFirestore = async function(egresoId, titulo, descripcion) {
  try {
    const egresoRef = doc(db, "egresos", egresoId);
    await updateDoc(egresoRef, { titulo, descripcion });
    await showAlert("Egreso actualizado.");
    cargarEgresos();
  } catch (e) {
    await showAlert("Error editando egreso: " + e.message);
  }
};

// Obtener datos de egreso para el modal
window.getEgresoData = async function(egresoId) {
  const egresoRef = doc(db, "egresos", egresoId);
  const snap = await getDoc(egresoRef);
  return snap.exists() ? snap.data() : {};
};