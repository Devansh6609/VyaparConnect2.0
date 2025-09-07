import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { PrismaClient } from "@prisma/client";
import Razorpay from "razorpay";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Razorpay setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: { product: true, contact: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // 1. Generate PDF file and save locally (or upload later)
    const pdfPath = path.join(
      process.cwd(),
      `public/quotation-${quotation.id}.pdf`
    );
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(20).text("Quotation", { align: "center" }).moveDown();
    doc.text(`Customer: ${quotation.customerName}`);
    doc.text(`Phone: ${quotation.contactNumber}`);
    doc.text(`Address: ${quotation.address}`).moveDown();
    doc.text(`Product: ${quotation.product.name}`);
    doc.text(`Quantity: ${quotation.quantity}`);
    doc.text(`Price: ₹${quotation.price}`);
    doc.text(`Total: ₹${quotation.total}`);
    doc.text(`Date: ${quotation.createdAt.toDateString()}`);

    doc.end();

    await new Promise((resolve) => stream.on("finish", resolve));

    const pdfUrl = `/quotation-${quotation.id}.pdf`; // accessible from /public

    // 2. Create Razorpay payment link
    const paymentLink = await razorpay.paymentLink.create({
      amount: quotation.total * 100, // in paise
      currency: "INR",
      customer: {
        name: quotation.customerName,
        contact: quotation.contactNumber,
      },
      notify: { sms: true, email: false },
      reminder_enable: true,
    });

    // 3. Save a message in DB
    await prisma.message.create({
      data: {
        from: "business",
        to: quotation.contact?.phone || "unknown",
        type: "document",
        text: `Your quotation is ready. Pay here: ${paymentLink.short_url}`,
        mediaUrl: pdfUrl,
        contactId: quotation.contactId!,
      },
    });

    return NextResponse.json({ success: true, pdfUrl, paymentLink });
  } catch (error) {
    console.error("Send quotation error:", error);
    return NextResponse.json({ error: "Failed to send quotation" }, { status: 500 });
  }
}
