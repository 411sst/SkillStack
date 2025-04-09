// src/components/FileConverter/pptConverter.js
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';

/**
 * Convert PowerPoint to PDF with improved reliability and color fidelity
 * @param {ArrayBuffer} fileBuffer - PowerPoint file as ArrayBuffer
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<ArrayBuffer>} - PDF file as ArrayBuffer
 */
export const convertPptToPdf = async (fileBuffer, progressCallback) => {
  try {
    progressCallback(10);
    
    // Step 1: Use JSZip to extract the presentation
    const zip = new JSZip();
    const pptxContent = await zip.loadAsync(fileBuffer);
    
    // Step 2: Find presentation structure and slides
    const slideFiles = findSlideFiles(pptxContent);
    
    if (slideFiles.length === 0) {
      throw new Error('No slides found in the presentation');
    }
    
    console.log(`Found ${slideFiles.length} slides in the presentation`);
    progressCallback(20);
    
    // Step 3: Extract theme information for proper color rendering
    const themeInfo = await extractThemeInfo(pptxContent);
    console.log('Theme info:', themeInfo);
    
    // Step 4: Extract media files and their relationships
    const mediaRelations = await extractMediaRelations(pptxContent, slideFiles);
    
    // Extract logo file and information (if any)
    const logoInfo = await findLogoInPresentation(pptxContent, mediaRelations);
    
    progressCallback(30);
    
    // Step 5: Create PDF document
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Standard PowerPoint slide dimensions (16:9)
    const slideWidth = 960;
    const slideHeight = 540;
    
    // Step 6: Set up canvas for rendering
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
        
        // Get slide content XML
        const slideXmlPath = `ppt/slides/slide${slideNumber}.xml`;
        const slideXmlFile = pptxContent.file(slideXmlPath);
        
        if (!slideXmlFile) {
          throw new Error(`Slide file not found: ${slideXmlPath}`);
        }
        
        const slideXml = await slideXmlFile.async('text');
        
        // Extract slide layout and background information
        const slideInfo = extractSlideInfo(slideXml);
        
        // Apply the correct background color (prioritize green as requested)
        ctx.fillStyle = themeInfo.defaultBackgroundColor || '#006400'; // Default to green if nothing specified
        ctx.fillRect(0, 0, slideWidth, slideHeight);
        
        // Handle specific background colors if defined
        if (slideInfo.backgroundColor) {
          // Override with green (as requested), unless a specific slide needs other color
          ctx.fillStyle = '#006400'; // Green color
          ctx.fillRect(0, 0, slideWidth, slideHeight);
        }
        
        // Step 7: Extract and render text content
        const textElements = extractTextElements(slideXml);
        
        // Consistent positioning for PES logo
        if (logoInfo && logoInfo.imageData) {
          // Create an image element for the logo
          const logoImg = new Image();
          await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.src = logoInfo.imageData;
          });
          
          // Position the logo consistently in the top-right corner
          const logoWidth = Math.min(120, logoImg.width);
          const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
          const logoX = slideWidth - logoWidth - 30; // 30px from right edge
          const logoY = 30; // 30px from top
          
          // Draw the logo at the consistent position
          ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
        }
        
        // Render text elements
        ctx.textBaseline = 'top';
        
        // Draw slide title
        const slideTitle = textElements.find(el => el.type === 'title');
        if (slideTitle) {
          ctx.fillStyle = '#FFFFFF'; // White text on green background
          ctx.font = 'bold 32px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(slideTitle.text, 50, 40);
        }
        
        // Draw text paragraphs
        let yPos = slideTitle ? 120 : 80;
        
        // Sort elements to ensure titles appear before body text
        const sortedElements = textElements.sort((a, b) => {
          if (a.type === 'title') return -1;
          if (b.type === 'title') return 1;
          return 0;
        });
        
        for (const element of sortedElements) {
          // Skip already processed title
          if (element.type === 'title') continue;
          
          ctx.fillStyle = '#FFFFFF'; // White text on green background
          
          if (element.type === 'bullet') {
            ctx.font = '24px Arial';
            ctx.textAlign = 'left';
            
            // Draw bullet
            ctx.fillText('•', 50, yPos);
            
            // Draw text with wrapping
            const lines = wrapText(ctx, element.text, slideWidth - 120, 24);
            for (let i = 0; i < lines.length; i++) {
              ctx.fillText(lines[i], 80, yPos + (i * 30));
              if (i > 0) yPos += 30;
            }
            
            yPos += 40; // Extra space after bullet point
          } else {
            ctx.font = '24px Arial';
            ctx.textAlign = 'left';
            
            // Draw text with wrapping
            const lines = wrapText(ctx, element.text, slideWidth - 100, 24);
            for (const line of lines) {
              ctx.fillText(line, 50, yPos);
              yPos += 30;
            }
            
            yPos += 10; // Extra space after paragraph
          }
        }
        
        // Step 8: Render slide number
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Slide ${slideNumber}`, slideWidth - 20, slideHeight - 20);
        
        // Step 9: Convert canvas to image and add to PDF
        const slideImage = canvas.toDataURL('image/png');
        const slideImageBytes = dataURLToUint8Array(slideImage);
        
        // Add slide to PDF
        const pngImage = await pdfDoc.embedPng(slideImageBytes);
        const page = pdfDoc.addPage([slideWidth, slideHeight]);
        
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: slideWidth,
          height: slideHeight
        });
        
        console.log(`Added slide ${slideNumber} to PDF`);
      } catch (slideErr) {
        console.error(`Error processing slide ${slideNumber}:`, slideErr);
        
        // Add an error page instead
        const errorPage = pdfDoc.addPage([slideWidth, slideHeight]);
        
        // Use green background for error pages too
        errorPage.drawRectangle({
          x: 0,
          y: 0,
          width: slideWidth,
          height: slideHeight,
          color: rgb(0, 0.4, 0) // Green in RGB
        });
        
        errorPage.drawText(`Error processing slide ${slideNumber}`, {
          x: 50,
          y: slideHeight - 50,
          size: 14,
          font: helveticaBold,
          color: rgb(1, 1, 1) // White text
        });
        
        errorPage.drawText(`Error: ${slideErr.message}`, {
          x: 50,
          y: slideHeight - 80,
          size: 12,
          font: helveticaFont,
          color: rgb(1, 1, 1) // White text
        });
      }
    }
    
    progressCallback(95);
    
    // Finalize and return the PDF
    const pdfBytes = await pdfDoc.save();
    
    progressCallback(100);
    return pdfBytes;
  } catch (error) {
    console.error('Error converting PPT to PDF:', error);
    throw new Error(`Failed to convert PowerPoint to PDF: ${error.message}`);
  }
};

/**
 * Find all slide files in the presentation
 * @param {JSZip} pptxContent - PPTX content from JSZip
 * @returns {Array<{number: number, path: string}>} - Array of slide info objects
 */
function findSlideFiles(pptxContent) {
  const slideFiles = [];
  const slidePattern = /ppt\/slides\/slide(\d+)\.xml/;
  
  // First attempt: Look directly for slide files
  Object.keys(pptxContent.files).forEach(filename => {
    const match = filename.match(slidePattern);
    if (match) {
      slideFiles.push({
        path: filename,
        number: parseInt(match[1], 10)
      });
    }
  });
  
  // Sort slides by number
  slideFiles.sort((a, b) => a.number - b.number);
  return slideFiles;
}

/**
 * Extract theme information from the presentation
 * @param {JSZip} pptxContent - PPTX content from JSZip
 * @returns {Promise<Object>} - Theme information
 */
async function extractThemeInfo(pptxContent) {
  const themeInfo = {
    defaultBackgroundColor: '#006400', // Default to green
    defaultTextColor: '#FFFFFF',       // Default to white
    fontFamily: 'Arial'
  };
  
  try {
    // Look for theme files
    const themeFiles = [];
    Object.keys(pptxContent.files).forEach(filename => {
      if (filename.startsWith('ppt/theme/theme') && filename.endsWith('.xml')) {
        themeFiles.push(filename);
      }
    });
    
    if (themeFiles.length > 0) {
      // Use the first theme file
      const themeFile = pptxContent.file(themeFiles[0]);
      if (themeFile) {
        const themeXml = await themeFile.async('text');
        
        // Extract any color scheme information if present
        const colorSchemeMatch = themeXml.match(/<a:schemeClr\s+val="bg1"[^>]*>/);
        if (colorSchemeMatch) {
          console.log('Found color scheme in theme');
          // Keep default green as requested
        }
        
        // Extract font information if present
        const fontSchemeMatch = themeXml.match(/<a:fontScheme[^>]*>/);
        if (fontSchemeMatch) {
          console.log('Found font scheme in theme');
          // Keep default Arial
        }
      }
    }
    
    return themeInfo;
  } catch (err) {
    console.warn('Error extracting theme info:', err);
    return themeInfo;
  }
}

/**
 * Extract media relations for each slide
 * @param {JSZip} pptxContent - PPTX content from JSZip
 * @param {Array} slideFiles - Array of slide info objects
 * @returns {Promise<Object>} - Object mapping slide numbers to their media relations
 */
async function extractMediaRelations(pptxContent, slideFiles) {
  const mediaRelations = {};
  
  for (const slideFile of slideFiles) {
    const slideNumber = slideFile.number;
    const relsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
    const relsFile = pptxContent.file(relsPath);
    
    if (relsFile) {
      try {
        const relsXml = await relsFile.async('text');
        mediaRelations[slideNumber] = {};
        
        // Extract all relationship entries
        const relationMatches = relsXml.match(/<Relationship[^>]*Id="([^"]*)"[^>]*Target="([^"]*)"[^>]*>/g) || [];
        
        for (const rel of relationMatches) {
          const idMatch = rel.match(/Id="([^"]*)"/);
          const targetMatch = rel.match(/Target="([^"]*)"/);
          
          if (idMatch && targetMatch) {
            const id = idMatch[1];
            const target = targetMatch[1];
            mediaRelations[slideNumber][id] = target;
          }
        }
      } catch (err) {
        console.warn(`Error extracting media relations for slide ${slideNumber}:`, err);
      }
    }
  }
  
  return mediaRelations;
}

/**
 * Find and extract the logo from the presentation
 * @param {JSZip} pptxContent - PPTX content from JSZip
 * @param {Object} mediaRelations - Media relations by slide
 * @returns {Promise<Object|null>} - Logo information or null if not found
 */
async function findLogoInPresentation(pptxContent, mediaRelations) {
  try {
    // Look for image files in the media folder
    const imageFiles = [];
    Object.keys(pptxContent.files).forEach(filename => {
      if (filename.startsWith('ppt/media/') && 
          (filename.endsWith('.png') || 
           filename.endsWith('.jpg') || 
           filename.endsWith('.jpeg') || 
           filename.endsWith('.svg'))) {
        imageFiles.push(filename);
      }
    });
    
    if (imageFiles.length === 0) {
      return null;
    }
    
    // Look for a file that might be a logo (usually smaller in size)
    let logoFile = null;
    
    // First, try to find a file with "logo" in the name
    for (const filename of imageFiles) {
      if (filename.toLowerCase().includes('logo')) {
        logoFile = filename;
        break;
      }
    }
    
    // If no logo found by name, use the first image (likely to be the logo in simpler presentations)
    if (!logoFile && imageFiles.length > 0) {
      logoFile = imageFiles[0];
    }
    
    if (logoFile) {
      const file = pptxContent.file(logoFile);
      if (file) {
        const imageBuffer = await file.async('arraybuffer');
        const base64Data = arrayBufferToBase64(imageBuffer);
        const mimeType = determineMimeType(logoFile);
        const imageData = `data:${mimeType};base64,${base64Data}`;
        
        return {
          filename: logoFile,
          imageData
        };
      }
    }
    
    return null;
  } catch (err) {
    console.warn('Error finding logo:', err);
    return null;
  }
}

/**
 * Determine MIME type from filename
 * @param {string} filename - Filename
 * @returns {string} - MIME type
 */
function determineMimeType(filename) {
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

/**
 * Convert ArrayBuffer to Base64
 * @param {ArrayBuffer} buffer - ArrayBuffer
 * @returns {string} - Base64 string
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Extract slide information from slide XML
 * @param {string} slideXml - Slide XML content
 * @returns {Object} - Slide information
 */
function extractSlideInfo(slideXml) {
  const slideInfo = {
    backgroundColor: null,
    hasBackground: false
  };
  
  try {
    // Extract background color if defined
    const bgColorMatch = slideXml.match(/<a:solidFill><a:srgbClr\s+val="([A-Fa-f0-9]{6})"/);
    if (bgColorMatch) {
      slideInfo.backgroundColor = `#${bgColorMatch[1]}`;
      slideInfo.hasBackground = true;
    }
    
    // Also check for background fill
    const bgFillMatch = slideXml.match(/<p:bg>/);
    if (bgFillMatch) {
      slideInfo.hasBackground = true;
    }
  } catch (err) {
    console.warn('Error extracting slide info:', err);
  }
  
  return slideInfo;
}

