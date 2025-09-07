import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/quotations → list all quotations
export async function GET() {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        product: true,
        contact: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotations);
  } catch (err) {
    console.error("GET /api/quotations error:", err);
    return NextResponse.json(
      { error: "Failed to fetch quotations" },
      { status: 500 }
    );
  }
}

// POST /api/quotations → create new quotation
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      contactNumber,
      address,
      productId,
      quantity,
      price,
      total,
      userId,
      contactId,
    } = body;

    if (!customerName || !contactNumber || !productId || !quantity || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ensure product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // if contactId provided, connect; otherwise create/find contact
    let contact = null;
    if (contactId) {
      contact = await prisma.contact.findUnique({ where: { id: contactId } });
    }
    if (!contact) {
      contact = await prisma.contact.upsert({
        where: { phone: contactNumber },
        update: { name: customerName, lastAddress: address || undefined },
        create: {
          name: customerName,
          phone: contactNumber,
          lastAddress: address || undefined,
          userId: userId || product.userId, // fallback
        },
      });
    }

    // create quotation
    const quotation = await prisma.quotation.create({
      data: {
        customerName,
        contactNumber,
        address,
        productId,
        quantity: parseInt(quantity, 10),
        price: parseInt(price, 10),
        total: parseInt(total, 10),
        userId: userId || product.userId, // fallback
        contactId: contact.id,
      },
      include: {
        product: true,
        contact: true,
      },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (err) {
    console.error("POST /api/quotations error:", err);
    return NextResponse.json(
      { error: "Failed to create quotation" },
      { status: 500 }
    );
  }
}
