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
 * Get canvas font string
 * @param {Object} run - Text run with formatting
 * @returns {string} - Canvas font string
 */
function getCanvasFont(run) {
  const fontWeight = run.isBold ? 'bold' : 'normal';
  const fontStyle = run.isItalic ? 'italic' : 'normal';
  return `${fontStyle} ${fontWeight} ${run.fontSize}px ${run.fontFamily}`;
}

/**
 * Draw slide text with fixed bullet point rendering and improved text wrapping
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Slide width
 * @param {number} height - Slide height
 * @param {string} slideXml - Slide XML
 */
async function drawSlideText(ctx, width, height, slideXml) {
  try {
    // Define standard conversion factor: 914400 EMUs = 1 inch, at 96 DPI, 1 inch = 96 pixels
    const EMU_TO_PIXEL = 96 / 914400;
    
    // Font fallback map
    const fontFallbackMap = {
      'Arial': 'Arial, Helvetica, sans-serif',
      'Calibri': 'Calibri, Arial, sans-serif',
      'default': 'Arial, Helvetica, sans-serif'
    };
    
    // Extract text shapes - using a more robust pattern to capture all text
    const textShapes = slideXml.match(/<p:sp[^>]*>[\s\S]*?<p:txBody>[\s\S]*?<\/p:txBody>[\s\S]*?<\/p:sp>/g) || [];
    if (textShapes.length === 0) return;
    
    console.log(`Found ${textShapes.length} text shapes to process`);
    
    // First pass to analyze shapes
    const shapeInfo = [];
    
    for (const shapeXml of textShapes) {
      try {
        // Get position and size
        const xfrmMatch = shapeXml.match(/<a:xfrm[\s\S]*?<a:off\s+x="(\d+)"\s+y="(\d+)"[\s\S]*?<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);
        if (!xfrmMatch) continue;
        
        // Apply conversion
        const x = parseInt(xfrmMatch[1]) * EMU_TO_PIXEL;
        const y = parseInt(xfrmMatch[2]) * EMU_TO_PIXEL;
        const boxWidth = parseInt(xfrmMatch[3]) * EMU_TO_PIXEL;
        const boxHeight = parseInt(xfrmMatch[4]) * EMU_TO_PIXEL;
        
        // Check placeholder type
        const nvSpPrMatch = shapeXml.match(/<p:nvSpPr>[\s\S]*?<\/p:nvSpPr>/);
        let placeholderType = null;
        let shapeName = "text";
        
        if (nvSpPrMatch) {
          const phTypeMatch = nvSpPrMatch[0].match(/<p:ph\s+type="([^"]*)"/);
          if (phTypeMatch) {
            placeholderType = phTypeMatch[1];
          }
          
          const nameMatch = nvSpPrMatch[0].match(/<p:cNvPr\s+id="\d+"\s+name="([^"]*)"/);
          if (nameMatch) {
            shapeName = nameMatch[1];
          }
        }
        
        // Extract text body
        const txBodyMatch = shapeXml.match(/<p:txBody>([\s\S]*?)<\/p:txBody>/);
        if (!txBodyMatch) continue;
        
        // Store shape info
        shapeInfo.push({
          x, y, boxWidth, boxHeight,
          placeholderType,
          shapeName,
          isTitle: placeholderType === 'title' || 
                  placeholderType === 'ctrTitle' || 
                  shapeXml.includes('type="title"'),
          isSubtitle: placeholderType === 'subTitle',
          textBody: txBodyMatch[1],
          shape: shapeXml
        });
      } catch (err) {
        console.warn('Error analyzing text shape:', err);
      }
    }
    
    // Sort shapes by vertical position
    shapeInfo.sort((a, b) => a.y - b.y);
    
    // Process each shape
    for (const info of shapeInfo) {
      try {
        // Get position and size
        const x = info.x;
        const y = info.y;
        const boxWidth = info.boxWidth;
        const boxHeight = info.boxHeight;
        
        console.log(`Processing text shape: ${info.shapeName} at (${Math.round(x)}, ${Math.round(y)}) size: ${Math.round(boxWidth)}x${Math.round(boxHeight)}`);
        
        // Extract paragraphs with a more robust pattern
        const paragraphs = info.textBody.match(/<a:p>[\s\S]*?<\/a:p>/g) || [];
        if (paragraphs.length === 0) continue;
        
        // Set default font properties
        let defaultFontSize = 18; // Regular text
        if (info.isTitle) defaultFontSize = 32;
        else if (info.isSubtitle) defaultFontSize = 24;
        
        // Check vertical alignment
        let verticalAlignment = 'top'; // Default
        const textVertAlign = info.textBody.match(/<a:bodyPr[^>]*anchor="([^"]*)"/);
        if (textVertAlign) {
          if (textVertAlign[1] === 'ctr') verticalAlignment = 'middle';
          else if (textVertAlign[1] === 'b') verticalAlignment = 'bottom';
        }
        
        // Debug - draw shape boundary
        // ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        // ctx.lineWidth = 1;
        // ctx.strokeRect(x, y, boxWidth, boxHeight);
        
        // Precompute paragraph heights for better layout
        let totalTextHeight = 0;
        const paragraphsInfo = [];
        
        for (const paragraph of paragraphs) {
          // Get paragraph style
          let lineSpacing = 1.2; // Default
          let beforeSpacing = 0;
          let afterSpacing = 0;
          let alignment = 'left';
          let indentLevel = 0;
          let isBullet = false;
          let bulletChar = '•';
          
          // Extract paragraph properties
          const pPrMatch = paragraph.match(/<a:pPr[^>]*>/);
          if (pPrMatch) {
            // Line spacing
            const lnSpcMatch = paragraph.match(/<a:lnSpc><a:spcPct\s+val="(\d+)"/);
            if (lnSpcMatch) {
              lineSpacing = parseInt(lnSpcMatch[1]) / 100000;
            }
            
            // Spacing before
            const spcBMatch = paragraph.match(/<a:spcBef><a:spcPts\s+val="(\d+)"/);
            if (spcBMatch) {
              beforeSpacing = parseInt(spcBMatch[1]) / 100;
            }
            
            // Spacing after
            const spcAMatch = paragraph.match(/<a:spcAft><a:spcPts\s+val="(\d+)"/);
            if (spcAMatch) {
              afterSpacing = parseInt(spcAMatch[1]) / 100;
            }
            
            // Alignment
            const algnMatch = paragraph.match(/algn="([^"]*)"/);
            if (algnMatch) {
              if (algnMatch[1] === 'ctr') alignment = 'center';
              else if (algnMatch[1] === 'r') alignment = 'right';
              else alignment = 'left';
            }
            
            // Indent level - critical for bullet points
            const lvlMatch = paragraph.match(/<a:pPr\s+lvl="(\d+)"/);
            if (lvlMatch) {
              indentLevel = parseInt(lvlMatch[1]);
            }
            
            // Check for bullet point
            isBullet = paragraph.includes('<a:buChar') || 
                      paragraph.includes('<a:buAutoNum') ||
                      paragraph.includes('<a:buFont');
            
            if (isBullet) {
              const buCharMatch = paragraph.match(/<a:buChar\s+char="([^"]*)"/);
              if (buCharMatch) {
                bulletChar = buCharMatch[1];
              }
            }
          }
          
          // Extract text runs
          const textRuns = paragraph.match(/<a:r>[\s\S]*?<\/a:r>/g) || [];
          let maxFontSize = defaultFontSize;
          
          // Find max font size
          for (const run of textRuns) {
            const szMatch = run.match(/<a:sz\s+val="(\d+)"/);
            if (szMatch) {
              const fontSize = parseInt(szMatch[1]) / 100;
              maxFontSize = Math.max(maxFontSize, fontSize);
            }
          }
          
          // Store paragraph info
          paragraphsInfo.push({
            paragraph,
            lineSpacing,
            beforeSpacing,
            afterSpacing,
            alignment,
            indentLevel,
            isBullet,
            bulletChar,
            maxFontSize,
            textRuns
          });
          
          // Estimate height
          const lineHeight = maxFontSize * lineSpacing;
          const estimatedNumLines = estimateNumberOfLines(paragraph, boxWidth, maxFontSize, ctx, indentLevel, isBullet);
          const paragraphHeight = beforeSpacing + (estimatedNumLines * lineHeight) + afterSpacing + (maxFontSize * 0.2);
          
          totalTextHeight += paragraphHeight;
        }
        
        // Apply vertical alignment
        let yOffset = 2; // Small initial offset
        
        if (verticalAlignment === 'middle') {
          yOffset = (boxHeight - totalTextHeight) / 2;
        } else if (verticalAlignment === 'bottom') {
          yOffset = boxHeight - totalTextHeight - 5;
// Ensure minimum offset
yOffset = Math.max(yOffset, 2);
        
// Render each paragraph
for (const pInfo of paragraphsInfo) {
  const {
    paragraph, lineSpacing, beforeSpacing, afterSpacing,
    alignment, indentLevel, isBullet, bulletChar, maxFontSize, textRuns
  } = pInfo;
  
  // Add before spacing
  yOffset += beforeSpacing;
  
  // Calculate line height
  const lineHeight = maxFontSize * lineSpacing;
  
  // Skip if no text runs
  if (textRuns.length === 0) {
    yOffset += lineHeight + afterSpacing;
    continue;
  }
  
  // Process text runs
  const processedRuns = processTextRuns(textRuns, defaultFontSize, fontFallbackMap);
  
  // Skip if no processed runs
  if (processedRuns.length === 0) {
    yOffset += lineHeight + afterSpacing;
    continue;
  }
  
  // Calculate bullet indent - critical for hierarchical lists
  // Use a more prominent indentation that scales with level
  const baseIndent = maxFontSize * 1.2;
  const levelIndent = maxFontSize * 0.8; // Indent per level
  const bulletIndent = baseIndent + (indentLevel * levelIndent);
  
  // Calculate available width
  let availableWidth = boxWidth - 10; // 5px margin on each side
  
  // If bullet point with left alignment, adjust width
  if (isBullet && alignment === 'left') {
    availableWidth -= bulletIndent;
  } else if (indentLevel > 0) {
    // For non-bullet indented text
    availableWidth -= (indentLevel * levelIndent);
  }
  
  // Get combined text for line wrapping
  const combinedText = processedRuns.map(r => r.text).join('');
  
  // Set font for measuring
  const firstRun = processedRuns[0];
  ctx.font = getCanvasFont(firstRun);
  
  // Wrap text into lines
  const lines = wrapText(combinedText, availableWidth, ctx);
  
  // Render each line
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    // Calculate base X position based on alignment
    let lineX = x + 5; // Default left margin
    
    if (alignment === 'center') {
      lineX = x + (boxWidth / 2);
    } else if (alignment === 'right') {
      lineX = x + boxWidth - 5;
    }
    
    // Apply indentation for hierarchical bullet points
    if (alignment === 'left') {
      if (isBullet) {
        // Draw bullet on first line only
        if (lineIndex === 0) {
          // Calculate the exact bullet position based on indent level
          const bulletX = lineX + (indentLevel * levelIndent);
          
          // Ensure consistent bullet style
          ctx.font = `${maxFontSize}px Arial`;
          ctx.fillStyle = firstRun.color;
          ctx.textBaseline = 'top';
          ctx.textAlign = 'left';
          
          // Draw the bullet
          ctx.fillText(bulletChar, bulletX, y + yOffset);
        }
        
        // Indent text - all lines in a bullet point
        lineX += bulletIndent;
      } else if (indentLevel > 0) {
        // For non-bullet indented text
        lineX += (indentLevel * levelIndent);
      }
    }
    
    // Set text properties
    ctx.font = getCanvasFont(firstRun);
    ctx.fillStyle = firstRun.color;
    ctx.textBaseline = 'top';
    ctx.textAlign = alignment;
    
    // Draw text
    ctx.fillText(line, lineX, y + yOffset);
    
    // Draw underline if needed
    if (firstRun.isUnderline) {
      drawTextUnderline(ctx, line, lineX, y + yOffset, firstRun, alignment);
    }
    
    // Move to next line
    yOffset += lineHeight;
  }
  
  // Add after spacing
  yOffset += afterSpacing;
  
  // Add space between paragraphs
  yOffset += maxFontSize * 0.2;
}
} catch (err) {
console.error('Error rendering text shape:', err);
}
}
} catch (err) {
console.error('Error in drawSlideText:', err);
}
}

