// src/components/FileConverter/pptConverter.js
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';

/**
 * Convert PowerPoint to PDF using simpler approach with comprehensive slide rendering
 * @param {ArrayBuffer} fileBuffer - PowerPoint file as ArrayBuffer
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<ArrayBuffer>} - PDF file as ArrayBuffer
 */
export const convertPptToPdf = async (fileBuffer, progressCallback) => {
  try {
    progressCallback(10);
    console.log('Starting PowerPoint to PDF conversion');
    
    // Extract PPTX content using JSZip
    const zip = new JSZip();
    const pptxContent = await zip.loadAsync(fileBuffer);
    
    // Get presentation dimensions from presentation.xml
    let slideWidth = 960;  // Default 16:9 width
    let slideHeight = 540; // Default 16:9 height
    
    try {
      const presentationFile = pptxContent.file('ppt/presentation.xml');
      if (presentationFile) {
        const presentationXml = await presentationFile.async('text');
        // Try to extract slide dimensions
        const sldSzMatch = presentationXml.match(/<p:sldSz cx="(\d+)" cy="(\d+)"/);
        if (sldSzMatch) {
          // Convert EMUs to pixels at 96 DPI
          const emuToPixel = 96 / 914400;
          slideWidth = Math.round(parseInt(sldSzMatch[1]) * emuToPixel);
          slideHeight = Math.round(parseInt(sldSzMatch[2]) * emuToPixel);
          console.log(`Extracted slide dimensions: ${slideWidth}x${slideHeight}`);
        }
      }
    } catch (err) {
      console.warn('Error extracting slide size:', err);
      // Continue with default dimensions
    }
    
    // Find all slide files and sort them by number
    const slideFiles = Object.keys(pptxContent.files)
      .filter(path => path.match(/ppt\/slides\/slide\d+\.xml$/))
      .map(path => {
        const match = path.match(/slide(\d+)\.xml$/);
        return {
          path,
          number: parseInt(match[1], 10)
        };
      })
      .sort((a, b) => a.number - b.number);
    
    if (slideFiles.length === 0) {
      throw new Error('No slides found in the presentation');
    }
    
    console.log(`Found ${slideFiles.length} slides`);
    progressCallback(20);
    
    // Load all media files
    const mediaFiles = await preloadMediaFiles(pptxContent);
    console.log(`Loaded ${Object.keys(mediaFiles).length} media files`);
    
    // Create a PDF document
    const pdfDoc = await PDFDocument.create();
    
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
      console.log(`Processing slide ${slideNumber}`);
      
      try {
        // Clear canvas
        ctx.clearRect(0, 0, slideWidth, slideHeight);
        
        // Get slide content
        const slideXml = await pptxContent.file(slideFile.path).async('text');
        
        // Load slide relationships
        const slideRels = await loadSlideRelationships(pptxContent, slideNumber);
        
        // Step 1: Draw slide background
        await drawSlideBackground(ctx, slideWidth, slideHeight, slideXml, slideRels, pptxContent, mediaFiles);
        
        // Step 2: Draw shapes (excluding text shapes)
        await drawSlideShapes(ctx, slideWidth, slideHeight, slideXml, slideRels, mediaFiles);
        
        // Step 3: Draw images
        await drawSlideImages(ctx, slideWidth, slideHeight, slideXml, slideRels, mediaFiles);
        
        // Step 4: Draw text elements
        await drawSlideText(ctx, slideWidth, slideHeight, slideXml);
        
        // Convert canvas to PNG image
        const slideImageDataUrl = canvas.toDataURL('image/png');
        
        // Convert data URL to bytes
        const slideImageBytes = dataURLToBytes(slideImageDataUrl);
        
        // Add page to PDF with the slide image
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
        
        // Add error slide
        const errorPage = pdfDoc.addPage([slideWidth, slideHeight]);
        
        // Create an error message on the page
        const font = await pdfDoc.embedFont('Helvetica');
        errorPage.drawText(`Error processing slide ${slideNumber}: ${slideErr.message}`, {
          x: 50,
          y: slideHeight - 100,
          size: 12,
          font
        });
      }
    }
    
    progressCallback(95);
    
    // Generate PDF
    const pdfBytes = await pdfDoc.save();
    
    // Cleanup
    Object.keys(mediaFiles).forEach(key => {
      if (mediaFiles[key].url) {
        URL.revokeObjectURL(mediaFiles[key].url);
      }
    });
    
    progressCallback(100);
    console.log('PowerPoint to PDF conversion complete');
    return pdfBytes;
  } catch (error) {
    console.error('Error converting PowerPoint to PDF:', error);
    throw new Error(`Failed to convert PowerPoint to PDF: ${error.message}`);
  }
};

