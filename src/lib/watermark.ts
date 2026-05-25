import { PDFDocument, rgb, degrees } from "pdf-lib";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

/**
 * Applies a watermark on a PDF buffer:
 * - A semi-transparent logo in the center of every page (larger).
 * - Annotation text in red diagonal banners (-35 degrees) running across the page.
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

    // Resize the logo to a larger size using sharp
    const transparentLogoBuffer = await sharp(logoBuffer)
      .resize({ width: 280 }) // Increased from 200
      .png()
      .toBuffer();

    const pngImage = await pdfDoc.embedPng(transparentLogoBuffer);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();

      // Logo coordinates (centered)
      const logoWidth = 220; // Increased from 150
      const logoHeight = (pngImage.height / pngImage.width) * logoWidth;
      const logoX = (width - logoWidth) / 2;
      const logoY = (height - logoHeight) / 2;

      // Draw the logo with 12% opacity (subtle and professional)
      page.drawImage(pngImage, {
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
        opacity: 0.12,
      });

      // Draw 2 diagonal text banners across the page
      const fontSize = Math.max(14, Math.round(width * 0.038)); // Larger font size
      
      // Upper diagonal banner
      page.drawText(watermarkText, {
        x: width * 0.12,
        y: height * 0.70,
        size: fontSize,
        color: rgb(0.8, 0.2, 0.2), // soft red
        opacity: 0.25,
        rotate: degrees(-35), // Diagonal!
      });

      // Lower diagonal banner
      page.drawText(watermarkText, {
        x: width * 0.12,
        y: height * 0.40,
        size: fontSize,
        color: rgb(0.8, 0.2, 0.2),
        opacity: 0.25,
        rotate: degrees(-35), // Diagonal!
      });

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
 * - A semi-transparent logo in the center (larger).
 * - Annotation text in diagonal overlays (-35 degrees) running across the image.
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

    // Logo size proportional to image width (35%)
    const logoWidth = Math.round(width * 0.35);
    const transparentLogo = await sharp(logoBuffer)
      .resize({ width: logoWidth })
      .png()
      .toBuffer();

    const logoBase64 = transparentLogo.toString("base64");

    // Create an SVG overlay covering the entire image with diagonal text and centered logo
    const svgText = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .watermark-text {
            fill: rgba(220, 50, 50, 0.45);
            font-size: ${Math.max(14, Math.round(width * 0.03))}px;
            font-family: sans-serif;
            font-weight: bold;
          }
          .watermark-small {
            fill: rgba(120, 120, 120, 0.35);
            font-size: ${Math.max(8, Math.round(width * 0.012))}px;
            font-family: sans-serif;
          }
        </style>
        
        <!-- Logo in the center with 12% opacity -->
        <image href="data:image/png;base64,${logoBase64}" 
               x="${(width - logoWidth) / 2}" 
               y="${(height - (logoWidth * 0.55)) / 2}" 
               width="${logoWidth}" 
               opacity="0.12" />
               
        <!-- Diagonal text banner 1 (Upper middle) -->
        <text x="${width / 2}" y="${height * 0.38}" text-anchor="middle" 
              transform="rotate(-35, ${width / 2}, ${height * 0.38})" class="watermark-text">
          ${watermarkText}
        </text>

        <!-- Diagonal text banner 2 (Lower middle) -->
        <text x="${width / 2}" y="${height * 0.62}" text-anchor="middle" 
              transform="rotate(-35, ${width / 2}, ${height * 0.62})" class="watermark-text">
          ${watermarkText}
        </text>
        
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
