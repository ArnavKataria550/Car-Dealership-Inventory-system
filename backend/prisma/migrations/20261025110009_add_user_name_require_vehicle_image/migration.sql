/*
  Warnings:

  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `imageUrl` on table `vehicles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vehicles" ALTER COLUMN "imageUrl" SET NOT NULL;
