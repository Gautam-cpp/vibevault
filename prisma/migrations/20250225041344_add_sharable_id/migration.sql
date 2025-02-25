/*
  Warnings:

  - Added the required column `sharableId` to the `Space` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "sharableId" TEXT NOT NULL;
