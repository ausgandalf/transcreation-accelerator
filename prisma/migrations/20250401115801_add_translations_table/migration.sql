-- CreateTable
CREATE TABLE "Translations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "parentId" TEXT,
    "field" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "updatedAt" DATETIME,
    "status" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Translations_shop_resourceId_field_locale_market_key" ON "Translations"("shop", "resourceId", "field", "locale", "market");
