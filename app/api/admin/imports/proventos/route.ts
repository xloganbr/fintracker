import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseProventosCSV } from "@/lib/proventos-parser";
import { ImportResult } from "@/types/portfolio";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get("file") as File;

        // Validate inputs
        if (!file) {
            return NextResponse.json(
                { error: "CSV file is required" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.name.endsWith('.csv')) {
            return NextResponse.json(
                { error: "File must be a CSV" },
                { status: 400 }
            );
        }

        // Read CSV content
        const csvContent = await file.text();

        // Parse CSV
        let parseResult;
        try {
            parseResult = await parseProventosCSV(csvContent, session.user.id);
        } catch (parseError) {
            const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
            return NextResponse.json(
                {
                    success: false,
                    recordsImported: 0,
                    recordsDeleted: 0,
                    errors: [errorMsg],
                    message: 'Erro ao processar CSV'
                } as ImportResult,
                { status: 400 }
            );
        }

        const { records, errors } = parseResult;

        if (records.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    recordsImported: 0,
                    recordsDeleted: 0,
                    errors: errors.length > 0 ? errors : ['No valid records found in CSV'],
                    message: 'Nenhum registro válido encontrado'
                } as ImportResult,
                { status: 400 }
            );
        }

        // Process records with idempotency check
        let importedCount = 0;
        let skippedCount = 0;
        const importErrors: string[] = [];

        // Use transaction for atomicity
        await prisma.$transaction(async (tx) => {
            for (const record of records) {
                try {
                    // Check if record already exists (idempotency)
                    const existing = await tx.proventosConsolidado.findFirst({
                        where: {
                            userId: record.userId,
                            codigoNegociacao: record.codigoNegociacao,
                            dataPagamento: record.dataPagamento,
                            instituicao: record.instituicao,
                            tipoEvento: record.tipoEvento,
                        },
                    });

                    if (existing) {
                        skippedCount++;
                        continue; // Skip duplicate
                    }

                    // Insert new record
                    await tx.proventosConsolidado.create({
                        data: {
                            userId: record.userId,
                            codigoNegociacao: record.codigoNegociacao,
                            produtoDescricao: record.produtoDescricao,
                            dataPagamento: record.dataPagamento,
                            tipoEvento: record.tipoEvento,
                            instituicao: record.instituicao,
                            quantidade: record.quantidade,
                            precoUnitario: record.precoUnitario,
                            valorLiquido: record.valorLiquido,
                        },
                    });

                    importedCount++;
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    importErrors.push(`Erro ao importar ${record.codigoNegociacao}: ${errorMsg}`);
                }
            }
        });

        // Combine parsing errors and import errors
        const allErrors = [...errors, ...importErrors];

        const result: ImportResult = {
            success: importedCount > 0,
            recordsImported: importedCount,
            recordsDeleted: skippedCount,
            errors: allErrors,
            message: importedCount > 0
                ? `${importedCount} registros importados com sucesso. ${skippedCount} duplicados ignorados.`
                : 'Nenhum registro foi importado',
        };

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error importing proventos:", error);

        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        const result: ImportResult = {
            success: false,
            recordsImported: 0,
            recordsDeleted: 0,
            errors: [errorMessage],
            message: "Failed to import proventos data",
        };

        return NextResponse.json(result, { status: 500 });
    }
}
