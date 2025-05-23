// js/egresos.js
import { app } from './firebase-config.js';
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const db = getFirestore(app);

export async function registrarEgreso(monto, motivo) {
  if (monto <= 0 || !motivo) throw new Error("Datos inválidos egreso");
  await addDoc(collection(db, "egresos"), {
    monto,
    motivo,
    fecha: new Date()
  });
}
