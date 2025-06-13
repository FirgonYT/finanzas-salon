import { db } from "../firebase.js";
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { estudiantesTablaCache } from "./estudiantes.js";
import { showAlert, obtenerNombreMes } from "../utils.js";


export async function descargarInformeExcel(mesSeleccionado) {
  if (!mesSeleccionado) {
    // Compatibilidad: si no se pasa, intenta tomar del select antiguo (por si acaso)
    const select = document.getElementById("mes-informe");
    mesSeleccionado = select ? select.value : "";
  }
  if (!mesSeleccionado) {
    await showAlert("Selecciona un mes para el informe.");
    return;
  }
  const pagosSnapshot = await getDocs(collection(db, "pagos"));
  const pagosPorEstudiante = {};
  pagosSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.mesPagado === mesSeleccionado) {
      if (!pagosPorEstudiante[data.idEstudiante]) {
        pagosPorEstudiante[data.idEstudiante] = 0;
      }
      pagosPorEstudiante[data.idEstudiante] += data.monto;
    }
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Informe Estudiantes");
  sheet.columns = [
    { header: "N°", key: "numero", width: 5 },
    { header: "Identificador", key: "identificador", width: 15 },
    { header: "Nombre", key: "nombre", width: 40 },
    { header: "Estado", key: "estado", width: 25 },
    { header: "Monto Pagado", key: "montoPagado", width: 18 },
    { header: "Valor a Pagar", key: "valorAPagar", width: 18 }
  ];
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' }
    };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  estudiantesTablaCache.forEach((est, index) => {
    const montoPagado = pagosPorEstudiante[est.id] || 0;
    const deuda = Math.max(15000 - montoPagado, 0);
    const partes = est.nombre.trim().split(/\s+/);
    let numero = "", identificador = "", nombreCompleto = est.nombre;
    if (partes.length >= 3) {
      numero = partes[0].replace(/\./, "");
      identificador = partes[1];
      nombreCompleto = partes.slice(2).join(" ");
    }
    let estadoTexto = "No al día";
    if (montoPagado >= 15000) estadoTexto = "Al día";
    else if (montoPagado > 0) estadoTexto = "Al día con menor pago";
    const row = sheet.addRow({
      numero, identificador, nombre: nombreCompleto,
      estado: estadoTexto, montoPagado, valorAPagar: deuda
    });
    let fillColor = "FFFFFFFF";
    if (montoPagado === 0) fillColor = "FFFFCCCC";
    else if (montoPagado < 15000) fillColor = "FFFFF0CC";
    else fillColor = "FFCCFFCC";
    row.eachCell((cell, colNumber) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
      cell.alignment = { vertical: 'middle', horizontal: colNumber >= 5 ? 'right' : 'center' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });
    row.getCell("montoPagado").numFmt = '"$"#,##0;[Red]\-"$"#,##0';
    row.getCell("valorAPagar").numFmt = '"$"#,##0;[Red]\-"$"#,##0';
    row.height = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const mesNombre = obtenerNombreMes(mesSeleccionado) || mesSeleccionado;
  a.download = `Informe_Estudiantes_Mes_${mesNombre}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
