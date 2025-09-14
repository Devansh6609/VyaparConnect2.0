// app/api/quotations/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: true } },
        contact: true,
        user: true,
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Compute totals
    const total = quotation.items.reduce(
      (s, it) => s + it.quantity * it.price,
      0
    );

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {});

    // Header
    doc.fontSize(20).text("Quotation", { align: "center" }).moveDown();

    // Customer info
    doc.fontSize(12).text(`Customer: ${quotation.customerName}`);
    doc.text(`Phone: ${quotation.contactNumber}`);
    doc.text(`Address: ${quotation.address}`).moveDown();

    // Table header
    doc.fontSize(12).text("Items:", { underline: true });
    doc.moveDown(0.5);

    // Table column titles
    doc.fontSize(10).text("Product", { continued: true, width: 250 });
    doc.text("Qty", { continued: true, width: 50, align: "right" });
    doc.text("Price", { continued: true, width: 80, align: "right" });
    doc.text("Subtotal", { align: "right" });
    doc.moveDown(0.2);

    quotation.items.forEach((it) => {
      const productName = it.product?.name || "Unknown";
      const qty = it.quantity;
      const price = it.price;
      const subtotal = qty * price;

      doc.fontSize(10).text(productName, { continued: true, width: 250 });
      doc.text(String(qty), { continued: true, width: 50, align: "right" });
      doc.text(`₹${price.toFixed(2)}`, {
        continued: true,
        width: 80,
        align: "right",
      });
      doc.text(`₹${subtotal.toFixed(2)}`, { align: "right" });
    });

    doc.moveDown();
    doc.fontSize(12).text(`Total: ₹${total.toFixed(2)}`, { align: "right" });

    doc.moveDown();
    doc.fontSize(10).text(`Date: ${quotation.createdAt.toDateString()}`);

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      const result = Buffer.concat(chunks);
      resolve(result);
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=quotation-${quotation.id}.pdf`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
