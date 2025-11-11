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

  // Leemos todos los pagos y los organizamos por estudiante y mes
  const pagosSnapshot = await getDocs(collection(db, "pagos"));
  const pagosPorEstudianteTotal = {}; // total (para modo mensual o all)
  const pagosPorEstudiantePorMes = {}; // { idEst: { '05': 10000, '06': 15000, ... } }
  pagosSnapshot.forEach(doc => {
    const data = doc.data();
    const idEst = data.idEstudiante || "";
    const monto = Number(data.monto) || 0;
    const mes = data.mesPagado || "";
    if (!pagosPorEstudianteTotal[idEst]) pagosPorEstudianteTotal[idEst] = 0;
    pagosPorEstudianteTotal[idEst] += monto;
    if (!pagosPorEstudiantePorMes[idEst]) pagosPorEstudiantePorMes[idEst] = {};
    if (!pagosPorEstudiantePorMes[idEst][mes]) pagosPorEstudiantePorMes[idEst][mes] = 0;
    pagosPorEstudiantePorMes[idEst][mes] += monto;
  });

  try {
    const ExcelJSLib = (typeof ExcelJS !== "undefined") ? ExcelJS : (window && window.ExcelJS ? window.ExcelJS : null);
    if (!ExcelJSLib) {
      await showAlert("No se encontró la librería ExcelJS. Asegúrate de que esté cargada en dashboard.html.");
      return;
    }

    const workbook = new ExcelJSLib.Workbook();
    const sheet = workbook.addWorksheet("Informe Estudiantes");

    const esTodo = mesSeleccionado === "all";

    // Si es modo "all", construimos columnas dinámicas desde mayo hasta el mes actual
    let mesesToShow = [];
    if (esTodo) {
      const start = 5; // mayo
      const today = new Date();
      const end = Math.max(start, today.getMonth() + 1); // mes actual
      for (let m = start; m <= end; m++) {
        const mm = String(m).padStart(2, "0");
        mesesToShow.push(mm);
      }
      // Columnas: N°, Identificador, Nombre, <meses...>, Falta por pagar
      const cols = [
        { header: "N°", key: "numero", width: 5 },
        { header: "Identificador", key: "identificador", width: 15 },
        { header: "Nombre", key: "nombre", width: 40 }
      ];
      mesesToShow.forEach(m => {
        cols.push({ header: obtenerNombreMes(m) || m, key: `mes_${m}`, width: 18 });
      });
      cols.push({ header: "Falta por pagar", key: "falta_total", width: 18 });
      sheet.columns = cols;
    } else {
      // Modo mensual: mantenemos comportamiento anterior
      sheet.columns = [
        { header: "N°", key: "numero", width: 5 },
        { header: "Identificador", key: "identificador", width: 15 },
        { header: "Nombre", key: "nombre", width: 40 },
        { header: "Estado", key: "estado", width: 25 },
        { header: "Monto Pagado", key: "montoPagado", width: 18 },
        { header: "Valor a Pagar", key: "valorAPagar", width: 18 }
      ];
    }

    // Encabezado estilo
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    // Recorremos estudiantes y rellenamos
    estudiantesTablaCache.forEach((est, index) => {
      const idEst = est.id || "";
      const nombreRaw = (est.nombre || "").trim();
      const partes = nombreRaw.split(/\s+/);
      let numero = "", identificador = "", nombreCompleto = nombreRaw;
      if (partes.length >= 3) {
        numero = partes[0].replace(/\./, "");
        identificador = partes[1];
        nombreCompleto = partes.slice(2).join(" ");
      }

      if (esTodo) {
        // Construir fila con cada mes y calcular faltantes
        const rowObj = { numero, identificador, nombre: nombreCompleto };
        let faltaTotal = 0;
        const mesesFaltantes = [];
        mesesToShow.forEach(m => {
          const paid = (pagosPorEstudiantePorMes[idEst] && pagosPorEstudiantePorMes[idEst][m]) ? Number(pagosPorEstudiantePorMes[idEst][m]) : 0;
          rowObj[`mes_${m}`] = paid;
          const faltaMes = Math.max(15000 - paid, 0);
          if (faltaMes > 0) mesesFaltantes.push(obtenerNombreMes(m) || m);
          faltaTotal += faltaMes;
        });
        rowObj.falta_total = faltaTotal;
        // ya no se incluye meses_faltantes (columna removida)

        const row = sheet.addRow(rowObj);

        // Color: verde si faltaTotal === 0, amarillo si hay faltantes
        const fillColor = (faltaTotal === 0) ? "FFCCFFCC" : "FFFFF0CC";
        row.eachCell((cell, colNumber) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
          // Alinear montos a la derecha (las columnas de meses y falta_total)
          const lastMoneyCol = 3 + mesesToShow.length + 1; // índice de "Falta por pagar"
          const colIsMoney = colNumber >= 4 && colNumber <= lastMoneyCol;
          cell.alignment = { vertical: 'middle', horizontal: colIsMoney ? 'right' : 'center' };
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });

        // Aplicar formato numérico a columnas de meses + falta_total
        const firstMesColIndex = 4;
        for (let i = 0; i < mesesToShow.length; i++) {
          row.getCell(firstMesColIndex + i).numFmt = '"$"#,##0;[Red]\-"$"#,##0';
        }
        row.getCell(firstMesColIndex + mesesToShow.length).numFmt = '"$"#,##0;[Red]\-"$"#,##0'; // falta_total
        row.height = 18;
      } else {
        // Modo mensual (comportamiento anterior, calculando solo el mes seleccionado)
        const montoPagado = ((pagosPorEstudiantePorMes[idEst] && pagosPorEstudiantePorMes[idEst][mesSeleccionado]) ? Number(pagosPorEstudiantePorMes[idEst][mesSeleccionado]) : 0);
        const deuda = Math.max(15000 - montoPagado, 0);
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
        row.getCell(5).numFmt = '"$"#,##0;[Red]\-"$"#,##0';
        row.getCell(6).numFmt = '"$"#,##0;[Red]\-"$"#,##0';
        row.height = 18;
      }
    });

    // Generar y descargar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const mesNombre = esTodo ? "Todos_los_meses" : (obtenerNombreMes(mesSeleccionado) || mesSeleccionado);
    a.download = `Informe_Estudiantes_Mes_${mesNombre}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error generando informe Excel:", err);
    await showAlert("Ocurrió un error al generar el informe. Revisa la consola para más detalles.");
  }
}
