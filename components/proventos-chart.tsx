"use client";

import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type TimePeriod = "1y" | "2y" | "5y" | "all";

interface ChartDataPoint {
    date: string;
    value: number;
}

interface AssetData {
    ticker: string;
    value: number;
}

interface AllocationData {
    category: string;
    value: number;
    percentage: number;
    assets: AssetData[];
}

interface ProventosChartProps {
    className?: string;
}

export default function ProventosChart({ className = "" }: ProventosChartProps) {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [allocation, setAllocation] = useState<AllocationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1y");
    const [selectedCategory, setSelectedCategory] = useState<AllocationData | null>(null);

    const fetchData = async (period: TimePeriod) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/proventos/chart?period=${period}`);

            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            const result = await response.json();
            setData(result.data);
            setAllocation(result.allocation || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedPeriod);
    }, [selectedPeriod]);

    const handlePeriodChange = (period: TimePeriod) => {
        setSelectedPeriod(period);
        setSelectedCategory(null); // Close modal on period change
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, "MMM/yy", { locale: ptBR });
        } catch {
            return dateString;
        }
    };

    // Format full date for tooltip
    const formatTooltipDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, "MMMM 'de' yyyy", { locale: ptBR });
        } catch {
            return dateString;
        }
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium text-gray-900 capitalize">
                        {formatTooltipDate(payload[0].payload.date)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        <span className="font-semibold text-primary">
                            {formatCurrency(payload[0].value)}
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'ACAO': 'bg-blue-500',
            'FUNDO': 'bg-green-500', // FII
            'ETF': 'bg-purple-500',
            'TESOURO': 'bg-yellow-500',
            'BDR': 'bg-orange-500',
            'RFIXA': 'bg-cyan-500',
            'OUTROS': 'bg-gray-400'
        };
        return colors[category] || 'bg-gray-400';
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            'ACAO': 'Ações',
            'FUNDO': 'FIIs',
            'ETF': 'ETFs',
            'TESOURO': 'Tesouro Direto',
            'BDR': 'BDRs',
            'RFIXA': 'Renda Fixa',
            'OUTROS': 'Outros'
        };
        return labels[category] || category;
    };

    const periodButtons: { label: string; value: TimePeriod }[] = [
        { label: "1 Ano", value: "1y" },
        { label: "2 Anos", value: "2y" },
        { label: "5 Anos", value: "5y" },
        { label: "Tudo", value: "all" },
    ];

    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-900">Histórico de Proventos Mensais</h2>

                <div className="flex gap-2 flex-wrap">
                    {periodButtons.map((button) => (
                        <button
                            key={button.value}
                            onClick={() => handlePeriodChange(button.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === button.value
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {button.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600">Carregando dados...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                        <p className="text-red-600 font-medium">Erro ao carregar dados</p>
                        <p className="text-gray-600 mt-2">{error}</p>
                        <button
                            onClick={() => fetchData(selectedPeriod)}
                            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Tentar novamente
                        </button>
                    </div>
                </div>
            )}

            {!loading && !error && data.length === 0 && (
                <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                        <p className="text-gray-600">Nenhum dado disponível para o período selecionado</p>
                    </div>
                </div>
            )}

            {!loading && !error && data.length > 0 && (
                <>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={data}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="#6b7280"
                                style={{ fontSize: "12px" }}
                            />
                            <YAxis
                                tickFormatter={(value) => formatCurrency(value)}
                                stroke="#6b7280"
                                style={{ fontSize: "12px" }}
                                width={80}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Legend
                                wrapperStyle={{ fontSize: "14px" }}
                                formatter={() => "Valor Líquido Recebido"}
                            />
                            <Bar
                                dataKey="value"
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                                name="Valor Líquido Recebido"
                                maxBarSize={60}
                            />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Proventos</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        {formatCurrency(data.reduce((acc, curr) => acc + curr.value, 0))}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className="w-6 h-6 text-green-600"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Média Mensal</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        {formatCurrency(
                                            data.reduce((acc, curr) => acc + curr.value, 0) / (data.length || 1)
                                        )}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className="w-6 h-6 text-blue-600"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Allocation Bar */}
                    {allocation.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Composição dos Proventos</h3>
                            {/* Bar Container */}
                            <div className="w-full h-8 flex rounded-lg overflow-hidden">
                                {allocation.map((item, index) => (
                                    <div
                                        key={item.category}
                                        className={`${getCategoryColor(item.category)} relative group cursor-pointer transition-all hover:opacity-90`}
                                        style={{ width: `${item.percentage}%` }}
                                        title={`${getCategoryLabel(item.category)}: ${formatCurrency(item.value)} (${item.percentage}%) - Clique para detalhes`}
                                        onClick={() => setSelectedCategory(item)}
                                    >
                                        {item.percentage > 5 && (
                                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white whitespace-nowrap overflow-hidden px-1">
                                                {item.percentage}%
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-4 mt-4 justify-center">
                                {allocation.map((item) => (
                                    <div
                                        key={item.category}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                                        onClick={() => setSelectedCategory(item)}
                                    >
                                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(item.category)}`}></div>
                                        <span className="text-sm font-medium text-gray-700">
                                            {getCategoryLabel(item.category)}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            ({formatCurrency(item.value)})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Details Modal */}
            <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
                <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle>
                            Detalhamento: {selectedCategory ? getCategoryLabel(selectedCategory.category) : ''}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedCategory && (
                        <div className="mt-4 max-h-[60vh] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ativo</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedCategory.assets.map((asset) => (
                                        <TableRow key={asset.ticker}>
                                            <TableCell className="font-medium">{asset.ticker}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(asset.value)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-gray-50 font-bold">
                                        <TableCell>Total</TableCell>
                                        <TableCell className="text-right">{formatCurrency(selectedCategory.value)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