/**
 * Load slide relationships
 * @param {JSZip} pptxContent - PPTX content
 * @param {number} slideNumber - Slide number
 * @returns {Promise<Object>} - Relationship mapping
 */
async function loadSlideRelationships(pptxContent, slideNumber) {
  const rels = {};
  
  try {
    const relPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
    const relFile = pptxContent.file(relPath);
    
    if (relFile) {
      const relXml = await relFile.async('text');
      
      // Extract relationship entries
      const relEntries = relXml.match(/<Relationship[^>]*>/g) || [];
      
      for (const entry of relEntries) {
        const idMatch = entry.match(/Id="([^"]+)"/);
        const targetMatch = entry.match(/Target="([^"]+)"/);
        const typeMatch = entry.match(/Type="([^"]+)"/);
        
        if (idMatch && targetMatch) {
          let target = targetMatch[1];
          
          // Normalize paths
          if (target.startsWith('../')) {
            target = `ppt/${target.substring(3)}`;
          } else if (!target.startsWith('/') && !target.startsWith('ppt/')) {
            target = `ppt/slides/${target}`;
          }
          
          rels[idMatch[1]] = {
            target: target,
            type: typeMatch ? typeMatch[1] : null
          };
        }
      }
    }
    
    return rels;
  } catch (err) {
    console.warn(`Error loading slide ${slideNumber} relationships:`, err);
    return rels;
  }
}

/**
 * Preload all media files
 * @param {JSZip} pptxContent - PPTX content
 * @returns {Promise<Object>} - Media files map
 */
async function preloadMediaFiles(pptxContent) {
  const mediaFiles = {};
  
  try {
    // Find all media files
    const mediaPaths = Object.keys(pptxContent.files).filter(path => 
      path.startsWith('ppt/media/') && 
      (path.endsWith('.png') || path.endsWith('.jpg') || 
       path.endsWith('.jpeg') || path.endsWith('.gif') || 
       path.endsWith('.svg'))
    );
    
    // Load each file
    for (const path of mediaPaths) {
      try {
        const file = pptxContent.file(path);
        if (file) {
          const buffer = await file.async('arraybuffer');
          const blob = new Blob([buffer], { type: getMimeType(path) });
          const url = URL.createObjectURL(blob);
          
          // Create image element
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
          });
          
          mediaFiles[path] = {
            url: url,
            img: img,
            width: img.width,
            height: img.height
          };
        }
      } catch (err) {
        console.warn(`Error loading media file ${path}:`, err);
      }
    }
    
    return mediaFiles;
  } catch (err) {
    console.warn('Error preloading media files:', err);
    return mediaFiles;
  }
}

/**
 * Draw slide background
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Slide width
 * @param {number} height - Slide height
 * @param {string} slideXml - Slide XML
 * @param {Object} slideRels - Slide relationships
 * @param {JSZip} pptxContent - PPTX content
 * @param {Object} mediaFiles - Preloaded media files
 */
async function drawSlideBackground(ctx, width, height, slideXml, slideRels, pptxContent, mediaFiles) {
  // Default white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  
  try {
    // Check for solid color background
    const bgColorMatch = slideXml.match(/<p:bg>.*?<a:solidFill>.*?<a:srgbClr\s+val="([A-Fa-f0-9]{6})"/s);
    if (bgColorMatch) {
      ctx.fillStyle = `#${bgColorMatch[1]}`;
      ctx.fillRect(0, 0, width, height);
      return;
    }
    
    // Check for background image
    const bgBlipMatch = slideXml.match(/<p:bg>.*?<a:blip\s+r:embed="(rId\d+)"/s);
    if (bgBlipMatch && slideRels[bgBlipMatch[1]]) {
      const imagePath = slideRels[bgBlipMatch[1]].target;
      
      if (mediaFiles[imagePath]) {
        // Draw background image to fit slide
        ctx.drawImage(mediaFiles[imagePath].img, 0, 0, width, height);
        return;
      }
    }
    
    // Check for slide layout
    // If no background is defined in the slide, we could check the slide layout and master
    // This is a complex operation and might not be necessary for most slides
  } catch (err) {
    console.warn('Error drawing slide background:', err);
  }
}

