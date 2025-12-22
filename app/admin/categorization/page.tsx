"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type AssetType = "ACAO" | "ETF" | "FUNDO" | "TESOURO" | "BDR" | "RFIXA";

interface AssetCategory {
    id: number;
    codigoNegociacao: string;
    tipo: AssetType;
}

const ASSET_TYPES: { value: AssetType; label: string }[] = [
    { value: "ACAO", label: "Ações" },
    { value: "FUNDO", label: "Fundos Imobiliários / Fundos" },
    { value: "ETF", label: "ETFs" },
    { value: "TESOURO", label: "Tesouro Direto" },
    { value: "BDR", label: "BDRs" },
    { value: "RFIXA", label: "Renda Fixa" },
];

export default function CategorizationPage() {
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
    const [formData, setFormData] = useState<{ codigo: string; tipo: string }>({
        codigo: "",
        tipo: "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/admin/asset-categories");
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (category?: AssetCategory) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                codigo: category.codigoNegociacao,
                tipo: category.tipo,
            });
        } else {
            setEditingCategory(null);
            setFormData({ codigo: "", tipo: "" });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.codigo || !formData.tipo) return;

        setSaving(true);
        try {
            const url = editingCategory
                ? `/api/admin/asset-categories/${editingCategory.id}`
                : "/api/admin/asset-categories";

            const method = editingCategory ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    codigoNegociacao: formData.codigo,
                    tipo: formData.tipo,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || "Erro ao salvar");
                return;
            }

            await fetchCategories();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error saving:", error);
            alert("Erro ao salvar");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

        try {
            const response = await fetch(`/api/admin/asset-categories/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                await fetchCategories();
            } else {
                alert("Erro ao excluir");
            }
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const filteredCategories = categories.filter((cat) =>
        cat.codigoNegociacao.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Categorização de Ativos</h1>
                    <p className="text-gray-600 mt-2">
                        Gerencie a categorização dos seus ativos pelo código de negociação.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Categoria
                </Button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar por código..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código de Negociação</TableHead>
                                <TableHead>Tipo de Ativo</TableHead>
                                <TableHead className="w-[100px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            ) : filteredCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                        Nenhuma categoria encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCategories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">
                                            {category.codigoNegociacao}
                                        </TableCell>
                                        <TableCell>
                                            {ASSET_TYPES.find((t) => t.value === category.tipo)?.label || category.tipo}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(category)}
                                                >
                                                    <Pencil className="w-4 h-4 text-gray-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(category.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="codigo">Código de Negociação</Label>
                            <Input
                                id="codigo"
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                placeholder="EX: PETR4"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tipo">Tipo de Ativo</Label>
                            <Select
                                value={formData.tipo}
                                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ASSET_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