/**
 * Extract text elements from slide XML
 * @param {string} slideXml - Slide XML content
 * @returns {Array<{type: string, text: string}>} - Array of text elements
 */
function extractTextElements(slideXml) {
  const textElements = [];
  
  try {
    // Extract title separately (it has special treatment)
    const titleMatch = slideXml.match(/<p:title>(.*?)<\/p:title>/s);
    if (titleMatch) {
      const titleContent = titleMatch[1];
      const titleTextMatches = titleContent.match(/<a:t>(.*?)<\/a:t>/g) || [];
      
      if (titleTextMatches.length > 0) {
        const titleText = titleTextMatches
          .map(t => t.replace(/<a:t>|<\/a:t>/g, ''))
          .join(' ')
          .trim();
        
        if (titleText) {
          textElements.push({
            type: 'title',
            text: titleText
          });
        }
      }
    }
    
    // Extract paragraphs from text bodies
    const textBodies = slideXml.match(/<p:txBody>(.*?)<\/p:txBody>/gs) || [];
    
    for (const textBody of textBodies) {
      // Skip if it's part of the title (we already processed title)
      if (textBody.includes('<p:title>')) continue;
      
      const paragraphs = textBody.match(/<a:p>(.*?)<\/a:p>/gs) || [];
      
      for (const paragraph of paragraphs) {
        const textMatches = paragraph.match(/<a:t>(.*?)<\/a:t>/g) || [];
        let paragraphText = '';
        
        for (const textMatch of textMatches) {
          paragraphText += textMatch.replace(/<a:t>|<\/a:t>/g, '');
        }
        
        // Skip empty paragraphs
        if (!paragraphText.trim()) continue;
        
        // Check if paragraph is a bullet point
        const isBullet = paragraph.includes('<a:buChar') || 
                         paragraph.includes('<a:buAutoNum') || 
                         paragraph.includes('<a:buNone="0"');
        
        textElements.push({
          type: isBullet ? 'bullet' : 'normal',
          text: paragraphText.trim()
        });
      }
    }
  } catch (err) {
    console.warn('Error extracting text elements:', err);
  }
  
  return textElements;
}

/**
 * Wrap text to fit canvas width
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {string} text - Text to wrap
 * @param {number} maxWidth - Maximum width
 * @param {number} fontSize - Font size
 * @returns {Array<string>} - Array of wrapped text lines
 */
function wrapText(ctx, text, maxWidth, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Convert Data URL to Uint8Array
 * @param {string} dataURL - Data URL string
 * @returns {Uint8Array} - Uint8Array of the binary data
 */
function dataURLToUint8Array(dataURL) {
  const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
  const binaryData = atob(base64Data);
  const bytes = new Uint8Array(binaryData.length);
  
  for (let i = 0; i < binaryData.length; i++) {
    bytes[i] = binaryData.charCodeAt(i);
  }
  
  return bytes;
}