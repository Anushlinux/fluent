-- CreateTable
CREATE TABLE "FundedWallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "smartAccount" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "txHash" TEXT,
    "fundedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fundedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT
);

-- CreateTable
CREATE TABLE "FundingWallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "initialBalance" TEXT NOT NULL,
    "currentBalance" TEXT NOT NULL,
    "totalFunded" TEXT NOT NULL,
    "totalUsers" INTEGER NOT NULL,
    "lastChecked" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "FundedWallet_smartAccount_key" ON "FundedWallet"("smartAccount");

-- CreateIndex
CREATE INDEX "FundedWallet_smartAccount_idx" ON "FundedWallet"("smartAccount");

-- CreateIndex
CREATE INDEX "FundedWallet_fundedAt_idx" ON "FundedWallet"("fundedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FundingWallet_address_key" ON "FundingWallet"("address");
