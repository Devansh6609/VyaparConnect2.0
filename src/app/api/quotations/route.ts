import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");

  if (!contactId) {
    return NextResponse.json(
      { error: "contactId is required" },
      { status: 400 }
    );
  }

  try {
    const quotations = await prisma.quotation.findMany({
      where: { contactId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error("GET /api/quotations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotations" },
      { status: 500 }
    );
  }
}
// POST /api/quotations
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      contactNumber,
      address,
      items, // Expect array of { productId, quantity, price }
      contactId,
      userId,
    } = body;

    // --- Server-Side Validation ---
    if (!contactId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (contactId and at least one item are required)",
        },
        { status: 400 }
      );
    }

    // --- Server-Side Calculation for accuracy ---
    const total = items.reduce(
      (sum, item) =>
        sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );

    // --- Database Transaction ---
    const quotation = await prisma.quotation.create({
      data: {
        customerName,
        contactNumber,
        address,
        total, // This now matches the updated schema
        contact: { connect: { id: contactId } },
        // user: userId ? { connect: { id: userId } } : undefined,

        // ✅ INSTEAD: We create the related "QuotationItem" records correctly here
        items: {
          createMany: {
            data: items.map((item: any) => ({
              productId: item.productId,
              quantity: Number(item.quantity),
              price: Number(item.price),
            })),
          },
        },
      },
      include: {
        items: true, // Return the created items in the response
      },
    });

    // Update the contact's last known address
    if (address) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { lastAddress: address },
      });
    }

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error("POST /api/quotations error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to create quotation. Please ensure all product IDs are valid.",
      },
      { status: 500 }
    );
  }
}
