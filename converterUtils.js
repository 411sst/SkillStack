// src/components/FileConverter/converterUtils.js
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import pptxgenjs from 'pptxgenjs';
import { convertPdfToDocx } from './pdfExtractor';

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
 * Helper function to wrap text to fit within a given width
 * @param {string} text - Text to wrap
 * @param {number} maxWidth - Maximum width in points
 * @param {number} fontSize - Font size
 * @param {PDFFont} font - PDF font
 * @returns {string[]} - Array of wrapped lines
 */
function wrapText(text, maxWidth, fontSize, font) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    // Estimate width - in a real implementation,
    // you would use font.widthOfTextAtSize(text, fontSize)
    const potentialLine = currentLine ? `${currentLine} ${word}` : word;
    const estimatedWidth = potentialLine.length * (fontSize * 0.5);
    
    if (estimatedWidth < maxWidth) {
      currentLine = potentialLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Convert DOCX to PDF with improved formatting
 * @param {ArrayBuffer} fileBuffer - DOCX file as ArrayBuffer
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<ArrayBuffer>} - PDF file as ArrayBuffer
 */
const convertDocxToPdf = async (fileBuffer, progressCallback) => {
  try {
    // Use mammoth to extract the HTML content from DOCX with better options
    progressCallback(30);
    
    const result = await mammoth.convertToHtml({ 
      arrayBuffer: fileBuffer,
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1.title:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "table => table",
        "tr => tr",
        "td => td"
      ] 
    });
    
    const html = result.value;
    
    progressCallback(50);
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const timesItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    
    // Process HTML content
    // This is a simplified HTML parser for demonstration
    const cleanText = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '## $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '# $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '* $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1')  // We'll handle bold in rendering
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '$1')  // We'll handle italics in rendering
      .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<(?:.|\n)*?>/gm, '') // Remove any remaining HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    
    // Split content into paragraphs and create pages
    const paragraphs = cleanText.split('\n\n');
    
    progressCallback(70);
    
    // Page dimensions (Letter size in points)
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 72; // 1-inch margins
    
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin; // Start at top margin
    const lineHeight = 14;
    
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;
      
      // Check if we need a new page
      if (y < margin + lineHeight) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      
      let font = timesRomanFont;
      let fontSize = 12;
      
      // Apply different styling based on paragraph format
      if (paragraph.startsWith('## ')) {
        // h1 - Large heading
        font = timesBoldFont;
        fontSize = 24;
        y -= 10; // Extra space before heading
        currentPage.drawText(paragraph.substring(3), {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        y -= fontSize + 16; // Extra space after heading
      } else if (paragraph.startsWith('# ')) {
        // h2 - Medium heading
        font = timesBoldFont;
        fontSize = 18;
        y -= 8; // Extra space before heading
        currentPage.drawText(paragraph.substring(2), {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        y -= fontSize + 12; // Extra space after heading
      } else if (paragraph.startsWith('* ')) {
        // h3 - Small heading
        font = timesBoldFont;
        fontSize = 14;
        y -= 6; // Extra space before heading
        currentPage.drawText(paragraph.substring(2), {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        y -= fontSize + 8; // Extra space after heading
      } else if (paragraph.startsWith('• ')) {
        // List item
        const listText = paragraph.substring(2);
        const wrappedLines = wrapText(listText, pageWidth - margin * 2 - 15, fontSize, timesRomanFont);
        
        // Draw bullet
        currentPage.drawText('•', {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        
        // Draw first line
        if (wrappedLines.length > 0) {
          currentPage.drawText(wrappedLines[0], {
            x: margin + 15,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        }
        
        // Draw additional lines if needed
        for (let i = 1; i < wrappedLines.length; i++) {
          y -= lineHeight;
          
          // Check if we need a new page
          if (y < margin) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          
          currentPage.drawText(wrappedLines[i], {
            x: margin + 15,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        }
        
        y -= lineHeight + 2; // Move down for next paragraph with some extra space
      } else {
        // Regular paragraph
        const wrappedLines = wrapText(paragraph, pageWidth - margin * 2, fontSize, timesRomanFont);
        
        for (const line of wrappedLines) {
          // Check if we need a new page
          if (y < margin) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          
          currentPage.drawText(line, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          
          y -= lineHeight;
        }
        
        y -= 6; // Extra space after paragraph
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
 * Convert PowerPoint to PDF with improved implementation
 * @param {ArrayBuffer} fileBuffer - PowerPoint file as ArrayBuffer
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<ArrayBuffer>} - PDF file as ArrayBuffer
 */
const convertPptToPdf = async (fileBuffer, progressCallback) => {
  try {
    progressCallback(30);
    
    // Use JSZip to extract the content of the PPTX file (which is a ZIP)
    const zip = new JSZip();
    const pptContent = await zip.loadAsync(fileBuffer);
    
    progressCallback(40);
    
    // Try to extract slide information
    let slideCount = 0;
    let slideContents = [];
    
    // Find presentation.xml to get slides info
    let presentationXml = '';
    try {
      const presentationFile = pptContent.file('ppt/presentation.xml');
      if (presentationFile) {
        presentationXml = await presentationFile.async('text');
        
        // Find slide references (simplified)
        const slideMatches = presentationXml.match(/<p:sldId[^>]*r:id="[^"]*"[^>]*>/g);
        slideCount = slideMatches ? slideMatches.length : 0;
      }
    } catch (err) {
      console.warn('Could not parse presentation.xml', err);
    }
    
    // Try to extract text from slides
    for (let i = 1; i <= Math.max(1, slideCount); i++) {
      try {
        const slideFile = pptContent.file(`ppt/slides/slide${i}.xml`);
        if (slideFile) {
          const slideXml = await slideFile.async('text');
          
          // Extract text (simplified)
          const textMatches = slideXml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
          const texts = textMatches.map(match => match.replace(/<a:t>|<\/a:t>/g, ''));
          
          slideContents.push({
            slideNumber: i,
            texts
          });
        }
      } catch (err) {
        console.warn(`Could not parse slide ${i}`, err);
      }
    }
    
    progressCallback(60);
    
    // Create a PDF with slides
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    // If no slides were found or parsing failed, create at least one page
    if (slideContents.length === 0) {
      slideContents.push({
        slideNumber: 1,
        texts: ['PowerPoint Content', 'Could not extract slide content']
      });
    }
    
    // Create PDF slides
    for (const slide of slideContents) {
      // Use 4:3 slide aspect ratio (720x540 points)
      const page = pdfDoc.addPage([720, 540]);
      
      // Add slide number
      page.drawText(`Slide ${slide.slideNumber}`, {
        x: 600,
        y: 500,
        size: 10,
        font: timesRomanFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Add slide content
      let y = 450;
      const lineHeight = 25;
      
      if (slide.texts.length > 0) {
        for (let i = 0; i < slide.texts.length; i++) {
          const text = slide.texts[i];
          if (!text.trim()) continue;
          
          // Make first line larger (as title)
          if (i === 0) {
            page.drawText(text, {
              x: 72,
              y,
              size: 24,
              font: timesBoldFont,
              color: rgb(0, 0, 0),
            });
            y -= 40; // Larger gap after title
          } else {
            page.drawText(text, {
              x: 72,
              y,
              size: 16,
              font: timesRomanFont,
              color: rgb(0, 0, 0),
            });
            y -= lineHeight;
          }
          
          // Ensure we don't go off the page
          if (y < 72) break;
        }
      } else {
        // Empty slide
        page.drawText("Empty Slide", {
          x: 72,
          y: 270,
          size: 24,
          font: timesBoldFont,
          color: rgb(0.7, 0.7, 0.7),
        });
      }
    }
    
    progressCallback(90);
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    return pdfBytes;
  } catch (error) {
    console.error('PPT to PDF conversion error:', error);
    
    // Fallback to basic PDF if parsing fails
    try {
      progressCallback(70);
      
      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      
      // Create a page for PPT
      const page = pdfDoc.addPage([720, 540]); // 4:3 slide aspect ratio
      
      // Add placeholder content
      page.drawText('PowerPoint Slide Content', {
        x: 72,
        y: 450,
        size: 24,
        font: timesBoldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('Could not extract content from the PowerPoint file.', {
        x: 72,
        y: 400,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('This is a placeholder PDF generated from your presentation.', {
        x: 72,
        y: 380,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      
      progressCallback(90);
      
      // Serialize the PDF to bytes
      const pdfBytes = await pdfDoc.save();
      
      return pdfBytes;
    } catch (fallbackError) {
      console.error('PPT fallback error:', fallbackError);
      throw new Error('Failed to convert PowerPoint to PDF: ' + error.message);
    }
  }
};

export default {
  convertDocument
};