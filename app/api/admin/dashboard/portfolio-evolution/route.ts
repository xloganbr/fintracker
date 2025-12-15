import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subYears } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "max";

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

        // Group by dataBaseRef and sum valorAtualizado
        const data = await prisma.portfolioConsolidado.groupBy({
            by: ['dataBaseRef'],
            where,
            _sum: {
                valorAtualizado: true,
            },
            orderBy: {
                dataBaseRef: 'asc',
            },
        });

        // Format the response
        const chartData = data.map(item => ({
            date: item.dataBaseRef.toISOString().split('T')[0], // YYYY-MM-DD format
            value: Number(item._sum.valorAtualizado || 0),
        }));

        return NextResponse.json({
            data: chartData,
            period,
        });
    } catch (error) {
        console.error("Error fetching portfolio evolution data:", error);
        return NextResponse.json(
            { error: "Failed to fetch portfolio evolution data" },
            { status: 500 }
        );
    }
}
