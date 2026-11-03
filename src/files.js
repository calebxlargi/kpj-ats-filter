export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export async function readCV(file) {
  if (file.size > MAX_FILE_SIZE) throw new Error('This file is larger than 10 MB. Please use a smaller file or paste its text.');
  const extension = file.name.split('.').pop().toLowerCase();
  let text = '';
  if (extension === 'txt') text = await file.text();
  else if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdfjs.getDocument({data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false, useSystemFonts: true});
    let pdf;
    try {
      pdf = await task.promise;
      if (pdf.numPages > 50) throw new Error('Please upload a CV with 50 pages or fewer.');
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const content = await (await pdf.getPage(i)).getTextContent();
        pages.push(content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join(''));
      }
      text = pages.join('\n');
    } catch (error) {
      if (error.name === 'PasswordException') throw new Error('This PDF is password protected. Use an unlocked copy or paste its text.');
      throw error;
    } finally { await task.destroy(); }
  } else if (extension === 'docx') {
    const mammoth = await import('mammoth/mammoth.browser');
    // Raw text only: never insert uploaded document HTML into the page.
    text = (await mammoth.extractRawText({arrayBuffer: await file.arrayBuffer()})).value;
  } else throw new Error('Supported files are PDF, DOCX and TXT. For older DOC files, save as DOCX or paste the text.');
  text = text.replace(/\0/g, '').trim();
  if (text.length < 40) throw new Error('Very little readable text was found. This may be a scanned PDF; paste readable CV text instead. OCR is not included.');
  if (text.length > 200000) throw new Error('This CV contains too much text. Please use a shorter file.');
  return text;
}
