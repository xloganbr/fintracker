"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from "lucide-react";

interface PortfolioRecord {
    id: string;
    tipoAtivoCategoria: string;
    produtoDescricao: string | null;
    instituicao: string | null;
    conta: string | null;
    codigoNegociacao: string | null;
    quantidade: number | null;
    valorAtualizado: number | null;
    precoFechamento: number | null;
}

interface ReviewResponse {
    records: PortfolioRecord[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
    totalValue: number;
}

interface ProventoRecord {
    id: string;
    codigoNegociacao: string;
    produtoDescricao: string;
    dataPagamento: string;
    tipoEvento: string | null;
    instituicao: string | null;
    quantidade: number | null;
    precoUnitario: number | null;
    valorLiquido: number | null;
}

interface MovimentacaoRecord {
    id: string;
    entradaSaida: string;
    dataMovimentacao: string;
    produto: string;
    instituicao: string;
    quantidade: number;
    precoUnitario: number;
    valorOperacao: number;
    codigoNegociacao: string;
}

interface ProventosResponse {
    records: ProventoRecord[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
    totalValue: number;
}

interface MovimentacoesResponse {
    records: MovimentacaoRecord[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
    totalValue: number;
}

export default function ReviewsPage() {
    // Portfolio tab state
    const [date, setDate] = useState("");
    const [assetType, setAssetType] = useState("TODOS");
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<ReviewResponse | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<string>("tipoAtivoCategoria");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Proventos tab state
    const [dataPagamento, setDataPagamento] = useState("");
    const [ticker, setTicker] = useState("");
    const [instituicao, setInstituicao] = useState("");
    const [proventosLoading, setProventosLoading] = useState(false);
    const [proventosData, setProventosData] = useState<ProventosResponse | null>(null);
    const [proventosPage, setProventosPage] = useState(1);
    const [proventosError, setProventosError] = useState<string | null>(null);
    const [proventosSortBy, setProventosSortBy] = useState<string>("dataPagamento");


    const [proventosSortOrder, setProventosSortOrder] = useState<"asc" | "desc">("desc");
    const [proventosDeletingId, setProventosDeletingId] = useState<string | null>(null);

    // Movimentações tab state
    const [movDataInicial, setMovDataInicial] = useState("");
    const [movDataFinal, setMovDataFinal] = useState("");
    const [movAssetType, setMovAssetType] = useState("TODOS");
    const [movTicker, setMovTicker] = useState("");
    const [movLoading, setMovLoading] = useState(false);
    const [movData, setMovData] = useState<MovimentacoesResponse | null>(null);
    const [movPage, setMovPage] = useState(1);
    const [movError, setMovError] = useState<string | null>(null);
    const [movSortBy, setMovSortBy] = useState<string>("dataMovimentacao");
    const [movSortOrder, setMovSortOrder] = useState<"asc" | "desc">("desc");
    const [movDeletingId, setMovDeletingId] = useState<string | null>(null);

    const handleSearch = async (page: number = 1) => {
        if (!date) {
            alert('Por favor, informe a data base');
            return;
        }

        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!dateRegex.test(date)) {
            alert('Por favor, informe a data no formato DD/MM/YYYY');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                date,
                assetType,
                page: page.toString(),
                sortBy,
                sortOrder,
            });

            const response = await fetch(`/api/admin/reviews/portfolio?${params}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao buscar dados');
            }

            setData(result);
            setCurrentPage(page);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            setData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            // Toggle sort order if clicking the same column
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            // Set new column and default to ascending
            setSortBy(column);
            setSortOrder("asc");
        }
        // Trigger a new search with the updated sorting
        setTimeout(() => handleSearch(currentPage), 0);
    };

    const handleDelete = async (recordId: string) => {
        if (!confirm('Tem certeza que deseja excluir este registro?')) {
            return;
        }

        setDeletingId(recordId);
        try {
            const response = await fetch(`/api/admin/reviews/portfolio?id=${recordId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao excluir registro');
            }

            // Refresh the data after successful deletion
            await handleSearch(currentPage);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erro ao excluir registro');
        } finally {
            setDeletingId(null);
        }
    };

    // Proventos handlers
    const handleProventosSearch = async (page: number = 1) => {
        setProventosLoading(true);
        setProventosError(null);

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                sortBy: proventosSortBy,
                sortOrder: proventosSortOrder,
            });

