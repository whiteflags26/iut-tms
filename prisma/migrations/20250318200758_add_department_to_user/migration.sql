-- CreateEnum
CREATE TYPE "Department" AS ENUM ('CSE', 'EEE', 'CEE', 'MPE', 'GENERAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" "Department" NOT NULL DEFAULT 'GENERAL';
