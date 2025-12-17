/**
 * Formata valores monetários para número decimal
 * Detecta automaticamente formato brasileiro (1.234,56) ou americano (1,234.56)
 * Exemplos: 
 *   "R$ 1.188,00" -> 1188.00 (brasileiro)
 *   "R$223.06" -> 223.06 (americano)
 *   " R$2,243.70 " -> 2243.70 (americano)
 * Trata valores vazios ("-") como NULL
 */
export function parseBrazilianCurrency(value: string | null | undefined): number | null {
    if (!value || value.trim() === '' || value.trim() === '-') return null;

    try {
        // Remove "R$" e espaços
        let cleaned = value
            .replace(/R\$/g, '')
            .replace(/\s/g, '');

        // Detectar formato baseado na posição dos separadores
        const lastComma = cleaned.lastIndexOf(',');
        const lastDot = cleaned.lastIndexOf('.');

        let normalized: string;

        if (lastComma > lastDot) {
            // Formato brasileiro: 1.234,56 ou 1234,56
            // Remove pontos (separador de milhar) e troca vírgula por ponto
            normalized = cleaned.replace(/\./g, '').replace(',', '.');
        } else if (lastDot > lastComma) {
            // Formato americano: 1,234.56 ou 1234.56
            // Remove vírgulas (separador de milhar) e mantém ponto
            normalized = cleaned.replace(/,/g, '');
        } else if (lastComma === -1 && lastDot === -1) {
            // Sem separadores: 1234
            normalized = cleaned;
        } else {
            // Apenas um separador - precisa determinar se é decimal ou milhar
            if (lastComma !== -1) {
                // Tem vírgula: verificar posição
                const afterComma = cleaned.substring(lastComma + 1);
                if (afterComma.length === 2) {
                    // Provavelmente decimal: 1234,56
                    normalized = cleaned.replace(',', '.');
                } else {
                    // Provavelmente milhar: 1,234
                    normalized = cleaned.replace(',', '');
                }
            } else {
                // Tem ponto: verificar posição
                const afterDot = cleaned.substring(lastDot + 1);
                if (afterDot.length === 2) {
                    // Provavelmente decimal: 1234.56
                    normalized = cleaned;
                } else {
                    // Provavelmente milhar: 1.234
                    normalized = cleaned.replace('.', '');
                }
            }
        }

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
 * Formata números para decimal
 * Detecta automaticamente formato brasileiro (1.234,56) ou americano (1,234.56)
 * Exemplos:
 *   "0,8" -> 0.8 (brasileiro)
 *   "1.234,56" -> 1234.56 (brasileiro)
 *   "1,234.56" -> 1234.56 (americano)
 * Remove aspas e trata valores vazios ("-") como NULL
 */
export function parseBrazilianNumber(value: string | null | undefined): number | null {
    if (!value || value.trim() === '' || value.trim() === '-') return null;

    try {
        // Remove espaços e aspas
        let cleaned = value.replace(/\s/g, '').replace(/"/g, '');

        // Detectar formato baseado na posição dos separadores
        const lastComma = cleaned.lastIndexOf(',');
        const lastDot = cleaned.lastIndexOf('.');

        let normalized: string;

        if (lastComma > lastDot) {
            // Formato brasileiro: 1.234,56 ou 0,8
            normalized = cleaned.replace(/\./g, '').replace(',', '.');
        } else if (lastDot > lastComma) {
            // Formato americano: 1,234.56 ou 0.8
            normalized = cleaned.replace(/,/g, '');
        } else if (lastComma === -1 && lastDot === -1) {
            // Sem separadores
            normalized = cleaned;
        } else {
            // Apenas um separador
            if (lastComma !== -1) {
                const afterComma = cleaned.substring(lastComma + 1);
                normalized = afterComma.length <= 2 ? cleaned.replace(',', '.') : cleaned.replace(',', '');
            } else {
                const afterDot = cleaned.substring(lastDot + 1);
                normalized = afterDot.length <= 2 ? cleaned : cleaned.replace('.', '');
            }
        }

        const parsed = parseFloat(normalized);

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
export function mapAssetType(type: string): 'ACAO' | 'ETF' | 'FUNDO' | 'TESOURO' | 'BDR' {
    const mapping: Record<string, 'ACAO' | 'ETF' | 'FUNDO' | 'TESOURO' | 'BDR'> = {
        'acoes': 'ACAO',
        'etf': 'ETF',
        'fii': 'FUNDO',
        'tesouro': 'TESOURO',
        'bdr': 'BDR',
    };

    return mapping[type.toLowerCase()] || 'ACAO';
}
