// js/pagos.js
import { app } from './firebase-config.js';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const db = getFirestore(app);

export async function registrarPago(idEstudiante, monto) {
  if (!idEstudiante || monto <= 0) throw new Error("Datos inválidos para pago");
  const fechaPago = new Date();
  const mes = fechaPago.getFullYear() + "-" + String(fechaPago.getMonth() + 1).padStart(2, "0");

  await addDoc(collection(db, "pagos"), {
    idEstudiante,
    monto,
    fechaPago,
    mes
  });
}

export async function obtenerPagosPorEstudianteMes(idEstudiante, mes) {
  const pagosQuery = query(collection(db, "pagos"),
    where("idEstudiante", "==", idEstudiante),
    where("mes", "==", mes),
    orderBy("fechaPago", "desc")
  );
  const pagosSnapshot = await getDocs(pagosQuery);
  return pagosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function eliminarPago(idPago) {
  await deleteDoc(doc(db, "pagos", idPago));
}
