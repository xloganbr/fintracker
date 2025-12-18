import { parseBrazilianDate, parseBrazilianNumber } from './formatters';

export interface ProventosCSVRow {
    [key: string]: string;
}

export interface ProventosRecord {
    userId: string;
    codigoNegociacao: string;
    produtoDescricao: string;
    dataPagamento: Date;
    tipoEvento: string | null;
    instituicao: string | null;
    quantidade: number | null;
    precoUnitario: number | null;
    valorLiquido: number | null;
}

/**
 * Extract codigo_negociacao from produto string
 * Rule: Extract text before first hyphen, then trim
 * Example: "SAPR4 - COMPANHIA..." -> "SAPR4"
 */
function extractCodigoNegociacao(produto: string): string {
    const hyphenIndex = produto.indexOf('-');

    if (hyphenIndex === -1) {
        // No hyphen found, return trimmed original
        return produto.trim();
    }

    // Extract substring before hyphen and trim
    return produto.substring(0, hyphenIndex).trim();
}

/**
 * Parse monetary value from Brazilian format
 * Example: "R$13.85" -> 13.85
 * Note: Uses dot (.) as decimal separator
 */
function parseProventosMonetary(value: string | null | undefined): number | null {
    if (!value || value.trim() === '' || value.trim() === '-') return null;

    try {
        // Remove "R$" prefix and whitespace
        const cleaned = value
            .replace(/R\$/g, '')
            .replace(/\s/g, '')
            .trim();

        if (cleaned === '' || cleaned === '-') return null;

        const parsed = parseFloat(cleaned);

        if (isNaN(parsed)) {
            throw new Error(`Invalid monetary value: ${value}`);
        }

        return parsed;
    } catch (error) {
        throw new Error(`Failed to parse monetary value "${value}": ${error}`);
    }
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
 * Transform CSV row to ProventosRecord
 */
function transformRowToRecord(
    row: ProventosCSVRow,
    userId: string,
    rowNumber: number
): ProventosRecord {
    const produto = row['Produto'];

    if (!produto) {
        throw new Error(`Missing 'Produto' column`);
    }

    // Extract codigo_negociacao using hyphen rule
    const codigoNegociacao = extractCodigoNegociacao(produto);

    if (!codigoNegociacao) {
        throw new Error(`Could not extract codigo_negociacao from produto: "${produto}"`);
    }

    // Parse date
    const dataPagamento = parseBrazilianDate(row['Pagamento']);
    if (!dataPagamento) {
        throw new Error(`Invalid or missing 'Pagamento' date: "${row['Pagamento']}"`);
    }

    const record: ProventosRecord = {
        userId,
        codigoNegociacao,
        produtoDescricao: produto.trim(),
        dataPagamento,
        tipoEvento: row['Tipo de Evento']?.trim() || null,
        instituicao: row['Instituição']?.trim() || null,
        quantidade: parseBrazilianNumber(row['Quantidade']),
        precoUnitario: parseProventosMonetary(row['Preço unitário']),
        valorLiquido: parseProventosMonetary(row['Valor líquido']),
    };

    return record;
}

/**
 * Parse proventos CSV content and transform to ProventosRecord array
 */
export async function parseProventosCSV(
    csvContent: string,
    userId: string
): Promise<{ records: ProventosRecord[]; errors: string[] }> {
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);

    // Validate required columns
    const requiredColumns = ['Produto', 'Pagamento', 'Tipo de Evento', 'Instituição', 'Quantidade', 'Preço unitário', 'Valor líquido'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Parse data rows
    const records: ProventosRecord[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        if (values.length === 0 || values.every(v => v.trim() === '' || v.trim() === '-')) {
            continue; // Skip empty lines
        }

        const row: ProventosCSVRow = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        try {
            const record = transformRowToRecord(row, userId, i + 1);
            records.push(record);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Linha ${i + 1}: ${errorMsg}`);
            // Continue processing other rows (don't abort)
        }
    }

    return { records, errors };
}
