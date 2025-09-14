/*
  Warnings:

  - You are about to drop the column `productId` on the `Quotation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Quotation" DROP CONSTRAINT "Quotation_productId_fkey";

-- AlterTable
ALTER TABLE "public"."Quotation" DROP COLUMN "productId",
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL DEFAULT 0;