            if (dataPagamento) {
                const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                if (!dateRegex.test(dataPagamento)) {
                    alert('Por favor, informe a data no formato DD/MM/YYYY');
                    setProventosLoading(false);
                    return;
                }
                params.append('dataPagamento', dataPagamento);
            }

            if (ticker) {
                params.append('ticker', ticker);
            }

            if (instituicao) {
                params.append('instituicao', instituicao);
            }

            const response = await fetch(`/api/admin/reviews/proventos?${params}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao buscar dados');
            }

            setProventosData(result);
            setProventosPage(page);
        } catch (err) {
            setProventosError(err instanceof Error ? err.message : 'Erro desconhecido');
            setProventosData(null);
        } finally {
            setProventosLoading(false);
        }
    };

    const handleProventosSort = (column: string) => {
        if (proventosSortBy === column) {
            setProventosSortOrder(proventosSortOrder === "asc" ? "desc" : "asc");
        } else {
            setProventosSortBy(column);
            setProventosSortOrder("asc");
        }
        setTimeout(() => handleProventosSearch(proventosPage), 0);
    };

    const handleProventosDelete = async (recordId: string) => {
        if (!confirm('Tem certeza que deseja excluir este registro?')) {
            return;
        }

        setProventosDeletingId(recordId);
        try {
            const response = await fetch(`/api/admin/reviews/proventos?id=${recordId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao excluir registro');
            }

            await handleProventosSearch(proventosPage);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erro ao excluir registro');
        } finally {
            setProventosDeletingId(null);
        }
    };

    const handleMovimentacoesSearch = async (page: number = 1) => {
        setMovLoading(true);
        setMovError(null);

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                sortBy: movSortBy,
                sortOrder: movSortOrder,
                assetType: movAssetType,
            });

            if (movDataInicial) {
                const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                if (!dateRegex.test(movDataInicial)) {
                    alert('Por favor, informe a Data Inicial no formato DD/MM/YYYY');
                    setMovLoading(false);
                    return;
                }
                params.append('startDate', movDataInicial);
            }

            if (movDataFinal) {
                const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                if (!dateRegex.test(movDataFinal)) {
                    alert('Por favor, informe a Data Final no formato DD/MM/YYYY');
                    setMovLoading(false);
                    return;
                }
                params.append('endDate', movDataFinal);
            }

            if (movTicker) {
                params.append('ticker', movTicker);
            }

            const response = await fetch(`/api/admin/reviews/movimentacoes?${params}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao buscar dados');
            }

            setMovData(result);
            setMovPage(page);
        } catch (err) {
            setMovError(err instanceof Error ? err.message : 'Erro desconhecido');
            setMovData(null);
        } finally {
            setMovLoading(false);
        }
    };

    const handleMovimentacoesSort = (column: string) => {
        if (movSortBy === column) {
            setMovSortOrder(movSortOrder === "asc" ? "desc" : "asc");
        } else {
            setMovSortBy(column);
            setMovSortOrder("asc");
        }
        setTimeout(() => handleMovimentacoesSearch(movPage), 0);
    };

    const handleMovimentacoesDelete = async (recordId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta movimentação?')) {
            return;
        }

        setMovDeletingId(recordId);
        try {
            const response = await fetch(`/api/admin/reviews/movimentacoes?id=${recordId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao excluir registro');
            }

            await handleMovimentacoesSearch(movPage);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erro ao excluir registro');
        } finally {
            setMovDeletingId(null);
        }
    };


    const SortableHeader = ({ column, children, className = "" }: { column: string; children: React.ReactNode; className?: string }) => {
        const isSorted = sortBy === column;
        return (
            <TableHead className={className}>
                <button
                    onClick={() => handleSort(column)}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors font-medium"
                >
                    {children}
                    {isSorted ? (
                        sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-30" />
                    )}
                </button>
            </TableHead>
        );
    };

    const ProventosSortableHeader = ({ column, children, className = "" }: { column: string; children: React.ReactNode; className?: string }) => {
        const isSorted = proventosSortBy === column;
        return (
            <TableHead className={className}>
                <button
                    onClick={() => handleProventosSort(column)}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors font-medium"
                >
                    {children}
                    {isSorted ? (
                        proventosSortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-30" />
                    )}
                </button>
            </TableHead>
        );
    };

    const MovimentacoesSortableHeader = ({ column, children, className = "" }: { column: string; children: React.ReactNode; className?: string }) => {
        const isSorted = movSortBy === column;
        return (
            <TableHead className={className}>
                <button
                    onClick={() => handleMovimentacoesSort(column)}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors font-medium"
                >
                    {children}
                    {isSorted ? (
                        movSortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-30" />
                    )}
                </button>
            </TableHead>
        );
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatNumber = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
        }).format(value);
    };

    const assetTypeLabels: Record<string, string> = {
        ACAO: 'Ação',
        ETF: 'ETF',
        FUNDO: 'Fundo Imobiliário',
        TESOURO: 'Tesouro Direto',
        BDR: 'BDR',
        RFIXA: 'Renda Fixa',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Conferências</h1>
                <p className="text-gray-600 mt-1">Consulte e confira os dados importados</p>
            </div>

            <Tabs defaultValue="portfolio" className="w-full">
                <TabsList>
                    <TabsTrigger value="portfolio">Portfólio Consolidado</TabsTrigger>
                    <TabsTrigger value="proventos">Proventos</TabsTrigger>
                    <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
                </TabsList>

                <TabsContent value="portfolio" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Consultar Portfólio</CardTitle>
                            <CardDescription>
                                Filtre por data e tipo de ativo para visualizar seus investimentos
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Data Base *</Label>
                                    <Input
                                        id="date"
                                        type="text"
                                        placeholder="DD/MM/YYYY"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        maxLength={10}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="asset-type">Tipo de Ativo</Label>
                                    <Select value={assetType} onValueChange={setAssetType}>
                                        <SelectTrigger id="asset-type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TODOS">Todos</SelectItem>
                                            <SelectItem value="ACAO">Ações</SelectItem>
                                            <SelectItem value="ETF">ETF</SelectItem>
                                            <SelectItem value="FUNDO">Fundos Imobiliários</SelectItem>
                                            <SelectItem value="TESOURO">Tesouro Direto</SelectItem>
                                            <SelectItem value="BDR">BDR</SelectItem>
                                            <SelectItem value="RFIXA">Renda Fixa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end">
                                    <Button
                                        onClick={() => handleSearch(1)}
                                        disabled={isLoading}
                                        className="w-full"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Consultando...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-4 h-4 mr-2" />
                                                Consultar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* Results Table */}
                            {data && data.records.length > 0 && (
                                <div className="space-y-4">
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <SortableHeader column="tipoAtivoCategoria">Tipo</SortableHeader>
                                                    <SortableHeader column="produtoDescricao">Produto</SortableHeader>
                                                    <SortableHeader column="instituicao">Instituição</SortableHeader>
                                                    <SortableHeader column="conta">Conta</SortableHeader>
                                                    <SortableHeader column="codigoNegociacao">Código</SortableHeader>
                                                    <SortableHeader column="quantidade" className="text-right">Quantidade</SortableHeader>
                                                    <SortableHeader column="precoFechamento" className="text-right">Preço</SortableHeader>
                                                    <SortableHeader column="valorAtualizado" className="text-right">Valor Atualizado</SortableHeader>
                                                    <TableHead className="text-center">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.records.map((record) => (
                                                    <TableRow key={record.id}>
                                                        <TableCell className="font-medium">
                                                            {assetTypeLabels[record.tipoAtivoCategoria] || record.tipoAtivoCategoria}
                                                        </TableCell>
                                                        <TableCell>{record.produtoDescricao || '-'}</TableCell>
                                                        <TableCell>{record.instituicao || '-'}</TableCell>
                                                        <TableCell>{record.conta || '-'}</TableCell>
                                                        <TableCell>{record.codigoNegociacao || '-'}</TableCell>
                                                        <TableCell className="text-right">{formatNumber(record.quantidade)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(record.precoFechamento)}</TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            {formatCurrency(record.valorAtualizado)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(record.id)}
                                                                disabled={deletingId === record.id}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                {deletingId === record.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Total and Pagination */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                                        <div className="text-lg font-semibold">
                                            Total: {formatCurrency(data.totalValue)}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSearch(currentPage - 1)}
                                                disabled={currentPage === 1 || isLoading}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Anterior
                                            </Button>

                                            <span className="text-sm text-gray-600">
                                                Página {data.pagination.page} de {data.pagination.totalPages}
                                                ({data.pagination.totalCount} registros)
                                            </span>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSearch(currentPage + 1)}
                                                disabled={currentPage === data.pagination.totalPages || isLoading}
                                            >
                                                Próxima
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {data && data.records.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <p className="text-lg font-medium">Nenhum registro encontrado</p>
                                    <p className="text-sm mt-1">
                                        Tente ajustar os filtros ou importe dados primeiro
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="proventos" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Consultar Proventos</CardTitle>
                            <CardDescription>
                                Filtre por data de pagamento, ticker e instituição para visualizar seus proventos
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dataPagamento">Data Pagamento</Label>
                                    <Input
                                        id="dataPagamento"
                                        type="text"
                                        placeholder="DD/MM/YYYY"
                                        value={dataPagamento}
                                        onChange={(e) => setDataPagamento(e.target.value)}
                                        maxLength={10}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ticker">Ticker</Label>
                                    <Input
                                        id="ticker"
                                        type="text"
                                        placeholder="Ex: PETR4"
                                        value={ticker}
                                        onChange={(e) => setTicker(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="instituicao-provento">Instituição</Label>
                                    <Input
                                        id="instituicao-provento"
                                        type="text"
                                        placeholder="Ex: Clear"
                                        value={instituicao}
                                        onChange={(e) => setInstituicao(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-end">
                                    <Button
                                        onClick={() => handleProventosSearch(1)}
                                        disabled={proventosLoading}
                                        className="w-full"
                                    >
                                        {proventosLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Consultando...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-4 h-4 mr-2" />
                                                Consultar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {proventosError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    {proventosError}
                                </div>
                            )}

                            {/* Results Table */}
                            {proventosData && proventosData.records.length > 0 && (
                                <div className="space-y-4">
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <ProventosSortableHeader column="dataPagamento">Data Pagamento</ProventosSortableHeader>
                                                    <ProventosSortableHeader column="codigoNegociacao">Ticker</ProventosSortableHeader>
                                                    <ProventosSortableHeader column="produtoDescricao">Produto</ProventosSortableHeader>
                                                    <ProventosSortableHeader column="tipoEvento">Tipo Evento</ProventosSortableHeader>
                                                    <ProventosSortableHeader column="instituicao">Instituição</ProventosSortableHeader>
                                                    <ProventosSortableHeader column="quantidade" className="text-right">Quantidade</ProventosSortableHeader>
                                                    <ProventosSortableHeader column="precoUnitario" className="text-right">Preço Unitário</ProventosSortableHeader>
                                                    <ProventosSortableHeader column="valorLiquido" className="text-right">Valor Líquido</ProventosSortableHeader>
                                                    <TableHead className="text-center">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {proventosData.records.map((record) => (
                                                    <TableRow key={record.id}>
                                                        <TableCell className="font-medium">
                                                            {new Date(record.dataPagamento).toLocaleDateString('pt-BR')}
                                                        </TableCell>
                                                        <TableCell>{record.codigoNegociacao}</TableCell>
                                                        <TableCell>{record.produtoDescricao}</TableCell>
                                                        <TableCell>{record.tipoEvento || '-'}</TableCell>
                                                        <TableCell>{record.instituicao || '-'}</TableCell>
                                                        <TableCell className="text-right">{formatNumber(record.quantidade)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(record.precoUnitario)}</TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            {formatCurrency(record.valorLiquido)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleProventosDelete(record.id)}
                                                                disabled={proventosDeletingId === record.id}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                {proventosDeletingId === record.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Total and Pagination */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                                        <div className="text-lg font-semibold">
                                            Total: {formatCurrency(proventosData.totalValue)}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleProventosSearch(proventosPage - 1)}
                                                disabled={proventosPage === 1 || proventosLoading}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Anterior
                                            </Button>

                                            <span className="text-sm text-gray-600">
                                                Página {proventosData.pagination.page} de {proventosData.pagination.totalPages}
                                                ({proventosData.pagination.totalCount} registros)
                                            </span>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleProventosSearch(proventosPage + 1)}
                                                disabled={proventosPage === proventosData.pagination.totalPages || proventosLoading}
                                            >
                                                Próxima
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {proventosData && proventosData.records.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <p className="text-lg font-medium">Nenhum registro encontrado</p>
                                    <p className="text-sm mt-1">
                                        Tente ajustar os filtros ou importe dados primeiro
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="movimentacoes" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Consultar Movimentações</CardTitle>
                            <CardDescription>
                                Filtre por período, tipo de ativo e ticker
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="movDataInicial">Data Inicial</Label>
                                    <Input
                                        id="movDataInicial"
                                        type="text"
                                        placeholder="DD/MM/YYYY"
                                        value={movDataInicial}
                                        onChange={(e) => setMovDataInicial(e.target.value)}
                                        maxLength={10}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="movDataFinal">Data Final</Label>
                                    <Input
                                        id="movDataFinal"
                                        type="text"
                                        placeholder="DD/MM/YYYY"
                                        value={movDataFinal}
                                        onChange={(e) => setMovDataFinal(e.target.value)}
                                        maxLength={10}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="movAssetType">Tipo de Ativo</Label>
                                    <Select value={movAssetType} onValueChange={setMovAssetType}>
                                        <SelectTrigger id="movAssetType">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TODOS">Todos</SelectItem>
                                            <SelectItem value="ACAO">Ações</SelectItem>
                                            <SelectItem value="ETF">ETF</SelectItem>
                                            <SelectItem value="FUNDO">Fundos Imobiliários</SelectItem>
                                            <SelectItem value="TESOURO">Tesouro Direto</SelectItem>
                                            <SelectItem value="BDR">BDR</SelectItem>
                                            <SelectItem value="RFIXA">Renda Fixa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="movTicker">Ticker</Label>
                                    <Input
                                        id="movTicker"
                                        type="text"
                                        placeholder="Ex: PETR4"
                                        value={movTicker}
                                        onChange={(e) => setMovTicker(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-end">
                                    <Button
                                        onClick={() => handleMovimentacoesSearch(1)}
                                        disabled={movLoading}
                                        className="w-full"
                                    >
                                        {movLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Consultando...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-4 h-4 mr-2" />
                                                Consultar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {movError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    {movError}
                                </div>
                            )}

                            {/* Results Table */}
                            {movData && movData.records.length > 0 && (
                                <div className="space-y-4">
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <MovimentacoesSortableHeader column="entradaSaida">Tipo</MovimentacoesSortableHeader>
                                                    <MovimentacoesSortableHeader column="dataMovimentacao">Data</MovimentacoesSortableHeader>
                                                    <MovimentacoesSortableHeader column="codigoNegociacao">Ticker</MovimentacoesSortableHeader>
                                                    <MovimentacoesSortableHeader column="produto">Produto</MovimentacoesSortableHeader>
                                                    <MovimentacoesSortableHeader column="instituicao">Instituição</MovimentacoesSortableHeader>
                                                    <MovimentacoesSortableHeader column="quantidade" className="text-right">Qtd</MovimentacoesSortableHeader>
                                                    <MovimentacoesSortableHeader column="precoUnitario" className="text-right">Preço</MovimentacoesSortableHeader>
                                                    <MovimentacoesSortableHeader column="valorOperacao" className="text-right">Total</MovimentacoesSortableHeader>
                                                    <TableHead className="text-center">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {movData.records.map((record) => (
                                                    <TableRow key={record.id}>
                                                        <TableCell>
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${record.entradaSaida === 'CREDITO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {record.entradaSaida === 'CREDITO' ? 'Crédito' : 'Débito'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {new Date(record.dataMovimentacao).toLocaleDateString('pt-BR')}
                                                        </TableCell>
                                                        <TableCell>{record.codigoNegociacao}</TableCell>
                                                        <TableCell>{record.produto}</TableCell>
                                                        <TableCell>{record.instituicao}</TableCell>
                                                        <TableCell className="text-right">{formatNumber(record.quantidade)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(record.precoUnitario)}</TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            {formatCurrency(record.valorOperacao)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleMovimentacoesDelete(record.id)}
                                                                disabled={movDeletingId === record.id}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                {movDeletingId === record.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Total and Pagination */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                                        <div className="text-lg font-semibold">
                                            Total: {formatCurrency(movData.totalValue)}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleMovimentacoesSearch(movPage - 1)}
                                                disabled={movPage === 1 || movLoading}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Anterior
                                            </Button>

                                            <span className="text-sm text-gray-600">
                                                Página {movData.pagination.page} de {movData.pagination.totalPages}
                                                ({movData.pagination.totalCount} registros)
                                            </span>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleMovimentacoesSearch(movPage + 1)}
                                                disabled={movPage === movData.pagination.totalPages || movLoading}
                                            >
                                                Próxima
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {movData && movData.records.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <p className="text-lg font-medium">Nenhum registro encontrado</p>
                                    <p className="text-sm mt-1">
                                        Tente ajustar os filtros ou importe dados primeiro
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
