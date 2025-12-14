-- CreateEnum
CREATE TYPE "TipoAtivo" AS ENUM ('ACAO', 'ETF', 'FUNDO', 'TESOURO');

-- CreateTable
CREATE TABLE "portfolio_consolidado" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "dataBaseRef" DATE NOT NULL,
    "tipoAtivoCategoria" "TipoAtivo" NOT NULL,
    "produtoDescricao" VARCHAR(255),
    "instituicao" VARCHAR(100),
    "conta" VARCHAR(50),
    "codigoNegociacao" VARCHAR(20),
    "codigoIsin" VARCHAR(50),
    "quantidade" DECIMAL(18,8),
    "quantidadeDisponivel" DECIMAL(18,8),
    "quantidadeIndisponivel" DECIMAL(18,8),
    "valorAtualizado" DECIMAL(18,2),
    "precoFechamento" DECIMAL(18,2),
    "cnpjEmissor" VARCHAR(20),
    "tipoPapel" VARCHAR(50),
    "agenteCustodia" VARCHAR(100),
    "motivoIndisponibilidade" VARCHAR(100),
    "indexador" VARCHAR(20),
    "dataVencimento" DATE,
    "valorAplicado" DECIMAL(18,2),
    "valorBruto" DECIMAL(18,2),
    "valorLiquido" DECIMAL(18,2),
    "dataImportacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_consolidado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_portfolio_controle" ON "portfolio_consolidado"("userId", "dataBaseRef", "tipoAtivoCategoria");

-- AddForeignKey
ALTER TABLE "portfolio_consolidado" ADD CONSTRAINT "portfolio_consolidado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
