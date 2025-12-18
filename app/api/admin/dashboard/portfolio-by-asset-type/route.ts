import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subYears } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "2y";

        // Calculate date filter based on period
        let dateFilter: Date | undefined;
        const today = new Date();

        switch (period) {
            case "2y":
                dateFilter = subYears(today, 2);
                break;
            case "5y":
                dateFilter = subYears(today, 5);
                break;
            case "10y":
                dateFilter = subYears(today, 10);
                break;
            case "max":
            default:
                dateFilter = undefined; // No filter
                break;
        }

        // Build where clause
        const where: any = {
            userId: session.user.id,
        };

        if (dateFilter) {
            where.dataBaseRef = {
                gte: dateFilter,
            };
        }

        // Group by dataBaseRef and tipoAtivoCategoria, sum valorAtualizado
        const data = await prisma.portfolioConsolidado.groupBy({
            by: ['dataBaseRef', 'tipoAtivoCategoria'],
            where,
            _sum: {
                valorAtualizado: true,
            },
            orderBy: {
                dataBaseRef: 'asc',
            },
        });

        // Transform data for multi-line chart
        // Structure: { dates: [...], series: { ACAO: [...], ETF: [...], ... } }
        const dateMap = new Map<string, Map<string, number>>();

        data.forEach(item => {
            const dateKey = item.dataBaseRef.toISOString().split('T')[0];
            const assetType = item.tipoAtivoCategoria;
            const value = Number(item._sum.valorAtualizado || 0);

            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, new Map());
            }

            dateMap.get(dateKey)!.set(assetType, value);
        });

        // Get all unique dates and asset types
        const dates = Array.from(dateMap.keys()).sort();
        const assetTypes = ['ACAO', 'ETF', 'FUNDO', 'TESOURO', 'BDR', 'RFIXA'];

        // Build series object
        const series: Record<string, number[]> = {};
        assetTypes.forEach(assetType => {
            series[assetType] = dates.map(date => {
                return dateMap.get(date)?.get(assetType) || 0;
            });
        });

        return NextResponse.json({
            dates,
            series,
            period,
        });
    } catch (error) {
        console.error("Error fetching portfolio by asset type data:", error);
        return NextResponse.json(
            { error: "Failed to fetch portfolio by asset type data" },
            { status: 500 }
        );
    }
}
