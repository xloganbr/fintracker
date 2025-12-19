import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBrazilianDate } from "@/lib/formatters";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dataPagamentoStr = searchParams.get("dataPagamento");
        const ticker = searchParams.get("ticker");
        const instituicao = searchParams.get("instituicao");
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = 15;
        const sortBy = searchParams.get("sortBy") || "dataPagamento";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        // Build where clause
        const where: any = {
            userId: session.user.id,
        };

        // Add dataPagamento filter if provided
        if (dataPagamentoStr) {
            const dataPagamento = parseBrazilianDate(dataPagamentoStr);
            if (!dataPagamento) {
                return NextResponse.json(
                    { error: "Invalid date format. Use DD/MM/YYYY" },
                    { status: 400 }
                );
            }
            where.dataPagamento = dataPagamento;
        }

        // Add ticker filter (codigoNegociacao) if provided
        if (ticker && ticker.trim() !== "") {
            where.codigoNegociacao = {
                contains: ticker.trim(),
                mode: 'insensitive',
            };
        }

        // Add instituicao filter with LIKE operation if provided
        if (instituicao && instituicao.trim() !== "") {
            where.instituicao = {
                contains: instituicao.trim(),
                mode: 'insensitive',
            };
        }

        // Get total count
        const totalCount = await prisma.proventosConsolidado.count({ where });

        // Build orderBy clause
        const orderByClause: any = {};
        if (sortBy) {
            orderByClause[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
        }

        // Get paginated data
        const records = await prisma.proventosConsolidado.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: sortBy ? orderByClause : { dataPagamento: 'desc' },
        });

        // Calculate total sum of valorLiquido
        const aggregation = await prisma.proventosConsolidado.aggregate({
            where,
            _sum: {
                valorLiquido: true,
            },
        });

        const totalValue = aggregation._sum.valorLiquido || 0;

        return NextResponse.json({
            records: records.map(record => ({
                id: record.id.toString(), // Convert BigInt to string
                codigoNegociacao: record.codigoNegociacao,
                produtoDescricao: record.produtoDescricao,
                dataPagamento: record.dataPagamento.toISOString().split('T')[0],
                tipoEvento: record.tipoEvento,
                instituicao: record.instituicao,
                quantidade: record.quantidade,
                precoUnitario: record.precoUnitario ? Number(record.precoUnitario) : null,
                valorLiquido: record.valorLiquido ? Number(record.valorLiquido) : null,
            })),
            pagination: {
                page,
                pageSize,
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
            },
            totalValue: Number(totalValue),
        });
    } catch (error) {
        console.error("Error fetching proventos data:", error);
        return NextResponse.json(
            { error: "Failed to fetch proventos data" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const recordId = searchParams.get("id");

        if (!recordId) {
            return NextResponse.json(
                { error: "Record ID is required" },
                { status: 400 }
            );
        }

        // Delete the record
        await prisma.proventosConsolidado.delete({
            where: {
                id: BigInt(recordId),
                userId: session.user.id, // Ensure user can only delete their own records
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting provento record:", error);
        return NextResponse.json(
            { error: "Failed to delete record" },
            { status: 500 }
        );
    }
}
