import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const nodemailer = require("nodemailer");
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return NextResponse.json({ 
        success: false, 
        error: "Variables SMTP manquantes dans Coolify (SMTP_HOST ou SMTP_USER introuvable)." 
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Test the SMTP connection
    await transporter.verify();

    return NextResponse.json({ 
      success: true, 
      message: "Connexion SMTP réussie avec succès ! Le serveur est prêt à envoyer des emails.",
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        secure: process.env.SMTP_SECURE
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: "Échec de la connexion SMTP",
      details: error.message 
    });
  }
}
