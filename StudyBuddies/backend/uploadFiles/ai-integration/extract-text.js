const fs = require('fs');
const mammoth = require('mammoth');

async function extractPdfText(buffer) {
  const pdfParseModule = require('pdf-parse');

  if (typeof pdfParseModule === 'function') {
    const pdfData = await pdfParseModule(buffer);
    return pdfData.text;
  }

  if (typeof pdfParseModule?.PDFParse === 'function') {
    const parser = new pdfParseModule.PDFParse({ data: buffer });
    try {
      const pdfData = await parser.getText();
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
      return pdfData.text;
    } catch (error) {
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
      throw error;
    }
  }

  throw new Error('Unsupported pdf-parse module shape.');
}

async function extractText(filePath, mimeType) {
  const buffer = fs.readFileSync(filePath);

  switch (mimeType) {
    case 'application/pdf':
      return extractPdfText(buffer);

    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return (await mammoth.extractRawText({ buffer })).value;

    case 'text/plain':
      return buffer.toString('utf-8');

    default:
      throw new Error('Unsupported file type for text extraction.');
  }
}

module.exports = extractText;
