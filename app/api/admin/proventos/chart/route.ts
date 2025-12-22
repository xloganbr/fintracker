import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subYears, startOfMonth, format } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "1y"; // Default to 1y as per requirements (show 12 months by default)

        // Calculate date filter based on period
        let dateFilter: Date | undefined;
        const today = new Date();

        switch (period) {
            case "1y":
                dateFilter = subYears(today, 1);
                break;
            case "2y":
                dateFilter = subYears(today, 2);
                break;
            case "5y":
                dateFilter = subYears(today, 5);
                break;
            case "all":
            default:
                dateFilter = undefined; // No filter
                break;
        }

        // Build where clause
        const where: any = {
            userId: session.user.id,
        };

        if (dateFilter) {
            where.dataPagamento = {
                gte: dateFilter,
            };
        }

        // Fetch raw data with ticker info
        const proventos = await prisma.proventosConsolidado.findMany({
            where,
            select: {
                dataPagamento: true,
                valorLiquido: true,
                codigoNegociacao: true,
            },
            orderBy: {
                dataPagamento: 'asc',
            },
        });

        // Get unique tickers to fetch categories
        const uniqueTickers = Array.from(new Set(proventos.map(p => p.codigoNegociacao).filter(Boolean)));

        // Fetch categories
        const categories = await prisma.categoriaAtivo.findMany({
            where: {
                codigoNegociacao: { in: uniqueTickers as string[] }
            },
            select: {
                codigoNegociacao: true,
                tipo: true
            }
        });

        // Map ticker -> type
        const tickerTypeMap = new Map<string, string>();
        categories.forEach(c => tickerTypeMap.set(c.codigoNegociacao, c.tipo));

        // Aggregation Containers
        const timeSeriesData = new Map<string, number>();
        const categoryData = new Map<string, number>();
        const categoryAssets = new Map<string, Map<string, number>>(); // Category -> Ticker -> Value
        let totalValue = 0;

        proventos.forEach((item) => {
            if (!item.dataPagamento || !item.valorLiquido) return;

            const val = Number(item.valorLiquido);
            totalValue += val;

            // Time Series Aggregation
            const dateKey = format(item.dataPagamento, "yyyy-MM");
            timeSeriesData.set(dateKey, (timeSeriesData.get(dateKey) || 0) + val);

            // Category Aggregation
            const type = tickerTypeMap.get(item.codigoNegociacao) || 'OUTROS';
            categoryData.set(type, (categoryData.get(type) || 0) + val);

            // Asset Detail Aggregation
            if (!categoryAssets.has(type)) {
                categoryAssets.set(type, new Map<string, number>());
            }
            const assetsMap = categoryAssets.get(type)!;
            const ticker = item.codigoNegociacao || 'DESCONHECIDO';
            assetsMap.set(ticker, (assetsMap.get(ticker) || 0) + val);
        });

        // Format Time Series Data
        const chartData = Array.from(timeSeriesData.entries())
            .map(([key, value]) => ({
                date: `${key}-01`,
                value: Number(value.toFixed(2)),
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Format Category Data with Assets
        const allocationData = Array.from(categoryData.entries())
            .map(([category, value]) => {
                // Format assets for this category
                const assetsMap = categoryAssets.get(category)!;
                const assets = Array.from(assetsMap.entries())
                    .map(([ticker, val]) => ({
                        ticker,
                        value: Number(val.toFixed(2))
                    }))
                    .sort((a, b) => b.value - a.value); // Sort assets by value

                return {
                    category,
                    value: Number(value.toFixed(2)),
                    percentage: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(2)) : 0,
                    assets // detailed breakdown
                };
            })
            .sort((a, b) => b.value - a.value); // Sort by value desc

        return NextResponse.json({
            data: chartData,
            allocation: allocationData,
            period,
        });
    } catch (error) {
        console.error("Error fetching proventos chart data:", error);
        return NextResponse.json(
            { error: "Failed to fetch proventos chart data" },
            { status: 500 }
        );
    }
}
