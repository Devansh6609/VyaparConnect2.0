import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Utility: Save PNG to /public/uploads and return URL
async function saveAsPng(imageBuffer: Buffer, filename: string) {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await sharp(imageBuffer).png().toFile(filePath);

  // Build full absolute URL instead of relative
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/uploads/${filename}`;
}

// GET /api/products → list all products (with images)
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { images: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products → create a new product with multiple images
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description, category, inStock, images } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "Missing required fields: name and price are required" },
        { status: 400 }
      );
    }

    // Find demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@vyaparconnect.com" },
    });
    if (!demoUser) {
      return NextResponse.json(
        { error: "System error: Default user not configured." },
        { status: 500 }
      );
    }

    // --- Convert and Save Images as PNG (FAST, PARALLEL) ---
    let processedImages: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      processedImages = await Promise.all(
        images.map(async (img) => {
          try {
            let imageBuffer: Buffer;

            if (img.startsWith("data:image")) {
              // Base64
              const base64 = img.split(",")[1];
              imageBuffer = Buffer.from(base64, "base64");
            } else {
              // Fetch URL
              const res = await fetch(img);
              imageBuffer = Buffer.from(await res.arrayBuffer());
            }

            const ext = img.split(".").pop()?.toLowerCase();
            const filename = `${uuidv4()}.png`;

            if (ext === "png") {
              // Already PNG → save directly
              return await saveAsPng(imageBuffer, filename);
            } else {
              // Convert to PNG
              const pngBuffer = await sharp(imageBuffer).png().toBuffer();
              return await saveAsPng(pngBuffer, filename);
            }
          } catch (err) {
            console.error("Image processing failed:", err);
            return ""; // skip if error
          }
        })
      );

      // filter out any failed conversions
      processedImages = processedImages.filter((url) => url);
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: typeof price === "string" ? parseFloat(price) : price,
        description: description || null,
        category: category || null,
        inStock: typeof inStock === "boolean" ? inStock : true,
        userId: demoUser.id,
        images: {
          create: processedImages.map((url) => ({ url })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("POST /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
