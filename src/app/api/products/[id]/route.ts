import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function saveAsPng(imageBuffer: Buffer, filename: string) {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await sharp(imageBuffer).png().toFile(filePath);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/uploads/${filename}`;
}

// ✅ NEW GET endpoint: fetch single product by id
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("GET /api/products/[id] error", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// Existing PUT remains unchanged…
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const {
      name,
      description,
      price,
      imagesToAdd,
      imagesToDelete,
      category,
      inStock,
    } = body;

    const updateData: any = {};
    if (typeof name !== "undefined") updateData.name = name;
    if (typeof description !== "undefined")
      updateData.description = description;
    if (typeof price !== "undefined" && price !== null) {
      updateData.price = typeof price === "string" ? parseFloat(price) : price;
    }
    if (typeof category !== "undefined") updateData.category = category;
    if (typeof inStock !== "undefined") updateData.inStock = inStock;

    // --- Pre-process new images in parallel ---
    let processedImages: string[] = [];
    if (Array.isArray(imagesToAdd) && imagesToAdd.length > 0) {
      processedImages = await Promise.all(
        imagesToAdd.map(async (img) => {
          try {
            let imageBuffer: Buffer;
            if (img.startsWith("data:image")) {
              const base64 = img.split(",")[1];
              imageBuffer = Buffer.from(base64, "base64");
            } else {
              const res = await fetch(img);
              imageBuffer = Buffer.from(await res.arrayBuffer());
            }

            const ext = img.split(".").pop()?.toLowerCase();
            const filename = `${uuidv4()}.png`;

            if (ext === "png") {
              return await saveAsPng(imageBuffer, filename);
            } else {
              const pngBuffer = await sharp(imageBuffer).png().toBuffer();
              return await saveAsPng(pngBuffer, filename);
            }
          } catch (err) {
            console.error("Image processing failed:", err);
            return "";
          }
        })
      );

      processedImages = processedImages.filter((url) => url);
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.product.update({ where: { id }, data: updateData });
      }

      if (Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
        await tx.productImage.deleteMany({
          where: { productId: id, id: { in: imagesToDelete } },
        });
      }

      if (processedImages.length > 0) {
        await tx.productImage.createMany({
          data: processedImages.map((url) => ({ url, productId: id })),
        });
      }
    });

    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("PUT /api/products/[id] error", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
