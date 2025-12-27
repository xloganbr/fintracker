
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TipoMovimentacao } from "@prisma/client";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({
            success: false,
            recordsImported: 0,
            recordsDeleted: 0,
            errors: ["Unauthorized"],
            message: "Falha na autenticação"
        }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({
                success: false,
                recordsImported: 0,
                recordsDeleted: 0,
                errors: ["Nenhum arquivo enviado"],
                message: "Falha na importação"
            }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const content = buffer.toString("utf-8");
        const lines = content.split(/\r?\n/);

        // Remove empty lines
        const nonEmptyLines = lines.filter(line => line.trim() !== "");

        if (nonEmptyLines.length < 2) {
            return NextResponse.json({
                success: false,
                recordsImported: 0,
                recordsDeleted: 0,
                errors: ["Arquivo vazio ou sem cabeçalhos"],
                message: "Falha na importação"
            }, { status: 400 });
        }

        const headers = nonEmptyLines[0].split(";").map(h => h.trim()); // Assume CSV uses ';' or ',' - need to detect or standardize.
        // Based on user description, usually Brazilian CSVs use ';' but standard is ','. 
        // Let's try to detect valid separate based on header count or assume ',' but handle ';'.
        // Actually, let's just use a simple robust split or a library if available. 
        // For simplicity without extra deps, I'll try to guess separator from the first line.

        const firstLine = nonEmptyLines[0];
        const separator = firstLine.includes(";") ? ";" : ",";

        const headerMap: { [key: string]: number } = {};
        firstLine.split(separator).forEach((h, i) => {
            headerMap[h.trim()] = i;
        });

        const requiredColumns = [
            "Entrada/Saída",
            "Data Movimentação",
            "Produto",
            "Instituição",
            "Quantidade",
            "Preço unitário",
            "Valor da Operação"
        ];

        for (const col of requiredColumns) {
            if (headerMap[col] === undefined) {
                return NextResponse.json({
                    success: false,
                    recordsImported: 0,
                    recordsDeleted: 0,
                    errors: [`Coluna obrigatória faltando: ${col}`],
                    message: "Falha na importação"
                }, { status: 400 });
            }
        }

        const recordsToCreate = [];
        let skippedCount = 0;

        for (let i = 1; i < nonEmptyLines.length; i++) {
            const line = nonEmptyLines[i];
            const cols = line.split(separator).map(c => c.trim());

            if (cols.length < requiredColumns.length) {
                skippedCount++;
                continue;
            }

            const entradaSaidaRaw = cols[headerMap["Entrada/Saída"]];
            const dataMovimentacaoRaw = cols[headerMap["Data Movimentação"]];
            const produtoRaw = cols[headerMap["Produto"]];
            const instituicaoRaw = cols[headerMap["Instituição"]];
            const quantidadeRaw = cols[headerMap["Quantidade"]];
            const precoUnitarioRaw = cols[headerMap["Preço unitário"]];
            const valorOperacaoRaw = cols[headerMap["Valor da Operação"]];

            // Parsing Logic
            let entradaSaida: TipoMovimentacao;
            if (entradaSaidaRaw.toLowerCase().includes("credito") || entradaSaidaRaw.toLowerCase().includes("crédito")) {
                entradaSaida = "CREDITO";
            } else if (entradaSaidaRaw.toLowerCase().includes("debito") || entradaSaidaRaw.toLowerCase().includes("débito")) {
                entradaSaida = "DEBITO";
            } else {
                console.warn(`Unknown Entrada/Saída: ${entradaSaidaRaw}`);
                skippedCount++;
                continue; // Or handle as default/error
            }

            // Data: DD/MM/YYYY
            const [day, month, year] = dataMovimentacaoRaw.split("/");
            const dataMovimentacao = new Date(`${year}-${month}-${day}`);
            if (isNaN(dataMovimentacao.getTime())) {
                console.warn(`Invalid Date: ${dataMovimentacaoRaw}`);
                skippedCount++;
                continue;
            }

            // Produto: Extract Code
            let codigoNegociacao = produtoRaw;
            if (produtoRaw.includes(" - ")) {
                codigoNegociacao = produtoRaw.split(" - ")[0].trim();
            }

            // Numbers: Remove "R$", replace "." with nothing (thousand sep) if "," exists, replace "," with "."
            // Wait, logic says "." as 1000 separator and "," as decimal? 
            // "1.000,00" -> 1000.00
            // "10,50" -> 10.50
            const parseMoney = (val: string) => {
                let clean = val.replace("R$", "").trim();
                // If it has both . and , assume . is thousand and , is decimal
                if (clean.includes(".") && clean.includes(",")) {
                    clean = clean.replace(/\./g, "").replace(",", ".");
                } else if (clean.includes(",")) {
                    // If only comma, assume it's decimal separator (Brazilian format)
                    clean = clean.replace(",", ".");
                }
                return parseFloat(clean);
            };

            const quantidade = parseMoney(quantidadeRaw);
            const precoUnitario = parseMoney(precoUnitarioRaw);
            const valorOperacao = parseMoney(valorOperacaoRaw);

            if (isNaN(quantidade) || isNaN(precoUnitario) || isNaN(valorOperacao)) {
                console.warn(`Invalid number in row ${i + 1}: Qtd=${quantidadeRaw}, Preco=${precoUnitarioRaw}, Valor=${valorOperacaoRaw}`);
                skippedCount++;
                continue;
            }

            recordsToCreate.push({
                userId,
                entradaSaida,
                dataMovimentacao,
                produto: produtoRaw,
                instituicao: instituicaoRaw,
                quantidade,
                precoUnitario,
                valorOperacao,
                codigoNegociacao,
            });
        }

        if (recordsToCreate.length > 0) {
            await prisma.movimentacao.createMany({
                data: recordsToCreate,
            });
        }

        return NextResponse.json({
            success: true,
            recordsImported: recordsToCreate.length,
            recordsDeleted: 0,
            message: "Importação realizada com sucesso",
        });

    } catch (error) {
        console.error("Error importing movimentacoes:", error);
        return NextResponse.json({
            success: false,
            recordsImported: 0,
            recordsDeleted: 0,
            errors: ["Erro interno do servidor"],
            message: "Falha na importação"
        }, { status: 500 });
    }
}
