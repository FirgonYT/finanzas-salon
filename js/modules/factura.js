// Módulo para generación y formato de facturas
import { obtenerNombreMes } from "../utils.js";

let formatoFacturaPreferido = "pdf";


export function cambiarFormatoFactura() {
  formatoFacturaPreferido = formatoFacturaPreferido === "pdf" ? "jpg" : "pdf";
  document.getElementById("toggle-formato-factura").textContent = `Formato actual: ${formatoFacturaPreferido.toUpperCase()}`;
}


export function generarFacturaConFormato(nombre, fechaISO, monto, registradoPor = "-", mesPagado = "-") {
  const fecha = new Date(fechaISO);
  const hora = fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true });
  const fechaFormateada = fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
  // Convertir mesPagado a nombre si es número
  let mesPagadoNombre = mesPagado;
  if (mesPagado && !isNaN(Number(mesPagado))) {
    mesPagadoNombre = obtenerNombreMes(mesPagado);
  }
  // Limpiar nombre: quitar número y/o identificador al inicio si existen
  let nombreLimpio = nombre.trim();
  const partes = nombreLimpio.split(/\s+/);
  if (partes.length >= 3 && /^\d+\.?$/.test(partes[0]) && /^\d+$/.test(partes[1])) {
    nombreLimpio = partes.slice(2).join(" ");
  }
  generarFactura(nombreLimpio, fechaFormateada, monto, formatoFacturaPreferido, registradoPor, hora, mesPagadoNombre);
}


function generarFactura(nombre, fechaPago, monto, formato = "pdf", registradoPor = "-", hora = "-", mesPagado = "-") {
  // Datos para la factura
  const datos = [
    { label: "Estudiante", value: nombre },
    { label: "Fecha de pago", value: fechaPago },
    { label: "Hora de registro", value: hora },
    { label: "Mes pagado", value: mesPagado },
    { label: "Monto pagado", value: "COP " + monto.toLocaleString("es-CO") },
    { label: "Registrado por", value: registradoPor }
  ];

  if (formato === "pdf") {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Fondo y borde
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(1.2);
    pdf.roundedRect(15, 20, 180, 240, 8, 8, 'S');

    // Título
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(59, 130, 246);
    pdf.text("FACTURA DE PAGO", 105, 38, { align: "center" });

    // Línea decorativa
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(0.8);
    pdf.line(40, 44, 170, 44);

    // Datos
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    let y = 60;
    datos.forEach(({ label, value }) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(`${label}:`, 35, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${value}`, 80, y);
      y += 16;
    });

    // Pie de página
    pdf.setFontSize(11);
    pdf.setTextColor(120);
    pdf.text("Documento generado automáticamente - Finanzas Salón", 105, 250, { align: "center" });

    pdf.save(`factura_${nombre}.pdf`);
  } else {
    // JPG/Canvas
    const ancho = 1000;
    const alto = 700;
    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");

    // Fondo
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, ancho, alto);

    // Borde
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(40, 40);
    ctx.lineTo(ancho - 40, 40);
    ctx.lineTo(ancho - 40, alto - 40);
    ctx.lineTo(40, alto - 40);
    ctx.closePath();
    ctx.stroke();

    // Título
    ctx.font = "bold 38px Arial";
    ctx.fillStyle = "#2563eb";
    ctx.textAlign = "center";
    ctx.fillText("FACTURA DE PAGO", ancho / 2, 100);

    // Línea decorativa
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(180, 120);
    ctx.lineTo(ancho - 180, 120);
    ctx.stroke();

    // Datos
    ctx.font = "bold 26px Arial";
    ctx.fillStyle = "#232b3e";
    ctx.textAlign = "left";
    let y = 180;
    datos.forEach(({ label, value }) => {
      ctx.font = "bold 22px Arial";
      ctx.fillStyle = "#3b82f6";
      ctx.fillText(label + ":", 120, y);
      ctx.font = "22px Arial";
      ctx.fillStyle = "#232b3e";
      ctx.fillText(value, 340, y);
      y += 48;
    });

    // Pie de página
    ctx.font = "18px Arial";
    ctx.fillStyle = "#888";
    ctx.textAlign = "center";
    ctx.fillText("Documento generado automáticamente - Finanzas Salón", ancho / 2, alto - 60);

    // Descargar
    const link = document.createElement("a");
    link.download = `factura_${nombre}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 1.0);
    link.click();
  }
}
