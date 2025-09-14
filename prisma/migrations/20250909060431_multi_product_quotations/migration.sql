/*
  Warnings:

  - You are about to drop the column `price` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Quotation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Quotation" DROP CONSTRAINT "Quotation_productId_fkey";

-- AlterTable
ALTER TABLE "public"."Quotation" DROP COLUMN "price",
DROP COLUMN "quantity",
DROP COLUMN "total",
ALTER COLUMN "productId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
