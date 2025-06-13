import { db } from "../firebase.js";
import {
  collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, getDoc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { showAlert, showConfirm, formatearMontoCOP } from "../utils.js";

// Loader helpers
function showLoader() {
  document.getElementById("loader-overlay")?.style.setProperty("display", "flex");
}


function hideLoader() {
  document.getElementById("loader-overlay")?.style.setProperty("display", "none");
}


// --- Modal helpers ---
function abrirModalEvento(evento = null) {
  document.getElementById("modal-evento").style.display = "flex";
  document.getElementById("form-evento").reset();
  document.getElementById("evento-id").value = evento?.id || "";
  document.getElementById("evento-titulo").value = evento?.title || "";
  document.getElementById("evento-fecha").value = evento?.date ? evento.date.substring(0,10) : "";
  document.getElementById("evento-presupuesto").value = evento?.presupuesto || "";
  document.getElementById("evento-materiales").value = (evento?.materiales || []).join('\n');
  document.getElementById("modal-evento-titulo").textContent = evento ? "Editar Evento" : "Nuevo Evento";
  document.getElementById("btn-eliminar-evento").style.display = evento ? "inline-block" : "none";
  window._eventoEditando = evento;
}
window.abrirModalEvento = abrirModalEvento;


function cerrarModalEvento() {
  document.getElementById("modal-evento").style.display = "none";
  window._eventoEditando = null;
}
window.cerrarModalEvento = cerrarModalEvento;


// --- FullCalendar ---
let calendar;


async function cargarEventos() {
  const eventosSnapshot = await getDocs(query(collection(db, "eventos"), orderBy("createdAt", "asc")));
  return eventosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}


export async function inicializarCalendario() {
  showLoader();
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;
  if (window.calendar?.destroy) window.calendar.destroy();

  const eventos = await cargarEventos();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: eventos.map(ev => ({
      id: ev.id,
      // Cambia el formato del presupuesto a moneda
      title: ev.title + (ev.presupuesto ? ` (Presupuesto: ${formatearMontoCOP(ev.presupuesto)})` : ""),
      date: ev.date,
      presupuesto: ev.presupuesto || 0,
      raw: ev
    })),
    selectable: true,
    dateClick: function(info) {
      abrirModalEvento({ date: info.dateStr });
    },
    eventClick: function(info) {
      // Cargar datos del evento real
      const evento = info.event.extendedProps.raw || {
        id: info.event.id,
        title: info.event.title,
        date: info.event.startStr,
        presupuesto: info.event.extendedProps.presupuesto || 0
      };
      abrirModalEvento(evento);
    }
  });

  calendar.render();
  window.calendar = calendar;
  hideLoader();
}


