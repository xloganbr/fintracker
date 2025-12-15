import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePortfolioCSV } from "@/lib/csv-parser";
import { parseBrazilianDate, mapAssetType } from "@/lib/formatters";
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
        const assetType = formData.get("assetType") as string;
        const dateStr = formData.get("date") as string;

        // Validate inputs
        if (!file) {
            return NextResponse.json(
                { error: "CSV file is required" },
                { status: 400 }
            );
        }

        if (!assetType) {
            return NextResponse.json(
                { error: "Asset type is required" },
                { status: 400 }
            );
        }

        if (!dateStr) {
            return NextResponse.json(
                { error: "Reference date is required" },
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

        // Parse date
        const dataBaseRef = parseBrazilianDate(dateStr);
        if (!dataBaseRef) {
            return NextResponse.json(
                { error: "Invalid date format. Use DD/MM/YYYY" },
                { status: 400 }
            );
        }

        // Map asset type
        const tipoAtivo = mapAssetType(assetType);

        // Read CSV content
        const csvContent = await file.text();

        // Parse CSV - Isso pode lançar erro se houver problemas de parseamento
        let records;
        try {
            records = await parsePortfolioCSV(
                csvContent,
                session.user.id,
                dataBaseRef,
                tipoAtivo
            );
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

        if (records.length === 0) {
            return NextResponse.json(
                { error: "No valid records found in CSV" },
                { status: 400 }
            );
        }

        // Usar transação para garantir atomicidade (rollback em caso de erro)
        const result = await prisma.$transaction(async (tx) => {
            // Idempotent delete: Remove existing records for this user, date, and asset type
            const deleteResult = await tx.portfolioConsolidado.deleteMany({
                where: {
                    userId: session.user.id,
                    dataBaseRef: dataBaseRef,
                    tipoAtivoCategoria: tipoAtivo,
                },
            });

            // Insert new records
            const createResult = await tx.portfolioConsolidado.createMany({
                data: records.map(record => ({
                    ...record,
                    // Convert numbers to Decimal for Prisma
                    quantidade: record.quantidade !== null ? record.quantidade : undefined,
                    quantidadeDisponivel: record.quantidadeDisponivel !== null ? record.quantidadeDisponivel : undefined,
                    quantidadeIndisponivel: record.quantidadeIndisponivel !== null ? record.quantidadeIndisponivel : undefined,
                    valorAtualizado: record.valorAtualizado !== null ? record.valorAtualizado : undefined,
                    precoFechamento: record.precoFechamento !== null ? record.precoFechamento : undefined,
                    valorAplicado: record.valorAplicado !== null ? record.valorAplicado : undefined,
                    valorBruto: record.valorBruto !== null ? record.valorBruto : undefined,
                    valorLiquido: record.valorLiquido !== null ? record.valorLiquido : undefined,
                })),
            });

            return {
                recordsImported: createResult.count,
                recordsDeleted: deleteResult.count,
            };
        });

        const importResult: ImportResult = {
            success: true,
            recordsImported: result.recordsImported,
            recordsDeleted: result.recordsDeleted,
            errors: [],
            message: `Successfully imported ${result.recordsImported} records. ${result.recordsDeleted} existing records were replaced.`,
        };

        return NextResponse.json(importResult, { status: 200 });
    } catch (error) {
        console.error("Error importing portfolio:", error);

        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        const result: ImportResult = {
            success: false,
            recordsImported: 0,
            recordsDeleted: 0,
            errors: [errorMessage],
            message: "Failed to import portfolio data",
        };

        return NextResponse.json(result, { status: 500 });
    }
}
