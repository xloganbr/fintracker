-- CreateTable
CREATE TABLE "proventos_consolidado" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "codigoNegociacao" VARCHAR(20) NOT NULL,
    "produtoDescricao" VARCHAR(255) NOT NULL,
    "dataPagamento" DATE NOT NULL,
    "tipoEvento" VARCHAR(100),
    "instituicao" VARCHAR(150),
    "quantidade" INTEGER,
    "precoUnitario" DECIMAL(18,4),
    "valorLiquido" DECIMAL(18,2),
    "dataImportacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proventos_consolidado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proventos_consolidado_userId_codigoNegociacao_dataPagamento_idx" ON "proventos_consolidado"("userId", "codigoNegociacao", "dataPagamento");

-- AddForeignKey
ALTER TABLE "proventos_consolidado" ADD CONSTRAINT "proventos_consolidado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
