import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TipoAtivo } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const categories = await prisma.categoriaAtivo.findMany({
            orderBy: {
                codigoNegociacao: 'asc',
            },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching asset categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch asset categories" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { codigoNegociacao, tipo } = body;

        if (!codigoNegociacao || !tipo) {
            return NextResponse.json(
                { error: "Código e Tipo são obrigatórios" },
                { status: 400 }
            );
        }

        // Validate TipoAtivo
        if (!Object.values(TipoAtivo).includes(tipo)) {
            return NextResponse.json(
                { error: "Tipo de ativo inválido" },
                { status: 400 }
            );
        }

        // Check if exists
        const existing = await prisma.categoriaAtivo.findUnique({
            where: {
                codigoNegociacao: codigoNegociacao.toUpperCase(),
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Código de negociação já cadastrado" },
                { status: 409 }
            );
        }

        const category = await prisma.categoriaAtivo.create({
            data: {
                codigoNegociacao: codigoNegociacao.toUpperCase(),
                tipo: tipo,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Error creating asset category:", error);
        return NextResponse.json(
            { error: "Failed to create asset category" },
            { status: 500 }
        );
    }
}
