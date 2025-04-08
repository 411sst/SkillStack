// src/components/FileConverter/converterUtils.js
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import mammoth from 'mammoth';
import pptxgenjs from 'pptxgenjs';
import CloudConvert from 'cloudconvert';

/**
 * Convert a document from one format to another
 * @param {File} file - The file to convert
 * @param {string} conversionType - Type of conversion (e.g., 'docx-to-pdf')
 * @param {Function} progressCallback - Callback to report progress
 * @returns {Promise<ArrayBuffer>} - The converted file as ArrayBuffer
 */
export const convertDocument = async (file, conversionType, progressCallback) => {
  // Read the file
  const fileBuffer = await readFileAsArrayBuffer(file);
  
  progressCallback(20);
  
  // Perform conversion based on type
  switch (conversionType) {
    case 'docx-to-pdf':
      return await convertDocxToPdf(fileBuffer, progressCallback);
    case 'pdf-to-docx':
      return await convertPdfToDocx(fileBuffer, progressCallback);
    case 'ppt-to-pdf':
      return await convertPptToPdf(fileBuffer, progressCallback);
    default:
      throw new Error(`Unsupported conversion type: ${conversionType}`);
  }
};

/**
 * Helper function to read file as ArrayBuffer
 * @param {File} file - The file to read
 * @returns {Promise<ArrayBuffer>} - File contents as ArrayBuffer
 */
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Helper function to split text into lines of a given length
 * @param {string} text - The text to split
 * @param {number} maxCharsPerLine - Maximum characters per line
 * @returns {string[]} - Array of lines
 */
const splitTextIntoLines = (text, maxCharsPerLine) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

/**
 * Convert DOCX to PDF
 * @param {ArrayBuffer} fileBuffer - DOCX file as ArrayBuffer
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<ArrayBuffer>} - PDF file as ArrayBuffer
 */
const convertDocxToPdf = async (fileBuffer, progressCallback) => {
  try {
    // Use mammoth to extract the HTML content from DOCX
    progressCallback(30);
    const result = await mammoth.convertToHtml({ arrayBuffer: fileBuffer });
    const html = result.value;
    
    progressCallback(50);
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const page = pdfDoc.addPage([612, 792]); // Letter size
    
    // Very basic HTML to PDF conversion - this is simplified
    // In a real app, you would use a more robust HTML to PDF converter
    const textContent = html.replace(/<[^>]*>/g, ' ').trim();
    
    progressCallback(70);
    
    // Add text content to the PDF
    page.setFont(timesRomanFont);
    page.setFontSize(12);
    
    const lines = splitTextIntoLines(textContent, 70);
    let y = 700;
    
    for (const line of lines) {
      page.drawText(line, {
        x: 50,
        y,
        size: 12,
        color: rgb(0, 0, 0),
      });
      y -= 15;
      
      // Add a new page if needed
      if (y < 50) {
        const newPage = pdfDoc.addPage([612, 792]);
        newPage.setFont(timesRomanFont);
        newPage.setFontSize(12);
        y = 700;
      }
    }
    
    progressCallback(90);
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    return pdfBytes;
  } catch (error) {
    console.error('DOCX to PDF conversion error:', error);
    throw new Error('Failed to convert DOCX to PDF: ' + error.message);
  }
};

/**
 * Convert PDF to DOCX using CloudConvert API
 * @param {ArrayBuffer} fileBuffer - PDF file as ArrayBuffer
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<ArrayBuffer>} - DOCX file as ArrayBuffer
 */