/**
 * Draw slide shapes
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Slide width
 * @param {number} height - Slide height
 * @param {string} slideXml - Slide XML
 * @param {Object} slideRels - Slide relationships
 * @param {Object} mediaFiles - Preloaded media files
 */
async function drawSlideShapes(ctx, width, height, slideXml, slideRels, mediaFiles) {
  try {
    // Extract shapes (excluding text shapes)
    const shapeElements = slideXml.match(/<p:sp[^>]*>(?!.*<p:txBody>).*?<\/p:sp>/gs) || [];
    
    // Process each shape
    for (const shapeXml of shapeElements) {
      try {
        // Extract shape properties
        const xfrmMatch = shapeXml.match(/<a:xfrm[^>]*>(.*?)<\/a:xfrm>/s);
        if (!xfrmMatch) continue;
        
        // Get position and size
        const offMatch = xfrmMatch[1].match(/<a:off\s+x="(\d+)"\s+y="(\d+)"/);
        const extMatch = xfrmMatch[1].match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);
        
        if (!offMatch || !extMatch) continue;
        
        // Convert EMUs to pixels
        const emuToPixel = 96 / 914400; // 96 DPI
        const x = parseInt(offMatch[1]) * emuToPixel;
        const y = parseInt(offMatch[2]) * emuToPixel;
        const w = parseInt(extMatch[1]) * emuToPixel;
        const h = parseInt(extMatch[2]) * emuToPixel;
        
        // Get shape type
        let shapeType = 'rect'; // Default
        const prstMatch = shapeXml.match(/prst="([^"]+)"/);
        if (prstMatch) {
          // Map PowerPoint shape presets to simple canvas shapes
          switch (prstMatch[1]) {
            case 'ellipse':
              shapeType = 'ellipse';
              break;
            case 'roundRect':
              shapeType = 'roundRect';
              break;
            // Add more shape types as needed
          }
        }
        
        // Get fill color
        let fillColor = null;
        const fillMatch = shapeXml.match(/<a:solidFill>.*?<a:srgbClr\s+val="([A-Fa-f0-9]{6})"/s);
        if (fillMatch) {
          fillColor = `#${fillMatch[1]}`;
        }
        
        // Get line color and width
        let strokeColor = null;
        let lineWidth = 1;
        const lnMatch = shapeXml.match(/<a:ln\s+w="(\d+)".*?<a:solidFill>.*?<a:srgbClr\s+val="([A-Fa-f0-9]{6})"/s);
        if (lnMatch) {
          lineWidth = parseInt(lnMatch[1]) / 12700; // Convert to points
          strokeColor = `#${lnMatch[2]}`;
        }
        
        // Draw the shape
        ctx.fillStyle = fillColor || 'transparent';
        ctx.strokeStyle = strokeColor || 'transparent';
        ctx.lineWidth = lineWidth;
        
        if (shapeType === 'rect') {
          if (fillColor) ctx.fillRect(x, y, w, h);
          if (strokeColor) ctx.strokeRect(x, y, w, h);
        } else if (shapeType === 'ellipse') {
          ctx.beginPath();
          ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
          if (fillColor) ctx.fill();
          if (strokeColor) ctx.stroke();
        } else if (shapeType === 'roundRect') {
          const radius = Math.min(w, h) * 0.1; // 10% of smaller dimension
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + w - radius, y);
          ctx.arcTo(x + w, y, x + w, y + radius, radius);
          ctx.lineTo(x + w, y + h - radius);
          ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
          ctx.lineTo(x + radius, y + h);
          ctx.arcTo(x, y + h, x, y + h - radius, radius);
          ctx.lineTo(x, y + radius);
          ctx.arcTo(x, y, x + radius, y, radius);
          ctx.closePath();
          if (fillColor) ctx.fill();
          if (strokeColor) ctx.stroke();
        }
      } catch (shapeErr) {
        console.warn('Error drawing shape:', shapeErr);
      }
    }
  } catch (err) {
    console.warn('Error drawing slide shapes:', err);
  }
}

/**
 * Draw slide images
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Slide width
 * @param {number} height - Slide height
 * @param {string} slideXml - Slide XML
 * @param {Object} slideRels - Slide relationships
 * @param {Object} mediaFiles - Preloaded media files
 */