// --- Guardar evento (nuevo o editar) ---
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-evento");
  if (form) {
    form.onsubmit = async function(e) {
      e.preventDefault();
      showLoader();
      const id = document.getElementById("evento-id").value;
      const title = document.getElementById("evento-titulo").value.trim();
      const date = document.getElementById("evento-fecha").value;
      const presupuesto = Number(document.getElementById("evento-presupuesto").value) || 0;
      const materialesRaw = document.getElementById("evento-materiales").value;
      const materiales = materialesRaw
        .split('\n')
        .map(x => x.trim())
        .filter(x => x.length > 0);

      if (!title || !date) {
        await showAlert("Completa el título y la fecha.");
        hideLoader();
        return;
      }

      try {
        let eventoRef, eventoData;
        if (id) {
          // Editar evento
          eventoRef = doc(db, "eventos", id);
          await updateDoc(eventoRef, { title, date, presupuesto, materiales });
          eventoData = { id, title, date, presupuesto, materiales };
        } else {
          // Nuevo evento
          const docRef = await addDoc(collection(db, "eventos"), {
            title,
            date,
            presupuesto,
            materiales,
            createdAt: new Date()
          });
          eventoData = { id: docRef.id, title, date, presupuesto, materiales };
        }

        // Si hay presupuesto, crea egreso (solo si es nuevo o si presupuesto cambió)
        if (presupuesto > 0) {
          // Verifica si ya existe un egreso para este evento
          let egresoYaExiste = false;
          if (id) {
            const egresosSnapshot = await getDocs(query(collection(db, "egresos")));
            egresosSnapshot.forEach(docEgreso => {
              const data = docEgreso.data();
              if (data.eventoId === eventoData.id) egresoYaExiste = true;
            });
          }
          if (!egresoYaExiste) {
            await addDoc(collection(db, "egresos"), {
              descripcion: `Presupuesto para evento: ${title}`,
              monto: presupuesto,
              fecha: new Date(date).toISOString(),
              eventoId: eventoData.id
            });
          } else if (id) {
            // Si ya existe, actualiza el monto si cambió
            const egresosSnapshot = await getDocs(query(collection(db, "egresos")));
            egresosSnapshot.forEach(async docEgreso => {
              const data = docEgreso.data();
              if (data.eventoId === eventoData.id && data.monto !== presupuesto) {
                await updateDoc(doc(db, "egresos", docEgreso.id), { monto: presupuesto });
              }
            });
          }
        }

        cerrarModalEvento();
        await inicializarCalendario();
        if (window.cargarEgresos) window.cargarEgresos();
      } catch (err) {
        await showAlert("Error guardando evento: " + err.message);
      }
      hideLoader();
    };
  }
});


// --- Eliminar evento desde el modal ---
window.eliminarEventoModal = async function() {
  const id = document.getElementById("evento-id").value;
  if (!id) return;
  if (!(await showConfirm("¿Seguro que deseas eliminar este evento?"))) return;
  showLoader();
  try {
    await deleteDoc(doc(db, "eventos", id));
    // Elimina egreso asociado si existe
    const egresosSnapshot = await getDocs(query(collection(db, "egresos")));
    egresosSnapshot.forEach(async docEgreso => {
      const data = docEgreso.data();
      if (data.eventoId === id) {
        await deleteDoc(doc(db, "egresos", docEgreso.id));
      }
    });
    cerrarModalEvento();
    await inicializarCalendario();
    if (window.cargarEgresos) window.cargarEgresos();
    // Actualiza la sección de compras inmediatamente después de eliminar
    if (window.cargarCompras) await window.cargarCompras();
  } catch (err) {
    await showAlert("Error eliminando evento: " + err.message);
  }
  hideLoader();
};


export async function agregarEvento() {
  abrirModalEvento();
}


export async function eliminarEvento(event) {
  // No se usa, la eliminación es desde el modal
}

// Nueva función para obtener eventos con materiales
export async function obtenerEventosConMateriales() {
  // Forzar recarga de eventos desde Firestore
  const eventosSnapshot = await getDocs(query(collection(db, "eventos"), orderBy("date", "desc")));
  const eventos = [];
  window.eventos = []; // <-- Asegura que window.eventos siempre esté actualizado
  eventosSnapshot.forEach(docSnap => {
    const data = docSnap.data();
    // Normaliza materiales: si es string, conviértelo a array
    let materiales = [];
    if (Array.isArray(data.materiales)) {
      materiales = data.materiales;
    } else if (typeof data.materiales === "string" && data.materiales.trim() !== "") {
      materiales = data.materiales.split("\n").map(x => x.trim()).filter(x => x.length > 0);
    }
    const eventoObj = { id: docSnap.id, ...data, materiales };
    window.eventos.push(eventoObj); // Actualiza el array global de eventos
    if (materiales.length > 0) {
      eventos.push(eventoObj);
    }
  });
  // Cache para mostrar materiales rápido
  window._eventosMaterialesCache = eventos;
  return eventos;
}
window.obtenerEventosConMateriales = obtenerEventosConMateriales;
