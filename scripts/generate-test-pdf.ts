import fs from 'node:fs';
import path from 'node:path';

function generateTestPdf() {
  const targetBytes = 9.8 * 1024 * 1024; // ~9.8 MB
  const header = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 5 0 R >>\nstream\nBT /F1 12 Tf 100 700 Td (PDF Test 10MB) Tj ET\nendstream\nendobj\n5 0 obj\n');
  
  const footer = Buffer.from('\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \n0000000300 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n350\n%%EOF\n');

  const paddingSize = targetBytes - header.length - footer.length;
  const padding = Buffer.alloc(Math.max(0, paddingSize), 32); // spaces

  const pdfBuffer = Buffer.concat([header, padding, footer]);
  const outputPath = path.join(process.cwd(), 'test-10mb.pdf');
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`Generated PDF at ${outputPath} with size: ${(pdfBuffer.length / (1024 * 1024)).toFixed(2)} MB (${pdfBuffer.length} bytes)`);
}

generateTestPdf();
