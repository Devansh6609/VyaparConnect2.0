/*
  Warnings:

  - A unique constraint covering the columns `[whatsappBusinessId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "whatsappBusinessId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_whatsappBusinessId_key" ON "public"."User"("whatsappBusinessId");
