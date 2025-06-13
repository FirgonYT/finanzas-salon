export function formatearMontoCOP(valor) {
  if (typeof valor !== "number") valor = Number(valor) || 0;
  return "$" + valor.toLocaleString("es-CO");
}


export function obtenerNombreMes(mesNumero) {
  const meses = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo",
    "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const num = parseInt(mesNumero, 10);
  return meses[num] || "Mes desconocido";
}


/**
 * Muestra una alerta bonita (modal) en vez de alert()
 * @param {string|any} mensaje
 * @returns {Promise<void>}
 */
export function showAlert(mensaje) {
  // Asegura que mensaje siempre sea string y nunca null/undefined
  if (mensaje == null) mensaje = "";
  if (typeof mensaje !== "string") {
    if (mensaje && typeof mensaje.message === "string") mensaje = mensaje.message;
    else mensaje = String(mensaje ?? "");
  }
  // Log para depuración
  try {
    // Si por alguna razón el mensaje sigue sin ser string, conviértelo
    mensaje = String(mensaje);
  } catch {
    mensaje = "Ocurrió un error inesperado.";
  }
  // Loguea el mensaje y el stack para depuración
  try {
    console.log("[showAlert] mensaje:", mensaje);
    // Captura el stack para saber desde dónde se llamó
    console.trace("[showAlert] stack trace");
  } catch {}
  return new Promise(resolve => {
    const modal = document.getElementById("alert-modal");
    const msg = document.getElementById("alert-modal-message");
    const ok = document.getElementById("alert-modal-ok");
    const cancel = document.getElementById("alert-modal-cancel");
    msg.textContent = mensaje;
    ok.style.display = "inline-block";
    cancel.style.display = "none";
    modal.style.display = "flex";
    ok.onclick = () => {
      modal.style.display = "none";
      resolve();
    };
    cancel.onclick = null;
  });
}


/**
 * Muestra una confirmación bonita (modal) en vez de confirm()
 * @param {string} mensaje
 * @returns {Promise<boolean>}
 */
export function showConfirm(mensaje) {
  return new Promise(resolve => {
    const modal = document.getElementById("alert-modal");
    const msg = document.getElementById("alert-modal-message");
    const ok = document.getElementById("alert-modal-ok");
    const cancel = document.getElementById("alert-modal-cancel");
    msg.textContent = mensaje;
    ok.style.display = "inline-block";
    cancel.style.display = "inline-block";
    modal.style.display = "flex";
    ok.onclick = () => {
      modal.style.display = "none";
      resolve(true);
    };
    cancel.onclick = () => {
      modal.style.display = "none";
      resolve(false);
    };
  });
}



