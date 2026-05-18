-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'JS_TEMPLATE_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'JS_TEMPLATE_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'JS_TEMPLATE_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'JS_CONFIG_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'JS_CONFIG_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'JS_CONFIG_DELETE';

-- CreateTable
CREATE TABLE "JsTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "code" TEXT NOT NULL,
    "params" JSONB NOT NULL DEFAULT '[]',
    "stages" JSONB NOT NULL DEFAULT '[]',
    "compatibleWith" TEXT[],
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JsTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JsConfig" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientName" TEXT,
    "templateIds" TEXT[],
    "connections" JSONB NOT NULL DEFAULT '{}',
    "values" JSONB NOT NULL DEFAULT '{}',
    "generatedCode" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JsConfigTemplate" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "JsConfigTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JsTemplate_slug_key" ON "JsTemplate"("slug");

-- CreateIndex
CREATE INDEX "JsTemplate_category_order_idx" ON "JsTemplate"("category", "order");

-- CreateIndex
CREATE INDEX "JsTemplate_isActive_idx" ON "JsTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "JsConfig_slug_key" ON "JsConfig"("slug");

-- CreateIndex
CREATE INDEX "JsConfig_createdById_idx" ON "JsConfig"("createdById");

-- CreateIndex
CREATE INDEX "JsConfig_createdAt_idx" ON "JsConfig"("createdAt");

-- CreateIndex
CREATE INDEX "JsConfigTemplate_templateId_idx" ON "JsConfigTemplate"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "JsConfigTemplate_configId_position_key" ON "JsConfigTemplate"("configId", "position");

-- AddForeignKey
ALTER TABLE "JsConfig" ADD CONSTRAINT "JsConfig_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JsConfigTemplate" ADD CONSTRAINT "JsConfigTemplate_configId_fkey" FOREIGN KEY ("configId") REFERENCES "JsConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JsConfigTemplate" ADD CONSTRAINT "JsConfigTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "JsTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
