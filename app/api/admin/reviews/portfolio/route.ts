import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBrazilianDate } from "@/lib/formatters";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get("date");
        const assetType = searchParams.get("assetType");
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = 15;
        const sortBy = searchParams.get("sortBy") || "tipoAtivoCategoria";
        const sortOrder = searchParams.get("sortOrder") || "asc";

        // Validate date
        if (!dateStr) {
            return NextResponse.json(
                { error: "Date is required" },
                { status: 400 }
            );
        }

        const dataBaseRef = parseBrazilianDate(dateStr);
        if (!dataBaseRef) {
            return NextResponse.json(
                { error: "Invalid date format. Use DD/MM/YYYY" },
                { status: 400 }
            );
        }

        // Build where clause
        const where: any = {
            userId: session.user.id,
            dataBaseRef: dataBaseRef,
        };

        // Add asset type filter if not "TODOS"
        if (assetType && assetType !== "TODOS") {
            where.tipoAtivoCategoria = assetType;
        }

        // Get total count
        const totalCount = await prisma.portfolioConsolidado.count({ where });

        // Build orderBy clause
        const orderByClause: any = {};
        if (sortBy) {
            orderByClause[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
        }

        // Get paginated data
        const records = await prisma.portfolioConsolidado.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: sortBy ? orderByClause : [
                { tipoAtivoCategoria: 'asc' },
                { produtoDescricao: 'asc' },
            ],
        });

        // Calculate total sum of valorAtualizado
        const aggregation = await prisma.portfolioConsolidado.aggregate({
            where,
            _sum: {
                valorAtualizado: true,
            },
        });

        const totalValue = aggregation._sum.valorAtualizado || 0;

        return NextResponse.json({
            records: records.map(record => ({
                id: record.id.toString(), // Convert BigInt to string
                tipoAtivoCategoria: record.tipoAtivoCategoria,
                produtoDescricao: record.produtoDescricao,
                instituicao: record.instituicao,
                conta: record.conta,
                codigoNegociacao: record.codigoNegociacao,
                codigoIsin: record.codigoIsin,
                quantidade: record.quantidade ? Number(record.quantidade) : null,
                quantidadeDisponivel: record.quantidadeDisponivel ? Number(record.quantidadeDisponivel) : null,
                quantidadeIndisponivel: record.quantidadeIndisponivel ? Number(record.quantidadeIndisponivel) : null,
                valorAtualizado: record.valorAtualizado ? Number(record.valorAtualizado) : null,
                precoFechamento: record.precoFechamento ? Number(record.precoFechamento) : null,
                tipoPapel: record.tipoPapel,
                cnpjEmissor: record.cnpjEmissor,
                agenteCustodia: record.agenteCustodia,
                motivoIndisponibilidade: record.motivoIndisponibilidade,
                indexador: record.indexador,
                dataVencimento: record.dataVencimento,
                valorAplicado: record.valorAplicado ? Number(record.valorAplicado) : null,
                valorBruto: record.valorBruto ? Number(record.valorBruto) : null,
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
        console.error("Error fetching portfolio data:", error);
        return NextResponse.json(
            { error: "Failed to fetch portfolio data" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
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
        await prisma.portfolioConsolidado.delete({
            where: {
                id: BigInt(recordId),
                userId: session.user.id, // Ensure user can only delete their own records
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting portfolio record:", error);
        return NextResponse.json(
            { error: "Failed to delete record" },
            { status: 500 }
        );
    }
}
