import { db } from "../firebase.js";
import {
  collection, addDoc, getDocs, query, orderBy, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { formatearMontoCOP, showAlert, showConfirm } from "../utils.js";

export async function registrarExtra(titulo, descripcion, fecha, monto) {
  try {
    await addDoc(collection(db, "extras"), {
      titulo,
      descripcion,
      fecha,
      monto
    });
    // Cerrar el modal de agregar extra antes de mostrar la alerta
    const modal = document.getElementById("modal-extra");
    if (modal) modal.style.display = "none";
    await showAlert("Ingreso extra registrado.");
    cargarExtras();
    if (window.cargarFinanzas) window.cargarFinanzas();
    return true; // Éxito
  } catch (e) {
    await showAlert("Error registrando ingreso extra: " + e.message);
    return false; // Error
  }
}

export async function cargarExtras() {
  const contenedor = document.getElementById("lista-extras");
  if (!contenedor) return;
  contenedor.innerHTML = "";
  try {
    const extrasSnapshot = await getDocs(query(collection(db, "extras"), orderBy("fecha", "desc")));
    if (extrasSnapshot.empty) {
      contenedor.innerHTML = "<div style='color:#b5bcc9;'>No hay ingresos extras registrados.</div>";
      return;
    }
    extrasSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const extraId = docSnap.id;
      const fecha = data.fecha ? new Date(data.fecha).toLocaleString() : "-";
      const card = document.createElement("div");
      card.className = "egreso-card";
      card.innerHTML = `
        <div class="egreso-card-header" tabindex="0">
          <div class="egreso-card-title">${data.titulo || "(Sin título)"}</div>
          <div class="egreso-card-monto">${formatearMontoCOP(data.monto)}</div>
          <div class="egreso-card-fecha">${fecha}</div>
        </div>
        <div class="egreso-card-body" style="display:none;">
          <div class="egreso-card-desc"><strong>Descripción:</strong> ${data.descripcion || ""}</div>
          <div class="egreso-card-actions">
            <button class="boton-eliminar-egreso" onclick="eliminarExtra('${extraId}')">Eliminar</button>
          </div>
        </div>
      `;
      const header = card.querySelector(".egreso-card-header");
      const body = card.querySelector(".egreso-card-body");
      header.onclick = () => {
        const expanded = body.style.display === "block";
        document.querySelectorAll("#lista-extras .egreso-card-body").forEach(b => b.style.display = "none");
        if (!expanded) body.style.display = "block";
      };
      contenedor.appendChild(card);
    });
  } catch (e) {
    await showAlert("Error cargando ingresos extras: " + e.message);
  }
}

export async function eliminarExtra(id) {
  if (await showConfirm("¿Deseas eliminar este ingreso extra?")) {
    try {
      await deleteDoc(doc(db, "extras", id));
      await showAlert("Ingreso extra eliminado.");
      cargarExtras();
      if (window.cargarFinanzas) window.cargarFinanzas();
    } catch (e) {
      await showAlert("Error eliminando ingreso extra: " + e.message);
    }
  }
}

window.eliminarExtra = eliminarExtra;


