import { db, auth } from "../firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { cargarEstudiantes } from "./estudiantes.js";

export let usuarioActual = null;


export function logout() {
  signOut(auth).then(() => window.location.href = "index.html");
}


export function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      usuarioActual = user;
      const userDocRef = doc(db, "usuarios", user.email);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        usuarioActual.nombre = userSnap.data().nombre;
      } else {
        const yaRegistrado = localStorage.getItem("nombreRegistrado_" + user.email);
        if (!yaRegistrado) {
          let nombre = prompt("Bienvenido. Ingresa tu nombre para identificar tus registros:");
          while (!nombre || nombre.length < 2) {
            nombre = prompt("Nombre inválido. Intenta de nuevo:");
          }
          await setDoc(userDocRef, { nombre });
          usuarioActual.nombre = nombre;
          localStorage.setItem("nombreRegistrado_" + user.email, "true");
          alert("Tu nombre ha sido registrado como: " + nombre);
        } else {
          alert("No se encontró el nombre en Firestore, pero ya lo habías registrado.");
          await signOut(auth);
        }
      }
      const span = document.getElementById("usuario-nombre-visible");
      if (span) {
        span.textContent = usuarioActual.nombre || usuarioActual.email || "Desconocido";
      }
      cargarEstudiantes();
    } else {
      usuarioActual = null;
      window.location.href = "index.html";
    }
  });

  // Cerrar sesión al salir o recargar la página
  window.addEventListener('beforeunload', async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // Silenciar error
    }
  });

  // Cerrar sesión por inactividad
  let timeoutID;
  function cerrarSesionPorInactividad() {
    alert("Sesión cerrada por inactividad.");
    signOut(auth).then(() => window.location.href = "index.html");
  }
  function reiniciarTemporizador() {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(cerrarSesionPorInactividad, 1200000); // 20 minutos
  }
  ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(evento => {
    document.addEventListener(evento, reiniciarTemporizador);
  });
  reiniciarTemporizador();
}
