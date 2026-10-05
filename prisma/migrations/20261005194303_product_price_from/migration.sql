-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "priceFrom" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_status_priceFrom_idx" ON "Product"("status", "priceFrom");
