import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/products → list all products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/products → create a new product
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description, imageUrl, category, inStock, userId } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "Missing required fields: name and price are required" },
        { status: 400 }
      );
    }

    // Always ensure demo user exists for fallback
    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@vyaparconnect.com" },
    });

    if (!demoUser) {
      return NextResponse.json(
        { error: "No demo user found. Please run `npx prisma db seed` first." },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        imageUrl,
        category,
        inStock: inStock ?? true,
        userId: userId || demoUser.id, // fallback to demo user
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/products error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