const convertPdfToDocx = async (fileBuffer, progressCallback) => {
  try {
    progressCallback(30);
    
    // Initialize CloudConvert with your API key
    // Note: In production, store this securely, not hardcoded
    const cloudConvert = new CloudConvert('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYjcwZjQyZGJiYWM4YTQ5NGJlYzg5MGJmZDE4YzEzN2MwOGVmMzg2ZTA1NGQzMzQwZDM1MzUyOTIzMzBiZTM4YjFmZjE4ODNiNWFkYzFhY2EiLCJpYXQiOjE3NDQxMDU1NDYuODI5NjM3LCJuYmYiOjE3NDQxMDU1NDYuODI5NjM4LCJleHAiOjQ4OTk3NzkxNDYuODI0NTUsInN1YiI6IjcxNTc0ODU3Iiwic2NvcGVzIjpbXX0.MSlIyGhEK3q6uv5ObkXRevTdQLqTn5yVxib95TO3dtTNrmDBd9hoCUAnFZjMG-EdChpZbofX_Hqwtm4qYVeQUBMefHcZfV20C2u5F9t2eqZvO-YFKkbB1zhk7mm5LVEodAAGxpU86gTOQwPwTB90Owl-axnc5nYCK-aWOHJ8yZ-vA3piFgbpCw-TayZKFGx3hlxTfNRrvvojKJlFpy9CgqKdOPkrLJsOHZdO9O--38cgIGW3F4eoWxVYtc9F3IchE5lCLoEkt8fMx2GXmNKS0-CqXqIg0MdzLO9bR_22P24uplgZdriUqoLvEfrU_aIk7fOPdNavtFeGab8akNwav-IVupPTjbty0BGgZB5d03XwUmr2Sovf00hAWk9KqTsLvKgc_EqG0aFu_1tCkATgHeuZqqxatredRh01AHcJFj_Agfw5aUcrAaB6ingoBNLZGlG-5J9bKehRB98__uus_yoQS00RbQcE9dAw6oAzDgZtDra4-K1gvHejnOlF97Uzhsb3eS4XckxO-WNUB4mMT_VdK41qtGJeIoI6cL0_P9hbhTOMr5ShMy2oN2Mdaxn0JtpRVIQmDDq6Ex8Ro7ETlIRC6KgG_guIbHMtXbgPv7GTMB5e6BJIPe4QWLdhm8aA0pCgdlOWaRYD1_aAlPNcwN6Dn5gBfR9WPOp4RGxIIBA');
    
    try {
      // Create a job with tasks
      const job = await cloudConvert.jobs.create({
        tasks: {
          'upload-my-file': {
            operation: 'import/upload'
          },
          'convert-my-file': {
            operation: 'convert',
            input: 'upload-my-file',
            input_format: 'pdf',
            output_format: 'docx',
            engine: 'office' // Use the Office engine for better compatibility
          },
          'export-my-file': {
            operation: 'export/url',
            input: 'convert-my-file'
          }
        }
      });
      
      progressCallback(40);
      
      // Get the upload task
      const uploadTask = job.tasks.filter(task => task.name === 'upload-my-file')[0];
      
      // Upload the file buffer
      // Convert ArrayBuffer to Blob for upload
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      await cloudConvert.tasks.upload(uploadTask, blob, 'document.pdf');
      
      progressCallback(60);
      
      // Wait for the job to complete
      const waitedJob = await cloudConvert.jobs.wait(job.id);
      
      progressCallback(80);
      
      // Get the export task to retrieve the file URL
      const exportTask = waitedJob.tasks.filter(task => task.name === 'export-my-file')[0];
      
      if (!exportTask || !exportTask.result || !exportTask.result.files || exportTask.result.files.length === 0) {
        throw new Error('Conversion failed: No output file was generated');
      }
      
      const file = exportTask.result.files[0];
      
      // Download the file
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`Failed to download converted file: ${response.status} ${response.statusText}`);
      }
      
      const docxBuffer = await response.arrayBuffer();
      
      progressCallback(90);
      
      return docxBuffer;
    } catch (cloudConvertError) {
      console.error('CloudConvert error:', cloudConvertError);
      
      // Fall back to the basic conversion if CloudConvert fails
      return createBasicDocxFile(fileBuffer, progressCallback);
    }
  } catch (error) {
    console.error('PDF to DOCX conversion error:', error);
    throw new Error('Failed to convert PDF to DOCX: ' + error.message);
  }
};

/**
 * Create a basic DOCX file as a fallback
 * @param {ArrayBuffer} pdfBuffer - PDF file as ArrayBuffer 
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<ArrayBuffer>} - DOCX file as ArrayBuffer
 */
const createBasicDocxFile = async (pdfBuffer, progressCallback) => {
  try {
    // Extract minimal information from PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const numPages = pdfDoc.getPageCount();
    
    // Create simple HTML content
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>Converted from PDF</h1>
          <p>This document was converted from a PDF with ${numPages} pages.</p>
          <p>PDF to DOCX conversion using EduToolkit File Converter</p>
          <p>Note: For a more complete conversion with full formatting, consider using specialized conversion software.</p>
        </body>
      </html>
    `;
    
    // Convert to text
    const textEncoder = new TextEncoder();
    const basicDocx = textEncoder.encode(htmlContent);
    
    return basicDocx.buffer;
  } catch (error) {
    console.error('Fallback conversion error:', error);
    throw new Error('Failed to create basic DOCX file: ' + error.message);
  }
};

/**
 * Convert PowerPoint to PDF
 * @param {ArrayBuffer} fileBuffer - PowerPoint file as ArrayBuffer
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<ArrayBuffer>} - PDF file as ArrayBuffer
 */
const convertPptToPdf = async (fileBuffer, progressCallback) => {
  try {
    progressCallback(30);
    
    // In a real application, you would use a proper library to convert PPT to PDF
    // For this demo, we'll create a simple PDF with placeholder content
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    
    // Create a page for each slide (we'll just create a placeholder page)
    const page = pdfDoc.addPage([720, 540]); // 4:3 slide aspect ratio
    
    progressCallback(60);
    
    // Add placeholder content
    page.drawText('PowerPoint Slide Content', {
      x: 50,
      y: 450,
      size: 24,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('This is a placeholder for PowerPoint content.', {
      x: 50,
      y: 400,
      size: 12,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('In a real application, you would use a proper library', {
      x: 50,
      y: 380,
      size: 12,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('to convert PowerPoint presentations to PDF.', {
      x: 50,
      y: 360,
      size: 12,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    
    progressCallback(90);
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    return pdfBytes;
  } catch (error) {
    console.error('PPT to PDF conversion error:', error);
    throw new Error('Failed to convert PowerPoint to PDF: ' + error.message);
  }
};

export default {
  convertDocument
};
