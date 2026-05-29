-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "expectedCloseDate" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'OPEN';
