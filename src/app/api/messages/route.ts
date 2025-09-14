import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");

  try {
    const where = contactId ? { contactId } : {};
    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contactId, text, replyingToId, productId } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 }
      );
    }

    let messageData: any = {
      from: "business",
      to: contactId,
      type: "text",
      text,
      contactId,
    };

    // If replying to a message, fetch its text
    if (replyingToId) {
      const repliedMsg = await prisma.message.findUnique({
        where: { id: replyingToId },
      });
      if (repliedMsg) {
        messageData.replyToText = repliedMsg.text || null;
      }
    }

    // Handle product sharing
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { images: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      messageData.type = "product";
      messageData.text = product.name;
      messageData.replyToText = product.description || null;
      messageData.price = product.price;
      messageData.mediaUrl = product.images.map((img) => img.url).join(",");
    }

    const message = await prisma.message.create({ data: messageData });

    // Send to WhatsApp if it's a product or text
    try {
      if (message.type === "product") {
        await sendWhatsAppMessage(contactId, {
          type: "product",
          body: {
            title: message.text,
            description: message.replyToText,
            price: message.price,
            images: message.mediaUrl?.split(","),
          },
        });
      } else {
        await sendWhatsAppMessage(contactId, {
          type: "text",
          body: message.text,
        });
      }
    } catch (err) {
      console.error("WhatsApp send error:", err);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
