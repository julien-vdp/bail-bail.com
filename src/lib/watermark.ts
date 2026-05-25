import { PDFDocument, rgb, degrees } from "pdf-lib";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

/**
 * Applies a watermark on a PDF buffer:
 * - 3 diagonal bands (-35 degrees) running across the page.
 * - Each band contains the semi-transparent logo followed by the annotation text.
 */
export async function watermarkPdf(pdfBuffer: Buffer, watermarkText: string): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Load logo.png from public folder
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    let logoBuffer: Buffer;
    try {
      logoBuffer = await fs.readFile(logoPath);
    } catch (e) {
      console.error("Could not read logo.png, skipping logo watermark", e);
      return pdfBuffer;
    }

    // Resize the logo for the diagonal repeat
    const transparentLogoBuffer = await sharp(logoBuffer)
      .resize({ width: 120 })
      .png()
      .toBuffer();

    const pngImage = await pdfDoc.embedPng(transparentLogoBuffer);
    const pages = pdfDoc.getPages();

    const angle = -35;
    const radians = (angle * Math.PI) / 180;
    const logoWidth = 45; // Small clean logo in the repeated bands
    const logoHeight = (pngImage.height / pngImage.width) * logoWidth;
    
    // Calculate displacement vector along the -35 degree angle for the text to sit next to the logo
    const distance = logoWidth + 15;
    const dx = distance * Math.cos(radians);
    const dy = distance * Math.sin(radians);

    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = Math.max(11, Math.round(width * 0.03)); 

      // 3 heights on the page
      const bands = [0.75, 0.50, 0.25];

      for (const yFactor of bands) {
        const x_base = width * 0.12;
        const y_base = height * yFactor;

        // 1. Draw logo rotated
        page.drawImage(pngImage, {
          x: x_base,
          y: y_base,
          width: logoWidth,
          height: logoHeight,
          opacity: 0.15,
          rotate: degrees(angle),
        });

        // 2. Draw text next to the logo along the same diagonal line
        page.drawText(watermarkText, {
          x: x_base + dx,
          y: y_base + dy + 4, // slightly raised for text baseline alignment
          size: fontSize,
          color: rgb(0.8, 0.2, 0.2), // soft red
          opacity: 0.25,
          rotate: degrees(angle),
        });
      }

      // Draw tiny security headers and footers
      page.drawText(watermarkText, {
        x: 20,
        y: height - 20,
        size: 7,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.3,
      });

      page.drawText(watermarkText, {
        x: 20,
        y: 20,
        size: 7,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.3,
      });
    }

    const modifiedPdfBytes = await pdfDoc.save();
    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    console.error("Error during PDF watermarking", error);
    // Return original buffer in case of failure to avoid blocking the user flow
    return pdfBuffer;
  }
}

/**
 * Applies a watermark on an image buffer (JPEG/PNG):
 * - 3 diagonal bands (-35 degrees) running across the image.
 * - Each band contains the semi-transparent logo followed by the annotation text.
 */
export async function watermarkImage(imageBuffer: Buffer, watermarkText: string): Promise<Buffer> {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    let logoBuffer: Buffer;
    try {
      logoBuffer = await fs.readFile(logoPath);
    } catch (e) {
      console.error("Could not read logo.png, skipping logo watermark", e);
      return imageBuffer;
    }

    // Get image metadata to determine dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Small logo size proportional to width
    const logoWidth = Math.round(width * 0.08); 
    const transparentLogo = await sharp(logoBuffer)
      .resize({ width: logoWidth })
      .png()
      .toBuffer();

    const logoBase64 = transparentLogo.toString("base64");
    const fontSize = Math.max(12, Math.round(width * 0.022));

    // Create an SVG overlay covering the entire image with 3 diagonal bands of logo + text
    const svgText = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .watermark-text {
            fill: rgba(220, 50, 50, 0.45);
            font-size: ${fontSize}px;
            font-family: sans-serif;
            font-weight: bold;
          }
          .watermark-small {
            fill: rgba(120, 120, 120, 0.35);
            font-size: ${Math.max(8, Math.round(width * 0.012))}px;
            font-family: sans-serif;
          }
        </style>
        
        <!-- Band 1: Upper part -->
        <g transform="rotate(-35, ${width * 0.15}, ${height * 0.75})">
          <image href="data:image/png;base64,${logoBase64}" 
                 x="${width * 0.15}" 
                 y="${height * 0.75}" 
                 width="${logoWidth}" 
                 opacity="0.15" />
          <text x="${width * 0.15 + logoWidth + 15}" 
                y="${height * 0.75 + (logoWidth * 0.45)}" 
                class="watermark-text">
            ${watermarkText}
          </text>
        </g>

        <!-- Band 2: Center part -->
        <g transform="rotate(-35, ${width * 0.15}, ${height * 0.50})">
          <image href="data:image/png;base64,${logoBase64}" 
                 x="${width * 0.15}" 
                 y="${height * 0.50}" 
                 width="${logoWidth}" 
                 opacity="0.15" />
          <text x="${width * 0.15 + logoWidth + 15}" 
                y="${height * 0.50 + (logoWidth * 0.45)}" 
                class="watermark-text">
            ${watermarkText}
          </text>
        </g>

        <!-- Band 3: Lower part -->
        <g transform="rotate(-35, ${width * 0.15}, ${height * 0.25})">
          <image href="data:image/png;base64,${logoBase64}" 
                 x="${width * 0.15}" 
                 y="${height * 0.25}" 
                 width="${logoWidth}" 
                 opacity="0.15" />
          <text x="${width * 0.15 + logoWidth + 15}" 
                y="${height * 0.25 + (logoWidth * 0.45)}" 
                class="watermark-text">
            ${watermarkText}
          </text>
        </g>
        
        <!-- Top and bottom security footers -->
        <text x="20" y="30" class="watermark-small">${watermarkText}</text>
        <text x="20" y="${height - 20}" class="watermark-small">${watermarkText}</text>
      </svg>
    `;
    const svgBuffer = Buffer.from(svgText);

    // Composite the SVG over the original image
    return await sharp(imageBuffer)
      .composite([
        {
          input: svgBuffer,
          top: 0,
          left: 0,
          blend: "over"
        }
      ])
      .toBuffer();
  } catch (error) {
    console.error("Error during image watermarking", error);
    // Return original buffer in case of failure to avoid blocking the user flow
    return imageBuffer;
  }
}
