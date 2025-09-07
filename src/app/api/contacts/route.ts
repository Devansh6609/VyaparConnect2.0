// src/app/api/contacts/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const result = contacts.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      lastMessage: c.messages[0]?.text || "",
      lastMessageAt: c.messages[0]?.createdAt || c.updatedAt,
      avatarUrl: c.avatarUrl || null,
      unreadCount: c.unreadCount || 0, // 🔹 return unread count
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/contacts error", err);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
