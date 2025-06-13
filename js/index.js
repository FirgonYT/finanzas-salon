import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmiMMw8d39YhXJ7JaTnsiZlExiNvoC9rk",
  authDomain: "finanzas-salon.firebaseapp.com",
  projectId: "finanzas-salon",
  storageBucket: "finanzas-salon.firebasestorage.app",
  messagingSenderId: "550307448425",
  appId: "1:550307448425:web:dd755a9ad2a22e009044f8",
  measurementId: "G-MXET3PGMF8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) {
    alert("Escribe correo y contraseña.");
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (e) {
    alert("Error en login: " + e.message);
  }
}

window.login = login;

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  } else {
    // No hay usuario, se queda en index.html (login)
    console.log("No hay usuario autenticado");
  }
});

