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
      include: { product: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {});

    // --- PDF Content ---
    doc.fontSize(20).text("Quotation", { align: "center" }).moveDown();

    doc.fontSize(12).text(`Customer: ${quotation.customerName}`);
    doc.text(`Phone: ${quotation.contactNumber}`);
    doc.text(`Address: ${quotation.address}`).moveDown();

    doc.text(`Product: ${quotation.product.name}`);
    doc.text(`Quantity: ${quotation.quantity}`);
    doc.text(`Price: ₹${quotation.price}`);
    doc.text(`Total: ₹${quotation.total}`).moveDown();

    doc.text(`Date: ${quotation.createdAt.toDateString()}`);

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
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
