-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "avatarImageUrl" TEXT,
    "bannerImageUrl" TEXT,
    "socialLinks" TEXT NOT NULL DEFAULT '{}',
    "role" TEXT NOT NULL DEFAULT 'BUYER',
    "isCreator" BOOLEAN NOT NULL DEFAULT false,
    "stripeAccountId" TEXT,
    "stripeOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Avatar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Base Model',
    "platform" TEXT NOT NULL DEFAULT 'PC',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "thumbnailUrl" TEXT NOT NULL,
    "previewImages" TEXT NOT NULL DEFAULT '[]',
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL DEFAULT 0,
    "polycount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" DATETIME,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Avatar_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL,
    "amountTotalCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "creatorPayoutCents" INTEGER NOT NULL,
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Avatar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeaturedSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "avatarId" TEXT NOT NULL,
    "purchasedById" TEXT NOT NULL,
    "amountPaidCents" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeaturedSlot_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Avatar" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeaturedSlot_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "creatorId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "avatarBase" TEXT NOT NULL DEFAULT '',
    "budgetMinCents" INTEGER NOT NULL,
    "budgetMaxCents" INTEGER NOT NULL,
    "deadline" DATETIME,
    "referenceFiles" TEXT NOT NULL DEFAULT '[]',
    "contactNote" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commission_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Commission_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Avatar_status_idx" ON "Avatar"("status");

-- CreateIndex
CREATE INDEX "Avatar_isFeatured_idx" ON "Avatar"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeCheckoutSessionId_key" ON "Order"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "Order_buyerId_idx" ON "Order"("buyerId");

-- CreateIndex
CREATE INDEX "Order_avatarId_idx" ON "Order"("avatarId");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedSlot_stripeCheckoutSessionId_key" ON "FeaturedSlot"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "FeaturedSlot_status_idx" ON "FeaturedSlot"("status");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- CreateIndex
CREATE INDEX "Commission_creatorId_idx" ON "Commission"("creatorId");
