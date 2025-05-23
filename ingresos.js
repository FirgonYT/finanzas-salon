// js/ingresos.js
import { app } from './firebase-config.js';
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const db = getFirestore(app);

export async function registrarIngreso(monto, descripcion) {
  if (monto <= 0 || !descripcion) throw new Error("Datos inválidos ingreso");
  await addDoc(collection(db, "ingresos"), {
    monto,
    descripcion,
    fecha: new Date()
  });
}
