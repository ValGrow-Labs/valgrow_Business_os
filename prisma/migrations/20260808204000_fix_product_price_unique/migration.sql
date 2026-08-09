-- CreateIndex
CREATE UNIQUE INDEX "ProductPrice_organizationId_productId_variantId_tier_minQua_key" ON "ProductPrice"("organizationId", "productId", "variantId", "tier", "minQuantity");
