-- ====================================================================
-- SUPABASE & POSTGRESQL PRODUCTION INITIAL SCHEMA MIGRATION
-- Compatible with Supabase SQL Editor, Prisma ORM, and PostgreSQL 14+
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. CREATE SYSTEM TABLES
-- ====================================================================

-- 2.1 User Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT ('usr_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 2.2 Product Table (Games & Digital Services)
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL DEFAULT ('prod_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- 2.3 Package Table (Game Recharge Tiers / Item Bundles)
CREATE TABLE IF NOT EXISTS "Package" (
    "id" TEXT NOT NULL DEFAULT ('pkg_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL DEFAULT 'NORMAL',
    "badge" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- 2.4 Order Table (Top-Up Transactions & KHQR Invoices)
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL DEFAULT ('ord_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    "userId" TEXT,
    "packageId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerZoneId" TEXT,
    "playerNickname" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'ABA',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentTxnId" TEXT NOT NULL,
    "gatewayRef" TEXT,
    "paymentQrCode" TEXT,
    "paymentMd5" TEXT,
    "paidAt" TIMESTAMP(3),
    "deliveryStatus" TEXT NOT NULL DEFAULT 'WAITING',
    "stockDeliveredCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- 2.5 Stock Table (Digital Voucher Gift Codes / Serial Keys)
CREATE TABLE IF NOT EXISTS "Stock" (
    "id" TEXT NOT NULL DEFAULT ('stk_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    "packageId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- ====================================================================
-- 3. UNIQUE INDEXES & PERFORMANCE INDEXES
-- ====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_paymentTxnId_key" ON "Order"("paymentTxnId");

CREATE INDEX IF NOT EXISTS "idx_product_category" ON "Product"("category");
CREATE INDEX IF NOT EXISTS "idx_package_productId" ON "Package"("productId");
CREATE INDEX IF NOT EXISTS "idx_order_userId" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "idx_order_createdAt" ON "Order"("createdAt" DESC);

-- ====================================================================
-- 4. FOREIGN KEY CONSTRAINTS (Safe execution)
-- ====================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Package_productId_fkey') THEN
        ALTER TABLE "Package" ADD CONSTRAINT "Package_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_userId_fkey') THEN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_packageId_fkey') THEN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Stock_packageId_fkey') THEN
        ALTER TABLE "Stock" ADD CONSTRAINT "Stock_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ====================================================================
-- 5. AUTO-UPDATE TIMESTAMP TRIGGERS
-- ====================================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_updated_at ON "User";
CREATE TRIGGER trg_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS trg_product_updated_at ON "Product";
CREATE TRIGGER trg_product_updated_at BEFORE UPDATE ON "Product" FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS trg_package_updated_at ON "Package";
CREATE TRIGGER trg_package_updated_at BEFORE UPDATE ON "Package" FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS trg_order_updated_at ON "Order";
CREATE TRIGGER trg_order_updated_at BEFORE UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS trg_stock_updated_at ON "Stock";
CREATE TRIGGER trg_stock_updated_at BEFORE UPDATE ON "Stock" FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ====================================================================
-- 6. DEFAULT ADMINISTRATOR SEED (admin@nadytopup.com / admin123)
-- ====================================================================

INSERT INTO "User" ("id", "email", "password", "role")
VALUES 
  ('usr_admin_nady', 'admin@nadytopup.com', '$2a$10$6MJi2ySmEqnKRa4Avtad1en6loFyWVZTvt7hOp5BFC7PR8g.C08Qm', 'ADMIN'),
  ('usr_admin_dara', 'mdara9695@gmail.com', '$2a$10$6MJi2ySmEqnKRa4Avtad1en6loFyWVZTvt7hOp5BFC7PR8g.C08Qm', 'ADMIN')
ON CONFLICT ("email") DO UPDATE SET "role" = 'ADMIN', "updatedAt" = CURRENT_TIMESTAMP;

-- ====================================================================
-- 7. INITIAL GAME CATALOG & PACKAGES SEED
-- ====================================================================

-- 7.1 Mobile Legends
INSERT INTO "Product" ("id", "name", "slug", "image", "category", "isActive")
VALUES ('prod_mlbb', 'Mobile Legends: Bang Bang', 'mobile-legends', '/images/games/mlbb.png', 'MOBILE_GAME', true)
ON CONFLICT ("slug") DO UPDATE SET "image" = EXCLUDED."image", "isActive" = true;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_ml_01', p.id, 'Weekly Diamond Pass', 1, 1.99, 'BEST_SELLER', 'VIP Pass 🔥', true FROM "Product" p WHERE p.slug = 'mobile-legends' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_ml_02', p.id, '86 Diamonds (78 + 8 Bonus)', 86, 1.45, 'BEST_SELLER', 'Hot 🔥', true FROM "Product" p WHERE p.slug = 'mobile-legends' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_ml_03', p.id, '172 Diamonds (156 + 16 Bonus)', 172, 2.85, 'BEST_SELLER', 'POPULAR', true FROM "Product" p WHERE p.slug = 'mobile-legends' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_ml_04', p.id, '257 Diamonds (234 + 23 Bonus)', 257, 4.25, 'NORMAL', 'POPULAR', true FROM "Product" p WHERE p.slug = 'mobile-legends' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_ml_05', p.id, '706 Diamonds (625 + 81 Bonus)', 706, 11.50, 'NORMAL', 'Bonus 12%', true FROM "Product" p WHERE p.slug = 'mobile-legends' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_ml_06', p.id, '2195 Diamonds (1860 + 335 Bonus)', 2195, 34.90, 'NORMAL', 'SPECIAL 💎', true FROM "Product" p WHERE p.slug = 'mobile-legends' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

-- 7.2 Free Fire
INSERT INTO "Product" ("id", "name", "slug", "image", "category", "isActive")
VALUES ('prod_ff', 'Free Fire', 'free-fire', '/images/games/freefire.png', 'MOBILE_GAME', true)
ON CONFLICT ("slug") DO UPDATE SET "image" = EXCLUDED."image", "isActive" = true;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_ff_01', p.id, 'Weekly Membership', 1, 1.99, 'BEST_SELLER', 'Hot Deal 🔥', true FROM "Product" p WHERE p.slug = 'free-fire' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_ff_02', p.id, '100 Diamonds + 10 Bonus', 110, 0.99, 'BEST_SELLER', 'POPULAR', true FROM "Product" p WHERE p.slug = 'free-fire' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_ff_03', p.id, '310 Diamonds + 31 Bonus', 341, 2.99, 'BEST_SELLER', 'Hot 🔥', true FROM "Product" p WHERE p.slug = 'free-fire' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_ff_04', p.id, '520 Diamonds + 52 Bonus', 572, 4.90, 'NORMAL', 'POPULAR', true FROM "Product" p WHERE p.slug = 'free-fire' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_ff_05', p.id, '1060 Diamonds + 106 Bonus', 1166, 9.75, 'NORMAL', 'Bonus 10%', true FROM "Product" p WHERE p.slug = 'free-fire' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_ff_06', p.id, '2180 Diamonds + 218 Bonus', 2398, 19.50, 'NORMAL', 'SPECIAL 💎', true FROM "Product" p WHERE p.slug = 'free-fire' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

-- 7.3 PUBG Mobile
INSERT INTO "Product" ("id", "name", "slug", "image", "category", "isActive")
VALUES ('prod_pubg', 'PUBG Mobile', 'pubg-mobile', '/images/games/pubgm.png', 'MOBILE_GAME', true)
ON CONFLICT ("slug") DO UPDATE SET "image" = EXCLUDED."image", "isActive" = true;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_pubg_01', p.id, '60 UC', 60, 0.99, 'BEST_SELLER', 'Hot 🔥', true FROM "Product" p WHERE p.slug = 'pubg-mobile' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_pubg_02', p.id, '325 UC (300 + 25 Bonus)', 325, 4.85, 'BEST_SELLER', 'POPULAR', true FROM "Product" p WHERE p.slug = 'pubg-mobile' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_pubg_03', p.id, '660 UC (600 + 60 Bonus)', 660, 9.60, 'NORMAL', 'Royale Pass', true FROM "Product" p WHERE p.slug = 'pubg-mobile' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_pubg_04', p.id, '1800 UC (1500 + 300 Bonus)', 1800, 23.90, 'NORMAL', 'Bonus 20%', true FROM "Product" p WHERE p.slug = 'pubg-mobile' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Package" ("id", "productId", "name", "amount", "price", "category", "badge", "isActive")
SELECT 'pkg_pubg_05', p.id, '3850 UC (3000 + 850 Bonus)', 3850, 47.90, 'NORMAL', 'SPECIAL 💎', true FROM "Product" p WHERE p.slug = 'pubg-mobile' LIMIT 1
ON CONFLICT ("id") DO NOTHING;

-- ====================================================================
-- 8. SUPABASE REALTIME CONFIGURATION
-- ====================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Order";
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Product";
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Package";
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
