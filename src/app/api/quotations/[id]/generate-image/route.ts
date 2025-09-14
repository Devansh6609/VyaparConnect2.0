// src/app/api/quotations/[id]/generate-image/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodeHtmlToImage from "node-html-to-image";

const prisma = new PrismaClient();

// Your function signature was already correct.
// The `async` keyword is the solution to the "params should be awaited" error.
// No changes were needed here as your code was already correct.
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: { items: { include: { product: true } } },
    });

    if (!quotation) {
      return new NextResponse("Quotation not found", { status: 404 });
    }

    // 🔹 HTML template for the quotation
    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              background-color: #ffffff;
              color: #1a202c;
            }
            h1 {
              font-size: 32px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 30px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              font-size: 14px;
              color: #4a5568;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .table th, .table td {
              border-bottom: 1px solid #e2e8f0;
              padding: 8px;
              font-size: 14px;
              text-align: left;
            }
            .table th {
              font-weight: bold;
              color: #2d3748;
            }
            .total {
              text-align: right;
              font-size: 18px;
              font-weight: bold;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>Quotation</h1>
          <div class="header">
            <div>
              <strong>Billed To:</strong><br/>
              ${quotation.customerName}<br/>
              ${quotation.contactNumber}<br/>
              ${quotation.address || "N/A"}
            </div>
            <div style="text-align: right;">
              <strong>Quotation ID:</strong> ${quotation.id}<br/>
              <strong>Date:</strong> ${new Date(
                quotation.createdAt
              ).toLocaleDateString()}
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${quotation.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.product?.name || "Unknown"}</td>
                  <td style="text-align:center;">${item.quantity}</td>
                  <td style="text-align:right;">₹${item.price.toFixed(2)}</td>
                  <td style="text-align:right;">₹${(
                    item.quantity * item.price
                  ).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="total">
            Grand Total: ₹${quotation.total.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </body>
      </html>
    `;

    // 🔹 Generate PNG buffer
    const buffer = (await nodeHtmlToImage({
      html,
      encoding: "buffer",
      puppeteerArgs: { args: ["--no-sandbox"] }, // important for Vercel/Edge
    })) as Buffer;

    return new NextResponse(buffer, {
      headers: { "Content-Type": "image/png" },
    });
  } catch (error) {
    console.error("❌ Generate Image Error:", error);
    return new NextResponse("Failed to generate quotation image", {
      status: 500,
    });
  }
}
