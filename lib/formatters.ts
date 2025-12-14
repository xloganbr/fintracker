/**
 * Formata valores monetários brasileiros para número decimal
 * Exemplo: "R$ 1.188,00" -> 1188.00
 * Trata valores vazios ("-") como NULL
 */
export function parseBrazilianCurrency(value: string | null | undefined): number | null {
    if (!value || value.trim() === '' || value.trim() === '-') return null;

    try {
        // Remove "R$", espaços e pontos de milhar
        const cleaned = value
            .replace(/R\$/g, '')
            .replace(/\s/g, '')
            .replace(/\./g, '');

        // Substitui vírgula decimal por ponto
        const normalized = cleaned.replace(',', '.');

        const parsed = parseFloat(normalized);

        if (isNaN(parsed)) {
            throw new Error(`Invalid currency value: ${value}`);
        }

        return parsed;
    } catch (error) {
        throw new Error(`Failed to parse currency "${value}": ${error}`);
    }
}

/**
 * Formata números brasileiros para decimal
 * Exemplo: "0,8" -> 0.8 ou "1.234,56" -> 1234.56
 * Remove aspas e trata valores vazios ("-") como NULL
 */
export function parseBrazilianNumber(value: string | null | undefined): number | null {
    if (!value || value.trim() === '' || value.trim() === '-') return null;

    try {
        // Remove espaços e aspas
        let cleaned = value.replace(/\s/g, '').replace(/"/g, '');

        // Se tem ponto e vírgula, remove pontos (milhar) e troca vírgula por ponto
        if (cleaned.includes('.') && cleaned.includes(',')) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }
        // Se tem apenas vírgula, troca por ponto
        else if (cleaned.includes(',')) {
            cleaned = cleaned.replace(',', '.');
        }

        const parsed = parseFloat(cleaned);

        if (isNaN(parsed)) {
            throw new Error(`Invalid number value: ${value}`);
        }

        return parsed;
    } catch (error) {
        throw new Error(`Failed to parse number "${value}": ${error}`);
    }
}

/**
 * Converte data brasileira (DD/MM/YYYY) para objeto Date
 * Exemplo: "31/12/2024" -> Date object
 */
export function parseBrazilianDate(value: string | null | undefined): Date | null {
    if (!value || value.trim() === '' || value.trim() === '-') return null;

    try {
        const cleaned = value.trim();
        const parts = cleaned.split('/');

        if (parts.length !== 3) {
            throw new Error(`Invalid date format: ${value}. Expected DD/MM/YYYY`);
        }

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexed
        const year = parseInt(parts[2], 10);

        if (isNaN(day) || isNaN(month) || isNaN(year)) {
            throw new Error(`Invalid date components: ${value}`);
        }

        const date = new Date(year, month, day);

        // Validar se a data é válida
        if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
            throw new Error(`Invalid date: ${value}`);
        }

        return date;
    } catch (error) {
        throw new Error(`Failed to parse date "${value}": ${error}`);
    }
}

/**
 * Sanitiza string removendo espaços extras e normalizando
 * Trata valores vazios ("-") como NULL
 */
export function sanitizeString(value: string | null | undefined): string | null {
    if (!value || value.trim() === '' || value.trim() === '-') return null;

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
}

/**
 * Converte tipo de ativo do frontend para enum do banco
 */
export function mapAssetType(type: string): 'ACAO' | 'ETF' | 'FUNDO' | 'TESOURO' {
    const mapping: Record<string, 'ACAO' | 'ETF' | 'FUNDO' | 'TESOURO'> = {
        'acoes': 'ACAO',
        'etf': 'ETF',
        'fii': 'FUNDO',
        'tesouro': 'TESOURO',
    };

    return mapping[type.toLowerCase()] || 'ACAO';
}
