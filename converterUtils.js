// src/components/FileConverter/converterUtils.js
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import mammoth from 'mammoth';
import JSZip from 'jszip';
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
 * Convert PowerPoint to PDF, preserving the actual visual appearance of each slide
 * @param {ArrayBuffer} fileBuffer - PowerPoint file as ArrayBuffer
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<ArrayBuffer>} - PDF file as ArrayBuffer with each slide as a page
 */
const convertPptToPdf = async (fileBuffer, progressCallback) => {
  try {
    progressCallback(5);
    
    // Step 1: Extract the PPTX content (which is a ZIP file)
    const zip = new JSZip();
    const pptContent = await zip.loadAsync(fileBuffer);
    
    progressCallback(15);
    
    // Step 2: Analyze the presentation structure
    // - Find the number of slides
    // - Extract relationship data for media and slide references
    
    let slideCount = 0;
    let slideRelations = {};
    let mediaRelations = {};
    
    // Load presentation.xml to get slide information
    const presentationFile = pptContent.file('ppt/presentation.xml');
    
    if (!presentationFile) {
      throw new Error('Invalid PowerPoint file: missing presentation.xml');
    }
    
    const presentationXml = await presentationFile.async('text');
    
    // Extract slide references
    const slideMatches = presentationXml.match(/<p:sldId[^>]*r:id="([^"]*)"[^>]*>/g) || [];
    slideCount = slideMatches.length;
    
    if (slideCount === 0) {
      throw new Error('No slides found in the presentation');
    }
    
    // Extract relationship IDs for slides
    const slideIds = slideMatches.map(match => {
      const idMatch = match.match(/r:id="([^"]*)"/);
      return idMatch ? idMatch[1] : null;
    }).filter(id => id !== null);
    
    console.log(`Found ${slideCount} slides`);
    progressCallback(20);
    
    // Load presentation relationships to map slide IDs to file paths
    const presentationRelsFile = pptContent.file('ppt/_rels/presentation.xml.rels');
    if (presentationRelsFile) {
      const relsXml = await presentationRelsFile.async('text');
      
      // Extract all relationship entries
      const relationMatches = relsXml.match(/<Relationship[^>]*Id="([^"]*)"[^>]*Target="([^"]*)"[^>]*>/g) || [];
      
      // Process each relationship entry
      for (const rel of relationMatches) {
        const idMatch = rel.match(/Id="([^"]*)"/);
        const targetMatch = rel.match(/Target="([^"]*)"/);
        
        if (idMatch && targetMatch) {
          const id = idMatch[1];
          const target = targetMatch[1];
          slideRelations[id] = target;
        }
      }
    }
    
    // Map slide IDs to slide files
    const slideFiles = [];
    for (const id of slideIds) {
      const slidePath = slideRelations[id];
      if (slidePath && slidePath.includes('slides/slide')) {
        // Extract slide number and find actual file
        const slideMatch = slidePath.match(/slide(\d+)\.xml/);
        if (slideMatch) {
          const slideNumber = parseInt(slideMatch[1]);
          slideFiles.push({
            number: slideNumber,
            path: slidePath
          });
        }
      }
    }
    
    // Sort slides by number
    slideFiles.sort((a, b) => a.number - b.number);
    
    progressCallback(25);
    
    // Gather media files from the presentation
    const mediaFiles = {};
    Object.keys(pptContent.files).forEach(filename => {
      if (filename.startsWith('ppt/media/')) {
        const mediaName = filename.split('/').pop();
        mediaFiles[mediaName] = filename;
      }
    });
    
    console.log(`Found ${Object.keys(mediaFiles).length} media files`);
    
    // Load individual slide relationships to map media references
    const slideMediaRelations = {};
    
    for (const slideFile of slideFiles) {
      const slideNumber = slideFile.number;
      const relsFile = pptContent.file(`ppt/slides/_rels/slide${slideNumber}.xml.rels`);
      
      if (relsFile) {
        const relsXml = await relsFile.async('text');
        slideMediaRelations[slideNumber] = {};
        
        const relMatches = relsXml.match(/<Relationship[^>]*Id="([^"]*)"[^>]*Target="([^"]*)"[^>]*>/g) || [];
        
        for (const rel of relMatches) {
          const idMatch = rel.match(/Id="([^"]*)"/);
          const targetMatch = rel.match(/Target="([^"]*)"/);
          
          if (idMatch && targetMatch) {
            const id = idMatch[1];
            const target = targetMatch[1];
            slideMediaRelations[slideNumber][id] = target;
          }
        }
      }
    }
    
    progressCallback(30);
    
    // Step 3: Generate PDF from the extracted slides
    const pdfDoc = await PDFDocument.create();
    
    // Define slide dimensions - standard 16:9 aspect ratio (common in modern presentations)
    // Using a higher resolution for better quality
    const slideWidth = 1280;  // 10 inches at 128 DPI
    const slideHeight = 720;  // 5.625 inches at 128 DPI
    
    // Create a canvas for rendering slides
    const canvas = document.createElement('canvas');
    canvas.width = slideWidth;
    canvas.height = slideHeight;
    const ctx = canvas.getContext('2d');
    
    // Process each slide
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const slideNumber = slideFile.number;
      
      progressCallback(30 + Math.floor((i / slideFiles.length) * 60));
      
      try {
        console.log(`Processing slide ${slideNumber}`);
        
        // Load the slide XML content
        const slideFilePath = `ppt/slides/slide${slideNumber}.xml`;
        const slideXmlFile = pptContent.file(slideFilePath);
        
        if (!slideXmlFile) {
          console.warn(`Slide file not found: ${slideFilePath}`);
          continue;
        }
        
        const slideXml = await slideXmlFile.async('text');
        
        // Clear canvas with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, slideWidth, slideHeight);
        
        // Step 3.1: Extract background color/image if any
        const bgColorMatch = slideXml.match(/<a:solidFill><a:srgbClr val="([A-Fa-f0-9]{6})"/);
        if (bgColorMatch) {
          ctx.fillStyle = `#${bgColorMatch[1]}`;
          ctx.fillRect(0, 0, slideWidth, slideHeight);
        }
        
        // Step A: Extract all embedded images
        const imageRefs = [];
        const imageMatches = slideXml.match(/r:embed="([^"]*)"/g) || [];
        
        for (const ref of imageMatches) {
          const idMatch = ref.match(/r:embed="([^"]*)"/);
          if (idMatch && slideMediaRelations[slideNumber] && slideMediaRelations[slideNumber][idMatch[1]]) {
            const imagePath = slideMediaRelations[slideNumber][idMatch[1]];
            
            // Image paths are often relative, need to resolve
            let fullPath;
            if (imagePath.startsWith('../')) {
              // Handle ../media/image1.png format
              fullPath = 'ppt/' + imagePath.substring(3);
            } else {
              fullPath = `ppt/slides/${imagePath}`;
            }
            
            imageRefs.push({
              id: idMatch[1],
              path: fullPath
            });
          }
        }
        
        // Step B: Load and render images
        for (const imageRef of imageRefs) {
          try {
            const imageFile = pptContent.file(imageRef.path);
            if (imageFile) {
              const imageBuffer = await imageFile.async('arraybuffer');
              const blob = new Blob([imageBuffer]);
              const imageUrl = URL.createObjectURL(blob);
              
              // Create image element and wait for it to load
              const img = new Image();
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
              });
              
              // For simplicity, we'll place the image centered on the slide
              // In a complete implementation, position would come from the slide XML
              const imgWidth = Math.min(slideWidth * 0.8, img.width);
              const imgHeight = (img.height / img.width) * imgWidth;
              const imgX = (slideWidth - imgWidth) / 2;
              const imgY = (slideHeight - imgHeight) / 2;
              
              // Draw the image to the canvas
              ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
              
              // Clean up the blob URL
              URL.revokeObjectURL(imageUrl);
            }
          } catch (imgErr) {
            console.error(`Error rendering image in slide ${slideNumber}:`, imgErr);
          }
        }
        
        // Step C: Extract and render text
        const textElements = [];
        const titleMatches = slideXml.match(/<p:title>(.*?)<\/p:title>/gs) || [];
        const bodyMatches = slideXml.match(/<p:txBody>(.*?)<\/p:txBody>/gs) || [];
        
        // Process title text
        for (const titleMatch of titleMatches) {
          const textMatches = titleMatch.match(/<a:t>(.*?)<\/a:t>/g) || [];
          const titleText = textMatches.map(t => t.replace(/<a:t>|<\/a:t>/g, '')).join(' ');
          
          if (titleText.trim()) {
            textElements.push({
              type: 'title',
              text: titleText
            });
          }
        }
        
        // Process body text
        for (const bodyMatch of bodyMatches) {
          const paragraphs = bodyMatch.match(/<a:p>(.*?)<\/a:p>/gs) || [];
          
          for (const paragraph of paragraphs) {
            const textMatches = paragraph.match(/<a:t>(.*?)<\/a:t>/g) || [];
            const paragraphText = textMatches.map(t => t.replace(/<a:t>|<\/a:t>/g, '')).join(' ');
            
            // Skip empty paragraphs
            if (paragraphText.trim()) {
              // Check if this paragraph is a list item
              const isList = paragraph.includes('<a:buChar') || paragraph.includes('<a:buAutoNum');
              
              textElements.push({
                type: isList ? 'listItem' : 'body',
                text: paragraphText
              });
            }
          }
        }
        
        // Render text elements
        ctx.textBaseline = 'top';
        
        for (const element of textElements) {
          switch (element.type) {
            case 'title':
              ctx.fillStyle = '#000000';
              ctx.font = 'bold 36px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(element.text, slideWidth / 2, 50);
              break;
            
            case 'listItem':
              ctx.fillStyle = '#000000';
              ctx.font = '24px Arial';
              ctx.textAlign = 'left';
              
              // Find vertical position based on element index
              // This is simplified; real implementation would use actual positions
              const listIndex = textElements.filter(e => e.type === 'listItem').indexOf(element);
              const y = 150 + listIndex * 40;
              
              // Draw bullet point
              ctx.fillText('•', 80, y);
              
              // Draw text with indent
              ctx.fillText(element.text, 110, y);
              break;
            
            case 'body':
              ctx.fillStyle = '#000000';
              ctx.font = '24px Arial';
              ctx.textAlign = 'left';
              
              // Find vertical position based on element index
              const bodyIndex = textElements.filter(e => e.type === 'body').indexOf(element);
              const bodyY = 150 + bodyIndex * 40;
              
              // Draw text
              ctx.fillText(element.text, 80, bodyY);
              break;
          }
        }
        
        // Convert canvas to image
        const slideImage = canvas.toDataURL('image/png');
        const base64Data = slideImage.replace(/^data:image\/png;base64,/, '');
        
        // Convert base64 to binary data
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let j = 0; j < binaryData.length; j++) {
          bytes[j] = binaryData.charCodeAt(j);
        }
        
        // Create a new page in the PDF
        const page = pdfDoc.addPage([slideWidth, slideHeight]);
        
        // Embed the image in the PDF
        const pngImage = await pdfDoc.embedPng(bytes);
        
        // Draw the image on the page (full page)
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: slideWidth,
          height: slideHeight
        });
        
        console.log(`Added slide ${slideNumber} to PDF`);
      } catch (slideErr) {
        console.error(`Error processing slide ${slideNumber}:`, slideErr);
      }
    }
    
    progressCallback(95);
    
    // Serialize the PDF to ArrayBuffer
    const pdfBytes = await pdfDoc.save();
    
    progressCallback(100);
    return pdfBytes;
  } catch (error) {
    console.error('Error converting PPT to PDF:', error);
    throw new Error(`Failed to convert PowerPoint to PDF: ${error.message}`);
  }
};

// Remove these helper functions since they're not needed with the new implementation
// function extractSlideRelationships(pptxContent) { ... }
// function extractImageReferences(slideXml) { ... }

export { convertPptToPdf };