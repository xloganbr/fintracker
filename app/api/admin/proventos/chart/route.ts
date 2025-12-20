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

        // Fetch raw data
        const proventos = await prisma.proventosConsolidado.findMany({
            where,
            select: {
                dataPagamento: true,
                valorLiquido: true,
            },
            orderBy: {
                dataPagamento: 'asc',
            },
        });

        // Aggregate by month mapping 'YYYY-MM' -> value
        const aggregatedData = new Map<string, number>();

        proventos.forEach((item) => {
            if (!item.dataPagamento || !item.valorLiquido) return;

            // Normalize to month start string "YYYY-MM"
            // We use YYYY-MM-01 just to have a clean sortable key that is also a valid date stub
            const dateKey = format(item.dataPagamento, "yyyy-MM");

            const currentValue = aggregatedData.get(dateKey) || 0;
            aggregatedData.set(dateKey, currentValue + Number(item.valorLiquido));
        });

        // Convert to array and sort
        const chartData = Array.from(aggregatedData.entries())
            .map(([key, value]) => ({
                date: `${key}-01`, // Reconstruct full date string for parsing on frontend
                value: Number(value.toFixed(2)),
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            data: chartData,
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