async function drawSlideImages(ctx, width, height, slideXml, slideRels, mediaFiles) {
  try {
    // Extract picture elements
    const picElements = slideXml.match(/<p:pic[^>]*>.*?<\/p:pic>/gs) || [];
    
    // Process each picture
    for (const picXml of picElements) {
      try {
        // Extract image relationship ID
        const blipMatch = picXml.match(/<a:blip\s+r:embed="(rId\d+)"/);
        if (!blipMatch || !slideRels[blipMatch[1]]) continue;
        
        const imagePath = slideRels[blipMatch[1]].target;
        if (!mediaFiles[imagePath]) continue;
        
        // Get position and size
        const xfrmMatch = picXml.match(/<a:xfrm[^>]*>(.*?)<\/a:xfrm>/s);
        if (!xfrmMatch) continue;
        
        // Get position and size
        const offMatch = xfrmMatch[1].match(/<a:off\s+x="(\d+)"\s+y="(\d+)"/);
        const extMatch = xfrmMatch[1].match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);
        
        if (!offMatch || !extMatch) continue;
        
        // Convert EMUs to pixels
        const emuToPixel = 96 / 914400; // 96 DPI
        const x = parseInt(offMatch[1]) * emuToPixel;
        const y = parseInt(offMatch[2]) * emuToPixel;
        const w = parseInt(extMatch[1]) * emuToPixel;
        const h = parseInt(extMatch[2]) * emuToPixel;
        
        // Draw the image
        ctx.drawImage(mediaFiles[imagePath].img, x, y, w, h);
      } catch (imgErr) {
        console.warn('Error drawing image:', imgErr);
      }
    }
  } catch (err) {
    console.warn('Error drawing slide images:', err);
  }
}

/**
 * Helper function to extract text with proper spacing
 * @param {string} textXml - XML containing text
 * @returns {string} - Properly extracted text
 */
function extractTextWithProperSpacing(textXml) {
  if (!textXml) return '';
  
  // Check if this is a text with preserved spaces
  const preserveSpaces = textXml.includes('xml:space="preserve"');
  
  // Extract the actual text content
  const match = textXml.match(/<a:t(?:\s+[^>]*)?>([^<]*)<\/a:t>/);
  if (!match) return '';
  
  // Decode XML entities
  let text = match[1]
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-F]+);/gi, (match, hex) => String.fromCodePoint(parseInt(hex, 16)));
  
  // If spaces should be preserved, don't normalize
  if (!preserveSpaces) {
    // Normalize whitespace (but don't trim, as it might be significant)
    text = text.replace(/\s+/g, ' ');
  }
  
  return text;
}

/**
 * Draw slide text with proper spacing between words
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Slide width
 * @param {number} height - Slide height
 * @param {string} slideXml - Slide XML
 */
