// src/components/FileConverter/pdfExtractor.js
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

/**
 * Convert PDF to DOCX with actual text extraction
 * @param {ArrayBuffer} fileBuffer - PDF file as ArrayBuffer
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<ArrayBuffer>} - DOCX file as ArrayBuffer
 */
export const convertPdfToDocx = async (fileBuffer, progressCallback) => {
  try {
    progressCallback(20);
    
    // Step 1: Create a Blob from the ArrayBuffer
    const pdfBlob = new Blob([fileBuffer], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Step 2: Use PDF.js (through window.pdfjsLib) to extract text
    // Note: This requires the PDF.js script to be loaded in your HTML
    if (!window.pdfjsLib) {
      console.warn('PDF.js not found, loading from CDN');
      await loadPdfjsFromCDN();
    }
    
    // Step 3: Extract text content
    progressCallback(30);
    const extractedPages = await extractPdfText(fileBuffer);
    progressCallback(60);
    
    // Step 4: Create DOCX with actual content
    const docxBuffer = await createDocxFromText(extractedPages);
    progressCallback(90);
    
    // Clean up
    URL.revokeObjectURL(pdfUrl);
    
    return docxBuffer;
  } catch (error) {
    console.error('PDF to DOCX conversion error:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
};

/**
 * Load PDF.js from CDN if not already available
 */
async function loadPdfjsFromCDN() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.pdfjsLib) {
      resolve();
      return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      // Set worker location
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    
    // Add to document
    document.head.appendChild(script);
  });
}

/**
 * Extract text from PDF using PDF.js
 * @param {ArrayBuffer} fileBuffer - PDF file as ArrayBuffer
 * @returns {Promise<Array<{pageNumber: number, text: string}>>} - Array of extracted text by page
 */
async function extractPdfText(fileBuffer) {
  if (!window.pdfjsLib) {
    throw new Error('PDF.js not available for text extraction');
  }
  
  // Load document
  const loadingTask = window.pdfjsLib.getDocument(new Uint8Array(fileBuffer));
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  console.log(`PDF loaded with ${numPages} pages`);
  
  // Extract text from each page
  const extractedPages = [];
  
  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Process text items to form paragraphs
      let text = '';
      let lastY = null;
      let paragraphs = [];
      
      // Group text items into paragraphs by their vertical position
      for (const item of textContent.items) {
        if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5 && text.trim()) {
          // New paragraph detected
          paragraphs.push(text.trim());
          text = '';
        }
        
        // Add text with appropriate spacing
        text += item.str + (item.hasEOL ? '\n' : ' ');
        lastY = item.transform[5];
      }
      
      // Add final paragraph
      if (text.trim()) {
        paragraphs.push(text.trim());
      }
      
      extractedPages.push({
        pageNumber: i,
        text: paragraphs.join('\n\n')
      });
      
      console.log(`Extracted text from page ${i}`);
    } catch (error) {
      console.error(`Error extracting text from page ${i}:`, error);
      extractedPages.push({
        pageNumber: i,
        text: `[Could not extract text from page ${i}]`
      });
    }
  }
  
  return extractedPages;
}

/**
 * Create a DOCX file from extracted text
 * @param {Array<{pageNumber: number, text: string}>} extractedPages - Array of extracted page texts
 * @returns {Promise<ArrayBuffer>} - DOCX file as ArrayBuffer
 */
async function createDocxFromText(extractedPages) {
  // Create a basic but properly structured DOCX file using JSZip
  const zip = new JSZip();
  
  // Add required DOCX structure files
  
  // Content Types
  zip.file('[Content_Types].xml', 
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
    '</Types>');
  
  // Rels
  zip.file('_rels/.rels', 
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
    '</Relationships>');
  
  // Document Rels
  zip.file('word/_rels/document.xml.rels', 
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>');
  
  // Styles for better formatting
  zip.file('word/styles.xml', 
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:style w:type="paragraph" w:styleId="Normal">' +
    '<w:name w:val="Normal"/>' +
    '<w:pPr/>' +
    '<w:rPr>' +
    '<w:sz w:val="24"/>' +
    '</w:rPr>' +
    '</w:style>' +
    '<w:style w:type="paragraph" w:styleId="Heading1">' +
    '<w:name w:val="Heading 1"/>' +
    '<w:basedOn w:val="Normal"/>' +
    '<w:pPr>' +
    '<w:keepNext/>' +
    '<w:spacing w:before="240" w:after="120"/>' +
    '</w:pPr>' +
    '<w:rPr>' +
    '<w:sz w:val="36"/>' +
    '<w:b/>' +
    '</w:rPr>' +
    '</w:style>' +
    '</w:styles>');
  
  // Core Properties
  const now = new Date().toISOString().replace(/\.\d+/, '');
  zip.file('docProps/core.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
    'xmlns:dc="http://purl.org/dc/elements/1.1/" ' +
    'xmlns:dcterms="http://purl.org/dc/terms/" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    '<dc:title>Converted PDF Document</dc:title>' +
    '<dc:creator>Skill Stack File Converter</dc:creator>' +
    '<cp:lastModifiedBy>Skill Stack</cp:lastModifiedBy>' +
    '<dcterms:created xsi:type="dcterms:W3CDTF">' + now + 'Z</dcterms:created>' +
    '<dcterms:modified xsi:type="dcterms:W3CDTF">' + now + 'Z</dcterms:modified>' +
    '</cp:coreProperties>');
  
  // App Properties
  zip.file('docProps/app.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">' +
    '<Application>Skill Stack</Application>' +
    '<AppVersion>1.0</AppVersion>' +
    '</Properties>');
  
  // Create document.xml content with extracted text
  let documentContent = '';
  
  // Special case for empty extraction

  // Process each page
  for (const page of extractedPages) {
    // Add page heading
    documentContent += '<w:p>' +
      '<w:pPr>' +
      '<w:pStyle w:val="Heading1"/>' +
      '</w:pPr>' +
      '<w:r>' +
      '<w:t>Page ' + page.pageNumber + '</w:t>' +
      '</w:r>' +
      '</w:p>';
    
    // Handle empty page
    if (!page.text || page.text.trim() === '') {
      documentContent += '<w:p>' +
        '<w:r>' +
        '<w:t>[No text content on this page]</w:t>' +
        '</w:r>' +
        '</w:p>';
      continue;
    }
    
    // Split text into paragraphs and add them
    const paragraphs = page.text.split('\n\n');
    
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;
      
      documentContent += '<w:p>' +
        '<w:r>' +
        '<w:t>' + escapeXml(paragraph) + '</w:t>' +
        '</w:r>' +
        '</w:p>';
    }
  }
  
  // Add footer with conversion note
  documentContent += '<w:p>' +
    '<w:r>' +
    '<w:rPr>' +
    '<w:i/>' +
    '<w:color w:val="808080"/>' +
    '</w:rPr>' +
    '<w:t>Converted from PDF using Skill Stack File Converter</w:t>' +
    '</w:r>' +
    '</w:p>';
  
  // Create the full document.xml
  const documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' +
    documentContent +
    '<w:sectPr>' +
    '<w:pgSz w:w="12240" w:h="15840"/>' +
    '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>' +
    '</w:sectPr>' +
    '</w:body>' +
    '</w:document>';
  
  zip.file('word/document.xml', documentXml);
  
  // Generate the DOCX file
  return await zip.generateAsync({ type: 'arraybuffer' });
}

/**
 * Helper function to escape XML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}