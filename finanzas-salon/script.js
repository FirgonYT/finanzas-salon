// CONFIGURA TU FIREBASE ACÁ
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// LOGIN
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => window.location.href = "dashboard.html")
    .catch(error => alert("Error: " + error.message));
}

// LOGOUT
function logout() {
  auth.signOut().then(() => window.location.href = "index.html");
}

// REGISTRAR INGRESO
function registrarIngreso() {
  const monto = document.getElementById('ingreso-monto').value;
  const descripcion = document.getElementById('ingreso-desc').value;
  db.collection("ingresos").add({
    fecha: new Date().toLocaleDateString(),
    monto: parseFloat(monto),
    descripcion: descripcion
  }).then(() => alert("Ingreso registrado"));
}

// REGISTRAR EGRESO
function registrarEgreso() {
  const monto = document.getElementById('egreso-monto').value;
  const motivo = document.getElementById('egreso-desc').value;
  db.collection("egresos").add({
    fecha: new Date().toLocaleDateString(),
    monto: parseFloat(monto),
    motivo: motivo
  }).then(() => alert("Egreso registrado"));
}