async function drawSlideText(ctx, width, height, slideXml) {
  try {
    // Extract text shapes
    const textShapes = slideXml.match(/<p:sp[^>]*>.*?<p:txBody>.*?<\/p:txBody>.*?<\/p:sp>/gs) || [];
    
    // Process each text shape
    for (const shapeXml of textShapes) {
      try {
        // Extract text body
        const txBodyMatch = shapeXml.match(/<p:txBody>(.*?)<\/p:txBody>/s);
        if (!txBodyMatch) continue;
        
        // Get position and size
        const xfrmMatch = shapeXml.match(/<a:xfrm[^>]*>(.*?)<\/a:xfrm>/s);
        if (!xfrmMatch) continue;
        
        const offMatch = xfrmMatch[1].match(/<a:off\s+x="(\d+)"\s+y="(\d+)"/);
        const extMatch = xfrmMatch[1].match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);
        
        if (!offMatch || !extMatch) continue;
        
        // Check if this is a placeholder and what type
        const nvSpPrMatch = shapeXml.match(/<p:nvSpPr>.*?<\/p:nvSpPr>/s);
        let placeholderType = null;
        if (nvSpPrMatch) {
          const phTypeMatch = nvSpPrMatch[0].match(/<p:ph\s+type="([^"]*)"/);
          if (phTypeMatch) {
            placeholderType = phTypeMatch[1];
          }
        }
        
        // Convert EMUs to pixels (1 inch = 914400 EMUs, assuming 96 DPI)
        const emuToPixel = 96 / 914400;
        const x = parseInt(offMatch[1]) * emuToPixel;
        const y = parseInt(offMatch[2]) * emuToPixel;
        const boxWidth = parseInt(extMatch[1]) * emuToPixel;
        const boxHeight = parseInt(extMatch[2]) * emuToPixel;
        
        // Extract paragraphs
        const paragraphs = txBodyMatch[1].match(/<a:p>.*?<\/a:p>/gs) || [];
        if (paragraphs.length === 0) continue;
        
        // Determine if this is a title based on placeholder type or other cues
        const isTitle = placeholderType === 'title' || 
                      placeholderType === 'ctrTitle' || 
                      shapeXml.includes('type="title"');
                      
        const isSubtitle = placeholderType === 'subTitle';
        
        // Process paragraphs
        let yOffset = 5; // Start with a small top margin
        const defaultLineHeight = 1.2; // Standard line height multiplier
        
        // Set default font properties based on shape type
        let defaultFontSize = 18; // Regular text
        if (isTitle) defaultFontSize = 32;
        else if (isSubtitle) defaultFontSize = 24;
        
        for (const paragraph of paragraphs) {
          // Get paragraph style for vertical spacing
          let lineSpacing = defaultLineHeight;
          let beforeSpacing = 0;
          let afterSpacing = 0;
          
          const pPrMatch = paragraph.match(/<a:pPr[^>]*>/);
          if (pPrMatch) {
            // Find line spacing if specified
            const lnSpcMatch = paragraph.match(/<a:lnSpc><a:spcPct\s+val="(\d+)"/);
            if (lnSpcMatch) {
              // Line spacing is in percentage (1000 = 100%)
              lineSpacing = parseInt(lnSpcMatch[1]) / 100000;
            }
            
            // Find spacing before paragraph
            const spcBMatch = paragraph.match(/<a:spcBef><a:spcPts\s+val="(\d+)"/);
            if (spcBMatch) {
              beforeSpacing = parseInt(spcBMatch[1]) / 100; // Convert to points
            }
            
            // Find spacing after paragraph
            const spcAMatch = paragraph.match(/<a:spcAft><a:spcPts\s+val="(\d+)"/);
            if (spcAMatch) {
              afterSpacing = parseInt(spcAMatch[1]) / 100; // Convert to points
            }
          }
          
          // Add before spacing
          yOffset += beforeSpacing;
          
          // Get paragraph alignment
          let alignment = 'left';
          const algnMatch = paragraph.match(/<a:pPr[^>]*algn="([^"]*)"/);
          if (algnMatch) {
            // Map PowerPoint alignment to canvas
            if (algnMatch[1] === 'ctr') alignment = 'center';
            else if (algnMatch[1] === 'r') alignment = 'right';
          }
          
          // Check if this is a bullet point
          const isBullet = paragraph.includes('<a:buChar') || 
                          paragraph.includes('<a:buAutoNum') ||
                          paragraph.includes('<a:buFont');
          
          let bulletChar = '•';
          const buCharMatch = paragraph.match(/<a:buChar\s+char="([^"]*)"/);
          if (buCharMatch) {
            bulletChar = buCharMatch[1];
          }
          
          // Extract text runs with improved handling of spaces
          const textRuns = paragraph.match(/<a:r>.*?<\/a:r>/gs) || [];
          if (textRuns.length === 0) {
            // Empty paragraph
            yOffset += defaultFontSize * lineSpacing;
            yOffset += afterSpacing;
            continue;
          }
          
          // Extract and process each text run
          let processedRuns = [];
          
          for (let i = 0; i < textRuns.length; i++) {
            const run = textRuns[i];
            
            // Extract text content with proper spacing
            const textElement = run.match(/<a:t(?:\s+[^>]*)?>([^<]*)<\/a:t>/);
            if (!textElement) continue;
            
            // Extract text with proper spacing
            const text = extractTextWithProperSpacing(run);
            if (!text) continue;
            
            // Extract formatting
            let fontSize = defaultFontSize;
            const szMatch = run.match(/<a:sz\s+val="(\d+)"/);
            if (szMatch) {
              fontSize = parseInt(szMatch[1]) / 100; // Convert from PPTX units
            }
            
            // Check for bold text
            const isBold = run.includes('<a:b/>') || run.includes('<a:b val="1"/>');
            
            // Check for italic text
            const isItalic = run.includes('<a:i/>') || run.includes('<a:i val="1"/>');
            
            // Check for text color
            let textColor = '#000000'; // Default black
            const colorMatch = run.match(/<a:solidFill>.*?<a:srgbClr\s+val="([A-Fa-f0-9]{6})"/s);
            if (colorMatch) {
              textColor = `#${colorMatch[1]}`;
            }
            
            // Add spacing between runs if needed
            let prefix = '';
            
            // If this is not the first run and doesn't start with a space or punctuation,
            // and the previous run doesn't end with space or punctuation, add a space
            if (i > 0 && processedRuns.length > 0) {
              const prevRun = processedRuns[processedRuns.length - 1];
              const prevText = prevRun.text;
              
              if (!text.startsWith(' ') && 
                  !text.startsWith(',') && 
                  !text.startsWith('.') && 
                  !text.startsWith(';') && 
                  !text.startsWith(':') && 
                  !prevText.endsWith(' ') && 
                  !prevText.endsWith(',') && 
                  !prevText.endsWith('.') && 
                  !prevText.endsWith(';') && 
                  !prevText.endsWith(':')) {
                prefix = ' ';
              }
            }
            
            // Add the run with its formatting
            processedRuns.push({
              text: prefix + text,
              fontSize,
              isBold,
              isItalic,
              color: textColor
            });
          }
          
          // Skip if no valid text content
          if (processedRuns.length === 0) {
            yOffset += defaultFontSize * lineSpacing;
            yOffset += afterSpacing;
            continue;
          }
          
          // Combine all runs into a single paragraph text with proper spacing
          let combinedText = processedRuns.map(run => run.text).join('');
          
          // Use the largest font size for line height calculation
          const maxFontSize = Math.max(...processedRuns.map(run => run.fontSize));
          const lineHeight = maxFontSize * lineSpacing;
          
          // Set text style
          const firstRun = processedRuns[0];
          ctx.font = `${firstRun.isBold ? 'bold ' : ''}${firstRun.isItalic ? 'italic ' : ''}${firstRun.fontSize}px Arial`;
          ctx.fillStyle = firstRun.color;
          ctx.textBaseline = 'top';
          ctx.textAlign = alignment;
          
          // Calculate available text width
          let availableWidth = boxWidth - 10; // 5px margin on each side
          
          // If bullet point, add indent
          if (isBullet && alignment === 'left') {
            availableWidth -= maxFontSize * 1.5;
          }
          
          // Break text into lines
          const words = combinedText.split(' ');
          let lines = [];
          let currentLine = '';
          
          for (const word of words) {
            if (!word) continue;
            
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > availableWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          
          // Add the last line
          if (currentLine) lines.push(currentLine);
          
          // If no lines were created, force the text as a single line
          if (lines.length === 0 && combinedText.trim()) {
            lines = [combinedText.trim()];
          }
          
          // Draw each line
          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            
            // Calculate the starting x position based on alignment
            let lineX = x + 5; // Default left alignment with small margin
            
            if (alignment === 'center') {
              lineX = x + (boxWidth / 2);
            } else if (alignment === 'right') {
              lineX = x + boxWidth - 5;
            }
            
            // If it's a bullet point and it's the first line, add the bullet
            if (isBullet && lineIndex === 0) {
              if (alignment === 'left') {
                // Draw bullet
                ctx.fillText(bulletChar, lineX, y + yOffset);
                // Indent the text
                lineX += maxFontSize * 1.5;
              } else if (alignment === 'center') {
                // For center alignment, adjust the bullet position
                const textWidth = ctx.measureText(line).width;
                const bulletX = lineX - (textWidth / 2) - maxFontSize;
                ctx.fillText(bulletChar, bulletX, y + yOffset);
              } else if (alignment === 'right') {
                // For right alignment, place bullet before the text
                const textWidth = ctx.measureText(line).width;
                const bulletX = lineX - textWidth - maxFontSize;
                ctx.fillText(bulletChar, bulletX, y + yOffset);
              }
            }
            
            // Draw the text
            ctx.fillText(line, lineX, y + yOffset);
            
            // Move to next line
            yOffset += lineHeight;
          }
          
          // Add after spacing
          yOffset += afterSpacing;
          
          // Add extra space between paragraphs
          yOffset += maxFontSize * 0.3;
        }
      } catch (textErr) {
        console.warn('Error drawing text shape:', textErr);
      }
    }
  } catch (err) {
    console.warn('Error drawing slide text:', err);
  }
}

/**
 * Convert data URL to bytes
 * @param {string} dataUrl - Data URL string
 * @returns {Uint8Array} - Byte array
 */
function dataURLToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * Get MIME type from filename
 * @param {string} filename - Filename
 * @returns {string} - MIME type
 */
function getMimeType(filename) {
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.gif')) return 'image/gif';
  if (filename.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}