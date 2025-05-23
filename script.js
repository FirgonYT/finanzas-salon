// CONFIGURA TU FIREBASE ACÁ
const firebaseConfig = {
  apiKey: "AIzaSyBmiMMw8d39YhXJ7JaTnsiZlExiNvoC9rk",
  authDomain: "finanzas-salon.firebaseapp.com",
  projectId: "finanzas-salon",
  storageBucket: "finanzas-salon.firebasestorage.app",
  messagingSenderId: "550307448425",
  appId: "1:550307448425:web:dd755a9ad2a22e009044f8",
  measurementId: "G-MXET3PGMF8"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 🔐 LOGIN
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => window.location.href = "dashboard.html")
    .catch(error => alert("Error: " + error.message));
}

// 🚪 LOGOUT
function logout() {
  auth.signOut().then(() => window.location.href = "index.html");
}

// ➕ REGISTRAR INGRESO
function registrarIngreso() {
  const monto = document.getElementById('ingreso-monto').value;
  const descripcion = document.getElementById('ingreso-desc').value;

  if (!monto || !descripcion) {
    alert("Por favor completa todos los campos de ingreso.");
    return;
  }

  db.collection("ingresos").add({
    fecha: new Date().toLocaleDateString(),
    monto: parseFloat(monto),
    descripcion: descripcion
  }).then(() => {
    alert("Ingreso registrado");
    document.getElementById('ingreso-monto').value = '';
    document.getElementById('ingreso-desc').value = '';
  });
}

// ➖ REGISTRAR EGRESO
function registrarEgreso() {
  const monto = document.getElementById('egreso-monto').value;
  const motivo = document.getElementById('egreso-desc').value;

  if (!monto || !motivo) {
    alert("Por favor completa todos los campos de egreso.");
    return;
  }

  db.collection("egresos").add({
    fecha: new Date().toLocaleDateString(),
    monto: parseFloat(monto),
    motivo: motivo
  }).then(() => {
    alert("Egreso registrado");
    document.getElementById('egreso-monto').value = '';
    document.getElementById('egreso-desc').value = '';
  });
}

// 👤 VERIFICAR SESIÓN EN DASHBOARD
auth.onAuthStateChanged((user) => {
  if (!user && window.location.pathname.includes("dashboard.html")) {
    window.location.href = "index.html";
  }
});

// 🧭 MOSTRAR SECCIÓN ACTIVA
function mostrar(id) {
  const secciones = document.querySelectorAll("main section");
  secciones.forEach(sec => sec.style.display = "none");
  const activa = document.getElementById(id);
  if (activa) {
    activa.style.display = "block";
  }
}
