import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TipoAtivo } from "@prisma/client";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = parseInt(params.id);
        const body = await request.json();
        const { codigoNegociacao, tipo } = body;

        if (isNaN(id)) {
            return NextResponse.json(
                { error: "ID inválido" },
                { status: 400 }
            );
        }

        // Validate TipoAtivo
        if (tipo && !Object.values(TipoAtivo).includes(tipo)) {
            return NextResponse.json(
                { error: "Tipo de ativo inválido" },
                { status: 400 }
            );
        }

        // Check uniqueness if code is changing
        if (codigoNegociacao) {
            const existing = await prisma.categoriaAtivo.findUnique({
                where: {
                    codigoNegociacao: codigoNegociacao.toUpperCase(),
                },
            });

            if (existing && existing.id !== id) {
                return NextResponse.json(
                    { error: "Código de negociação já cadastrado" },
                    { status: 409 }
                );
            }
        }

        const updateData: any = {};
        if (codigoNegociacao) updateData.codigoNegociacao = codigoNegociacao.toUpperCase();
        if (tipo) updateData.tipo = tipo;

        const category = await prisma.categoriaAtivo.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error updating asset category:", error);
        return NextResponse.json(
            { error: "Failed to update asset category" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json(
                { error: "ID inválido" },
                { status: 400 }
            );
        }

        await prisma.categoriaAtivo.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting asset category:", error);
        return NextResponse.json(
            { error: "Failed to delete asset category" },
            { status: 500 }
        );
    }
}
