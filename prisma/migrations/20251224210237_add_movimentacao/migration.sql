-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('CREDITO', 'DEBITO');

-- CreateTable
CREATE TABLE "categoria_ativo" (
    "id" SERIAL NOT NULL,
    "codigoNegociacao" VARCHAR(50) NOT NULL,
    "tipo" "TipoAtivo" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categoria_ativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacao" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "entradaSaida" "TipoMovimentacao" NOT NULL,
    "dataMovimentacao" DATE NOT NULL,
    "produto" VARCHAR(255) NOT NULL,
    "instituicao" VARCHAR(150) NOT NULL,
    "quantidade" DECIMAL(18,8) NOT NULL,
    "precoUnitario" DECIMAL(18,4) NOT NULL,
    "valorOperacao" DECIMAL(18,2) NOT NULL,
    "codigoNegociacao" VARCHAR(50) NOT NULL,
    "dataImportacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categoria_ativo_codigoNegociacao_key" ON "categoria_ativo"("codigoNegociacao");

-- CreateIndex
CREATE INDEX "movimentacao_userId_dataMovimentacao_idx" ON "movimentacao"("userId", "dataMovimentacao");

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
