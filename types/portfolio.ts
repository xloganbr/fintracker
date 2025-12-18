export interface PortfolioRecord {
    // Campos de Controle
    userId: string;
    dataBaseRef: Date;
    tipoAtivoCategoria: 'ACAO' | 'ETF' | 'FUNDO' | 'TESOURO' | 'BDR' | 'RFIXA';

    // Campos Comuns
    produtoDescricao?: string | null;
    instituicao?: string | null;
    conta?: string | null;
    codigoNegociacao?: string | null;
    codigoIsin?: string | null;

    // Dados Quantitativos
    quantidade?: number | null;
    quantidadeDisponivel?: number | null;
    quantidadeIndisponivel?: number | null;
    valorAtualizado?: number | null;
    precoFechamento?: number | null;

    // Campos Específicos
    cnpjEmissor?: string | null;
    tipoPapel?: string | null;
    agenteCustodia?: string | null;
    motivoIndisponibilidade?: string | null;

    // Tesouro Direto
    indexador?: string | null;
    dataVencimento?: Date | null;
    valorAplicado?: number | null;
    valorBruto?: number | null;
    valorLiquido?: number | null;
}

export interface ImportResult {
    success: boolean;
    recordsImported: number;
    recordsDeleted: number;
    errors: string[];
    message: string;
}

export type AssetType = 'acoes' | 'etf' | 'fii' | 'tesouro' | 'bdr' | 'rfixa';
