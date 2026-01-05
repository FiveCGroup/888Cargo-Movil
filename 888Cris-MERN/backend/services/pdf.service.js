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
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Cotización', { underline: true });
      doc.moveDown();

      const data = typeof cotizacionData === 'object' ? cotizacionData : {};
      doc.fontSize(12).text(`Destino: ${data.destino ?? ''}`);
      doc.text(`Valor (USD): ${data.valor_usd ?? ''}`);
      doc.text(`Valor (COP): ${data.valor_cop ?? ''}`);
      doc.moveDown();
      doc.text('Detalle de cálculo:');
      doc.fontSize(10).text(JSON.stringify(data.detalleCalculo ?? {}, null, 2));

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};