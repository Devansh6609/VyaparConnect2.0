/*
  Warnings:

  - You are about to drop the column `pdfUrl` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Quotation` table. All the data in the column will be lost.
  - You are about to alter the column `total` on the `Quotation` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `address` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactNumber` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Quotation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Quotation" DROP CONSTRAINT "Quotation_contactId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Quotation" DROP CONSTRAINT "Quotation_userId_fkey";

-- DropIndex
DROP INDEX "public"."QuotationItem_quotationId_key";

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "category" TEXT,
ADD COLUMN     "inStock" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Quotation" DROP COLUMN "pdfUrl",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "contactNumber" TEXT NOT NULL,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ALTER COLUMN "total" SET DATA TYPE INTEGER,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "contactId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
