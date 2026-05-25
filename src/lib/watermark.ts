import { PDFDocument, rgb, degrees } from "pdf-lib";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

/**
 * Applies a watermark on a PDF buffer:
 * - 3 large, straight (not rotated) logos centered on the page at heights 75%, 50%, and 25%.
 * - 3 diagonal text watermarks (-30 degrees) running across the page at the same heights.
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

    // Resize the logo to a large size using sharp
    const transparentLogoBuffer = await sharp(logoBuffer)
      .resize({ width: 220 }) // Large logo
      .png()
      .toBuffer();

    const pngImage = await pdfDoc.embedPng(transparentLogoBuffer);
    const pages = pdfDoc.getPages();

    const logoWidth = 180; // Large logo (en gros)
    const logoHeight = (pngImage.height / pngImage.width) * logoWidth;
    const angle = -30;

    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = Math.max(12, Math.round(width * 0.038)); // Large text

      // 3 heights on the page
      const bands = [0.75, 0.50, 0.25];

      for (const yFactor of bands) {
        const y_base = height * yFactor;

        // 1. Draw logo centered and straight (droit!)
        const logoX = (width - logoWidth) / 2;
        const logoY = y_base - logoHeight / 2;

        page.drawImage(pngImage, {
          x: logoX,
          y: logoY,
          width: logoWidth,
          height: logoHeight,
          opacity: 0.15, // Transparent but clearly visible
          // rotate is 0 by default, keeping it straight!
        });

        // 2. Draw text at the same level, but diagonally
        page.drawText(watermarkText, {
          x: width * 0.12,
          y: y_base - 10,
          size: fontSize,
          color: rgb(0.8, 0.15, 0.15), // soft red
          opacity: 0.25,
          rotate: degrees(angle), // Diagonal!
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
 * - 3 large, straight (not rotated) logos centered on the image at heights 75%, 50%, and 25%.
 * - 3 diagonal text watermarks (-30 degrees) running across the image at the same heights.
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

    // Large logo size proportional to width
    const logoWidth = Math.round(width * 0.35); 
    const transparentLogo = await sharp(logoBuffer)
      .resize({ width: logoWidth })
      .png()
      .toBuffer();

    const logoBase64 = transparentLogo.toString("base64");
    const fontSize = Math.max(12, Math.round(width * 0.024));

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
        <g>
          <!-- Logo straight and centered -->
          <image href="data:image/png;base64,${logoBase64}" 
                 x="${(width - logoWidth) / 2}" 
                 y="${height * 0.75 - logoWidth * 0.3}" 
                 width="${logoWidth}" 
                 opacity="0.15" />
          <!-- Diagonal text at the same height -->
          <text x="${width / 2}" y="${height * 0.75}" text-anchor="middle" 
                transform="rotate(-30, ${width / 2}, ${height * 0.75})" class="watermark-text">
            ${watermarkText}
          </text>
        </g>

        <!-- Band 2: Center part -->
        <g>
          <!-- Logo straight and centered -->
          <image href="data:image/png;base64,${logoBase64}" 
                 x="${(width - logoWidth) / 2}" 
                 y="${height * 0.50 - logoWidth * 0.3}" 
                 width="${logoWidth}" 
                 opacity="0.15" />
          <!-- Diagonal text at the same height -->
          <text x="${width / 2}" y="${height * 0.50}" text-anchor="middle" 
                transform="rotate(-30, ${width / 2}, ${height * 0.50})" class="watermark-text">
            ${watermarkText}
          </text>
        </g>

        <!-- Band 3: Lower part -->
        <g>
          <!-- Logo straight and centered -->
          <image href="data:image/png;base64,${logoBase64}" 
                 x="${(width - logoWidth) / 2}" 
                 y="${height * 0.25 - logoWidth * 0.3}" 
                 width="${logoWidth}" 
                 opacity="0.15" />
          <!-- Diagonal text at the same height -->
          <text x="${width / 2}" y="${height * 0.25}" text-anchor="middle" 
                transform="rotate(-30, ${width / 2}, ${height * 0.25})" class="watermark-text">
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
