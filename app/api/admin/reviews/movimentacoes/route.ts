
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const startDateRaw = searchParams.get("startDate");
    const endDateRaw = searchParams.get("endDate");
    const assetType = searchParams.get("assetType");
    const ticker = searchParams.get("ticker");
    const sortBy = searchParams.get("sortBy") || "dataMovimentacao";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as Prisma.SortOrder;

    const skip = (page - 1) * pageSize;

    try {
        const where: Prisma.MovimentacaoWhereInput = {
            userId,
        };

        // Date Filter
        if (startDateRaw && endDateRaw) {
            const [startDay, startMonth, startYear] = startDateRaw.split("/");
            const [endDay, endMonth, endYear] = endDateRaw.split("/");

            // Check if dates are valid before constructing Date objects
            if (startDay && startMonth && startYear && endDay && endMonth && endYear) {
                const startDate = new Date(`${startYear}-${startMonth}-${startDay}`);
                const endDate = new Date(`${endYear}-${endMonth}-${endDay}`);
                endDate.setHours(23, 59, 59, 999); // Include the entire end day

                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                    where.dataMovimentacao = {
                        gte: startDate,
                        lte: endDate,
                    };
                }
            }
        }

        // Ticker Filter
        if (ticker) {
            where.codigoNegociacao = {
                contains: ticker.toUpperCase(),
                mode: "insensitive",
            };
        }

        // Asset Type Filter
        if (assetType && assetType !== "TODOS") {
            // Find tickers provided by this asset type
            const categories = await prisma.categoriaAtivo.findMany({
                where: {
                    tipo: assetType as any,
                },
                select: {
                    codigoNegociacao: true,
                },
            });

            const validTickers = categories.map((c) => c.codigoNegociacao);

            // If no tickers found for this type, we can arguably return empty or just filter by empty list
            if (validTickers.length > 0) {
                where.codigoNegociacao = {
                    in: validTickers,
                    // If ticker filter is also present, we need to respect both? 
                    // Usually AND logic. But here let's assume 'in' takes precedence or combine
                    ...(where.codigoNegociacao ? {
                        contains: ticker?.toUpperCase(),
                        mode: "insensitive",
                        in: validTickers
                    } : { in: validTickers })
                };
            } else {
                // If the category has no tickers, then no movements should match this filter
                // We can force an empty result by searching for a non-existent ID or similar, 
                // or simpler: just set a condition that is always false for tickers.
                where.codigoNegociacao = { in: [] };
            }
        }

        const [records, totalCount] = await Promise.all([
            prisma.movimentacao.findMany({
                where,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                skip,
                take: pageSize,
            }),
            prisma.movimentacao.count({ where }),
        ]);

        // Calculate total value of the filtered set (optional, maybe distinct from paginated view)
        // Or if we want total value of just this page? Usually total value is sum of all matching records.
        const aggregations = await prisma.movimentacao.aggregate({
            _sum: {
                valorOperacao: true,
            },
            where,
        });

        const totalPages = Math.ceil(totalCount / pageSize);

        const safeRecords = records.map((record) => ({
            ...record,
            id: record.id.toString(),
        }));

        return NextResponse.json({
            records: safeRecords,
            pagination: {
                page,
                pageSize,
                totalCount,
                totalPages,
            },
            totalValue: aggregations._sum.valorOperacao || 0,
        });

    } catch (error) {
        console.error("Error fetching movimentacoes:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    try {
        await prisma.movimentacao.delete({
            where: {
                id: BigInt(id),
                userId: session.user.id, // Ensure user owns the record
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting movimentacao:", error);
        return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
    }
}
