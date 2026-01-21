import PDFDocument from 'pdfkit';

export const generarPDFBuffer = async (cotizacionData = {}) => {
  // import dinámico para evitar que el servidor falle si pdfkit no está instalado
  let PDFDocument = null;
  try {
    // compatible con ESM dinámico en Node moderno
    // eslint-disable-next-line import/no-extraneous-dependencies
    const mod = await import('pdfkit');
    PDFDocument = mod.default || mod;
  } catch (e) {
    PDFDocument = null;
  }

  if (!PDFDocument) {
    // fallback: retornar un buffer con texto plano para que la funcionalidad siga operando
    const texto = `Cotización\n\n${JSON.stringify(cotizacionData, null, 2)}`;
    return Buffer.from(texto, 'utf8');
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const data = typeof cotizacionData === 'object' ? cotizacionData : {};
      const detalle = data.detalleCalculo || {};
      const fecha = new Date().toLocaleDateString('es-CO');
      const tipoEnvio = data.tipo === 'aereo' ? 'Aéreo' : 'Marítimo';
      const destino = data.destino || '-';
      const tiempo = data.tiempo_estimado || '-';
      const trm = data.trm ?? '-';

      const formatUSD = (v) => {
        if (v === null || v === undefined || v === '') return '-';
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(v));
      };
      const formatCOP = (v) => {
        if (v === null || v === undefined || v === '') return '-';
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(v));
      };
      const formatNumber = (v, digits = 2) => {
        if (v === null || v === undefined || v === '') return '-';
        const n = Number(v);
        return Number.isFinite(n) ? n.toFixed(digits) : '-';
      };

      // Encabezado
      doc.rect(0, 0, doc.page.width, 110).fill('#0f3d6e');
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('888Cargo', 48, 32);
      doc.fontSize(12).font('Helvetica').text('Cotización informativa', 48, 60);
      doc.text(`Fecha: ${fecha}`, 400, 60, { align: 'right' });

      doc.moveDown(3.5);
      doc.fillColor('#111827');

      // Sección resumen
      doc.font('Helvetica-Bold').fontSize(12).text('Resumen', 48);
      doc.moveDown(0.5);
      doc.font('Helvetica');
      doc.text(`Tipo de envío: ${tipoEnvio}`);
      doc.text(`Destino: ${destino}`);
      doc.text(`Tiempo estimado: ${tiempo}`);
      doc.text(`TRM usada: ${trm}`);

      // Totales destacados
      doc.moveDown(0.8);
      const boxTop = doc.y;
      doc.rect(48, boxTop, 500, 70).fill('#eef6ff');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('Valor total', 60, boxTop + 12);
      doc.fontSize(16).text(`${formatUSD(data.valor_usd)}`, 60, boxTop + 32);
      doc.fontSize(12).font('Helvetica').text(`${formatCOP(data.valor_cop)}`, 300, boxTop + 36);
      doc.moveDown(5);
      doc.fillColor('#111827');

      // Medidas
      doc.font('Helvetica-Bold').fontSize(12).text('Medidas y peso', 48);
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(11);
      doc.text(`Largo: ${formatNumber(data.largo_cm, 2)} cm`);
      doc.text(`Ancho: ${formatNumber(data.ancho_cm, 2)} cm`);
      doc.text(`Alto: ${formatNumber(data.alto_cm, 2)} cm`);
      doc.text(`Peso real: ${formatNumber(data.peso_kg, 2)} kg`);
      doc.text(`Volumen: ${formatNumber(data.volumen_m3, 3)} m³`);

      // Información de cálculo (compacta)
      doc.moveDown(0.8);
      doc.font('Helvetica-Bold').fontSize(12).text('Datos de cálculo', 48);
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(11);
      doc.text(`Tarifa: ${formatUSD(detalle.tarifaUSD)}`);
      doc.text(`Peso volumétrico: ${formatNumber(detalle.pesoVolumetrico, 2)} kg`);
      if (detalle.pesoCobrable !== undefined) {
        doc.text(`Peso cobrable: ${formatNumber(detalle.pesoCobrable, 2)} kg`);
      }
      if (detalle.volumenCobrable !== undefined) {
        doc.text(`Volumen cobrable: ${formatNumber(detalle.volumenCobrable, 3)} m³`);
      }

      // Nota legal corta
      doc.moveDown(1.2);
      doc.fontSize(9).fillColor('#6b7280').text(
        'Esta cotización es informativa y puede variar según verificación de medidas, peso real y condiciones del mercado.',
        { width: 500, align: 'left' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};