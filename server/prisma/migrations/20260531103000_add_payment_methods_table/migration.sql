-- CreateEnum
CREATE TYPE "PaymentNetwork" AS ENUM ('TRC20', 'ETH', 'BTC', 'BSC', 'SOL');

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "network" "PaymentNetwork" NOT NULL,
    "logo" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);
