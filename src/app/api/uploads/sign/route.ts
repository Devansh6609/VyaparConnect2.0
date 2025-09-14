// src/app/api/uploads/sign/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const paramsToSign = {
      timestamp,
      folder: "vyaparconnect/products", // optional: organize in a folder
    };

    const signature = crypto
      .createHash("sha1")
      .update(
        Object.keys(paramsToSign)
          .map((key) => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
          .join("&") + process.env.CLOUDINARY_API_SECRET
      )
      .digest("hex");

    return NextResponse.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder: paramsToSign.folder,
    });
  } catch (err) {
    console.error("Error generating Cloudinary signature:", err);
    return NextResponse.json({ error: "Failed to sign upload" }, { status: 500 });
  }
}