/**
* Process text runs to extract formatting and ensure proper spacing
* @param {Array} textRuns - Array of text run XML strings
* @param {number} defaultFontSize - Default font size
* @param {Object} fontMap - Font fallback map
* @returns {Array} - Array of processed text runs with formatting
*/
function processTextRuns(textRuns, defaultFontSize, fontMap) {
const processedRuns = [];

for (let i = 0; i < textRuns.length; i++) {
const run = textRuns[i];

// Extract text content
const textMatch = run.match(/<a:t(?:\s+xml:space="preserve")?>([\s\S]*?)<\/a:t>/);
if (!textMatch) continue;

const preserveSpaces = run.includes('xml:space="preserve"');

// Decode text content
let text = textMatch[1]
.replace(/&lt;/g, '<')
.replace(/&gt;/g, '>')
.replace(/&amp;/g, '&')
.replace(/&quot;/g, '"')
.replace(/&apos;/g, "'")
.replace(/&#x([0-9A-F]+);/gi, (match, hex) => String.fromCodePoint(parseInt(hex, 16)));

// Handle spaces
if (!preserveSpaces) {
text = text.replace(/\s+/g, ' ');
}

// If empty, skip
if (!text) continue;

// Calculate if we need to add a space between runs
let prefix = '';

if (i > 0 && processedRuns.length > 0) {
const prevRun = processedRuns[processedRuns.length - 1];
const prevText = prevRun.text;

// This regex checks if text starts with whitespace or punctuation
if (!text.match(/^[\s,.;:!?()[\]{}'"]/)) {
// This regex checks if previous text ends with whitespace or punctuation
if (!prevText.match(/[\s,.;:!?()[\]{}'"']$/)) {
  prefix = ' ';
}
}
}

// Extract formatting
let fontSize = defaultFontSize;
const szMatch = run.match(/<a:sz\s+val="(\d+)"/);
if (szMatch) {
fontSize = parseInt(szMatch[1]) / 100;
}

// Text formatting
const isBold = run.includes('<a:b/>') || run.includes('<a:b val="1"/>');
const isItalic = run.includes('<a:i/>') || run.includes('<a:i val="1"/>');
const isUnderline = run.includes('<a:u/>') || run.includes('<a:u val="sng"/>');

// Text color
let textColor = '#000000'; // Default
const colorMatch = run.match(/<a:solidFill>[\s\S]*?<a:srgbClr\s+val="([A-Fa-f0-9]{6})"/);
if (colorMatch) {
textColor = `#${colorMatch[1]}`;
}

// Font family
let fontFamily = fontMap.default;
const fontMatch = run.match(/<a:latin\s+typeface="([^"]*)"/);
if (fontMatch) {
const fontName = fontMatch[1];
fontFamily = fontMap[fontName] || fontMap.default;
}

// Add processed run
processedRuns.push({
text: prefix + text,
fontSize,
isBold,
isItalic,
isUnderline,
color: textColor,
fontFamily
});
}

return processedRuns;
}

/**
* Wrap text into lines that fit available width
* @param {string} text - Text to wrap
* @param {number} maxWidth - Maximum width in pixels
* @param {CanvasRenderingContext2D} ctx - Canvas context for measuring
* @returns {Array} - Array of wrapped lines
*/
function wrapText(text, maxWidth, ctx) {
// Handle extra-long words by allowing them to extend beyond maxWidth
const words = text.split(' ');
const lines = [];
let currentLine = '';

// Check if there's any text to process
if (!text.trim()) {
return lines;
}

for (const word of words) {
if (!word) continue;

const testLine = currentLine ? `${currentLine} ${word}` : word;
const metrics = ctx.measureText(testLine);

if (metrics.width > maxWidth && currentLine) {
lines.push(currentLine);
currentLine = word;
} else {
currentLine = testLine;
}
}

// Add the last line
if (currentLine) {
lines.push(currentLine);
}

// If somehow we ended up with nothing, use original text
if (lines.length === 0 && text.trim()) {
lines.push(text.trim());
}

return lines;
}

/**
* Draw underline for text
* @param {CanvasRenderingContext2D} ctx - Canvas context
* @param {string} text - Text to underline
* @param {number} x - X position
* @param {number} y - Y position
* @param {Object} run - Text run with formatting
* @param {string} alignment - Text alignment
*/
function drawTextUnderline(ctx, text, x, y, run, alignment) {
const metrics = ctx.measureText(text);
const underlineY = y + run.fontSize + 1;

ctx.beginPath();

if (alignment === 'left') {
ctx.moveTo(x, underlineY);
ctx.lineTo(x + metrics.width, underlineY);
} else if (alignment === 'center') {
ctx.moveTo(x - metrics.width / 2, underlineY);
ctx.lineTo(x + metrics.width / 2, underlineY);
} else if (alignment === 'right') {
ctx.moveTo(x - metrics.width, underlineY);
ctx.lineTo(x, underlineY);
}

ctx.strokeStyle = run.color;
ctx.lineWidth = 1;
ctx.stroke();
}

/**
* Estimate the number of lines a paragraph will take
* @param {string} paragraph - Paragraph XML
* @param {number} maxWidth - Maximum width
* @param {number} fontSize - Font size
* @param {CanvasRenderingContext2D} ctx - Canvas context
* @param {number} indentLevel - Indent level
* @param {boolean} isBullet - Is bullet point
* @returns {number} - Estimated number of lines
*/
function estimateNumberOfLines(paragraph, maxWidth, fontSize, ctx, indentLevel, isBullet) {
try {
// Extract all text
const textMatches = paragraph.match(/<a:t(?:\s+xml:space="preserve")?>([\s\S]*?)<\/a:t>/g) || [];
let combinedText = '';

// Process each text element
for (const match of textMatches) {
const contentMatch = match.match(/<a:t(?:\s+xml:space="preserve")?>([\s\S]*?)<\/a:t>/);
if (contentMatch) {
combinedText += contentMatch[1]
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'");
}
}

// Calculate available width
let availableWidth = maxWidth - 10; // 5px margin on each side

if (isBullet) {
// More generous indent for bullet points
availableWidth -= (fontSize * 1.2 + indentLevel * fontSize * 0.8);
} else if (indentLevel > 0) {
// For non-bullet indented text
availableWidth -= (indentLevel * fontSize * 0.8);
}

// Set font for measuring
ctx.font = `${fontSize}px Arial`;

// Count how many lines this would take
const words = combinedText.split(' ');
let numLines = 1;
let currentLine = '';

for (const word of words) {
if (!word) continue;

const testLine = currentLine ? `${currentLine} ${word}` : word;
const metrics = ctx.measureText(testLine);

if (metrics.width > availableWidth && currentLine) {
numLines++;
currentLine = word;
} else {
currentLine = testLine;
}
}

return Math.max(1, numLines); // At least 1 line
} catch (err) {
console.warn('Error estimating lines:', err);
return 1; // Default to 1 line on error
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