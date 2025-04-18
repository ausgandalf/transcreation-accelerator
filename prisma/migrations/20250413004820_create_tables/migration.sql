-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" INTEGER,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

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
    "content" TEXT DEFAULT '',
    "translation" TEXT NOT NULL,
    "updatedAt" DATETIME,
    "status" TEXT
);

-- CreateTable
CREATE TABLE "SyncTranslations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" INTEGER DEFAULT 0
);

-- CreateTable
CREATE TABLE "SyncProcess" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "cursor" TEXT DEFAULT '',
    "hasNext" BOOLEAN DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "Translations_shop_resourceId_field_locale_market_key" ON "Translations"("shop", "resourceId", "field", "locale", "market");

-- CreateIndex
CREATE UNIQUE INDEX "SyncTranslations_shop_resourceType_resourceId_key" ON "SyncTranslations"("shop", "resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncProcess_shop_resourceType_key" ON "SyncProcess"("shop", "resourceType");
