import { PortfolioRecord } from '@/types/portfolio';
import {
    parseBrazilianCurrency,
    parseBrazilianNumber,
    parseBrazilianDate,
    sanitizeString,
} from './formatters';

export interface CSVRow {
    [key: string]: string;
}

/**
 * Parse CSV content and transform to PortfolioRecord array
 */
export async function parsePortfolioCSV(
    csvContent: string,
    userId: string,
    dataBaseRef: Date,
    tipoAtivo: 'ACAO' | 'ETF' | 'FUNDO' | 'TESOURO'
): Promise<PortfolioRecord[]> {
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const records: PortfolioRecord[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        if (values.length === 0 || values.every(v => v.trim() === '' || v.trim() === '-')) {
            continue; // Skip empty lines
        }

        const row: CSVRow = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        try {
            const record = transformRowToRecord(row, userId, dataBaseRef, tipoAtivo);
            records.push(record);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Linha ${i + 1}: ${errorMsg}`);
        }
    }

    // Se houver erros, falhar integralmente
    if (errors.length > 0) {
        throw new Error(`Erros de parseamento encontrados:\n${errors.join('\n')}`);
    }

    return records;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

/**
 * Check if value is empty (-, empty string, or whitespace)
 */
function isEmpty(value: string): boolean {
    return !value || value.trim() === '' || value.trim() === '-';
}

/**
 * Transform CSV row to PortfolioRecord based on asset type
 */
function transformRowToRecord(
    row: CSVRow,
    userId: string,
    dataBaseRef: Date,
    tipoAtivo: 'ACAO' | 'ETF' | 'FUNDO' | 'TESOURO'
): PortfolioRecord {
    const record: PortfolioRecord = {
        userId,
        dataBaseRef,
        tipoAtivoCategoria: tipoAtivo,
    };

    if (tipoAtivo === 'ACAO') {
        // Mapeamento para Ações
        record.produtoDescricao = sanitizeString(row['Produto']);
        record.instituicao = sanitizeString(row['Instituição']);
        record.conta = sanitizeString(row['Conta']);
        record.codigoNegociacao = sanitizeString(row['Código de Negociação']);
        record.cnpjEmissor = sanitizeString(row['CNPJ da Empresa']);
        record.codigoIsin = sanitizeString(row['Código ISIN / Distribuição']);
        record.tipoPapel = sanitizeString(row['Tipo']);
        record.agenteCustodia = sanitizeString(row['Escriturador']); // Escriturador -> agente_custodia
        record.quantidade = parseBrazilianNumber(row['Quantidade']);
        record.precoFechamento = parseBrazilianCurrency(row['Preço de Fechamento']);
        record.valorAtualizado = parseBrazilianCurrency(row['Valor Atualizado']);

    } else if (tipoAtivo === 'ETF') {
        // Mapeamento para ETF (similar a Ações, mas CNPJ do Fundo)
        record.produtoDescricao = sanitizeString(row['Produto']);
        record.instituicao = sanitizeString(row['Instituição']);
        record.conta = sanitizeString(row['Conta']);
        record.codigoNegociacao = sanitizeString(row['Código de Negociação']);
        record.cnpjEmissor = sanitizeString(row['CNPJ do Fundo']); // CNPJ do Fundo -> cnpj_emissor
        record.codigoIsin = sanitizeString(row['Código ISIN / Distribuição']);
        record.tipoPapel = sanitizeString(row['Tipo']);
        record.agenteCustodia = sanitizeString(row['Escriturador']);
        record.quantidade = parseBrazilianNumber(row['Quantidade']);
        record.precoFechamento = parseBrazilianCurrency(row['Preço de Fechamento']);
        record.valorAtualizado = parseBrazilianCurrency(row['Valor Atualizado']);

    } else if (tipoAtivo === 'FUNDO') {
        // Mapeamento para Fundos Imobiliários
        record.produtoDescricao = sanitizeString(row['Produto']);
        record.instituicao = sanitizeString(row['Instituição']);
        record.conta = sanitizeString(row['Conta']);
        record.codigoNegociacao = sanitizeString(row['Código de Negociação']);
        record.cnpjEmissor = sanitizeString(row['CNPJ do Fundo']); // CNPJ do Fundo -> cnpj_emissor
        record.codigoIsin = sanitizeString(row['Código ISIN / Distribuição']);
        record.tipoPapel = sanitizeString(row['Tipo']);
        record.agenteCustodia = sanitizeString(row['Administrador']); // Administrador -> agente_custodia
        record.quantidade = parseBrazilianNumber(row['Quantidade']);
        record.precoFechamento = parseBrazilianCurrency(row['Preço de Fechamento']);
        record.valorAtualizado = parseBrazilianCurrency(row['Valor Atualizado']);

    } else if (tipoAtivo === 'TESOURO') {
        // Mapeamento para Tesouro Direto (estrutura diferente)
        record.produtoDescricao = sanitizeString(row['Produto']);
        record.instituicao = sanitizeString(row['Instituição']);
        record.codigoIsin = sanitizeString(row['Código ISIN']);
        record.indexador = sanitizeString(row['Indexador']);
        record.dataVencimento = parseBrazilianDate(row['Vencimento']);
        record.quantidade = parseBrazilianNumber(row['Quantidade']);
        record.valorAplicado = parseBrazilianCurrency(row['Valor Aplicado']);
        record.valorBruto = parseBrazilianCurrency(row['Valor bruto']);
        record.valorLiquido = parseBrazilianCurrency(row['Valor líquido']);
        record.valorAtualizado = parseBrazilianCurrency(row['Valor Atualizado']);

        // Campos que não existem no CSV do Tesouro
        record.conta = null;
        record.codigoNegociacao = null;
    }

    return record;
}
