// js/estudiantes.js
import { app } from './firebase-config.js';
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const db = getFirestore(app);

export async function agregarEstudiante(nombre) {
  if (!nombre) throw new Error("Nombre vacío");
  await addDoc(collection(db, "estudiantes"), {
    nombre,
    creadoEn: new Date()
  });
}

export async function obtenerEstudiantes() {
  const estudiantesSnapshot = await getDocs(collection(db, "estudiantes"));
  return estudiantesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
