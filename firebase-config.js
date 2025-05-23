// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmiMMw8d39YhXJ7JaTnsiZlExiNvoC9rk",
  authDomain: "finanzas-salon.firebaseapp.com",
  projectId: "finanzas-salon",
  storageBucket: "finanzas-salon.firebasestorage.app",
  messagingSenderId: "550307448425",
  appId: "1:550307448425:web:dd755a9ad2a22e009044f8",
  measurementId: "G-MXET3PGMF8"
};

export const app = initializeApp(firebaseConfig);
