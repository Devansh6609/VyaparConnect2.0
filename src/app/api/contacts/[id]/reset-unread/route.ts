import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> } // 👈 must be a Promise
) {
  const { id } = await context.params; // 👈 await here
  try {
    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    await prisma.contact.update({
      where: { id },
      data: { unreadCount: 0 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`reset-unread error`, error);
    return NextResponse.json(
      { error: "Failed to reset unread count" },
      { status: 500 }
    );
  }
}
