generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  BUYER
  CREATOR
  ADMIN
}

enum AvatarStatus {
  DRAFT
  PUBLISHED
}

enum OrderStatus {
  PENDING
  COMPLETED
  REFUNDED
  FAILED
}

enum FeaturedStatus {
  PENDING
  ACTIVE
  EXPIRED
}

enum CommissionStatus {
  OPEN
  ACCEPTED
  IN_PROGRESS
  DELIVERED
  COMPLETED
  DECLINED
  CANCELLED
}

model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  username              String    @unique
  passwordHash          String
  displayName           String
  bio                   String    @default("")
  avatarImageUrl         String?
  bannerImageUrl         String?
  socialLinks           String    @default("{}") // JSON string: { twitter, discord, website, vrchat }
  role                  Role      @default(BUYER)
  isCreator             Boolean   @default(false)
  stripeAccountId       String?
  stripeOnboarded       Boolean   @default(false)
  stripeCustomerId      String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  avatars               Avatar[]        @relation("CreatorAvatars")
  orders                Order[]         @relation("BuyerOrders")
  commissionsRequested  Commission[]    @relation("BuyerCommissions")
  commissionsReceived   Commission[]    @relation("CreatorCommissions")
  featuredPurchases     FeaturedSlot[]  @relation("PurchasedFeaturedSlots")
}

model Avatar {
  id             String        @id @default(cuid())
  creatorId      String
  creator        User          @relation("CreatorAvatars", fields: [creatorId], references: [id], onDelete: Cascade)
  title          String
  description    String
  priceCents     Int
  category       String        @default("Base Model") // Base Model, Modification, Full Avatar, Accessory
  platform       String        @default("PC")          // PC, Quest, PC & Quest
  tags           String        @default("[]")          // JSON array of strings
  thumbnailUrl   String
  previewImages  String        @default("[]")          // JSON array of image URLs
  fileKey        String                                 // path within /storage — never served directly
  fileName       String
  fileSizeBytes  Int           @default(0)
  polycount      Int?
  status         AvatarStatus  @default(DRAFT)
  isFeatured     Boolean       @default(false)
  featuredUntil  DateTime?
  downloadCount  Int           @default(0)
  viewCount      Int           @default(0)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  orders         Order[]
  featuredSlots  FeaturedSlot[]

  @@index([status])
  @@index([isFeatured])
}

model Order {
  id                    String      @id @default(cuid())
  buyerId               String
  buyer                 User        @relation("BuyerOrders", fields: [buyerId], references: [id], onDelete: Cascade)
  avatarId              String
  avatar                Avatar      @relation(fields: [avatarId], references: [id], onDelete: Cascade)
  amountTotalCents      Int
  platformFeeCents      Int
  creatorPayoutCents    Int
  stripeCheckoutSessionId String    @unique
  stripePaymentIntentId  String?
  status                OrderStatus @default(PENDING)
  createdAt              DateTime   @default(now())
  updatedAt              DateTime   @updatedAt

  @@index([buyerId])
  @@index([avatarId])
}

model FeaturedSlot {
  id                      String         @id @default(cuid())
  avatarId                String
  avatar                  Avatar         @relation(fields: [avatarId], references: [id], onDelete: Cascade)
  purchasedById           String
  purchasedBy             User           @relation("PurchasedFeaturedSlots", fields: [purchasedById], references: [id], onDelete: Cascade)
  amountPaidCents         Int
  durationDays            Int
  startsAt                DateTime?
  endsAt                  DateTime?
  stripeCheckoutSessionId String         @unique
  status                  FeaturedStatus @default(PENDING)
  createdAt               DateTime       @default(now())

  @@index([status])
}

model Commission {
  id             String            @id @default(cuid())
  buyerId        String
  buyer          User              @relation("BuyerCommissions", fields: [buyerId], references: [id], onDelete: Cascade)
  creatorId      String?
  creator        User?             @relation("CreatorCommissions", fields: [creatorId], references: [id], onDelete: SetNull)
  title          String
  description    String
  avatarBase     String  @default("") // e.g. existing base model / VRChat avatar link
  budgetMinCents Int
  budgetMaxCents Int
  deadline       DateTime?
  referenceFiles String  @default("[]") // JSON array of uploaded reference image URLs
  contactNote    String  @default("")
  status         CommissionStatus @default(OPEN)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([status])
  @@index([creatorId])
}
