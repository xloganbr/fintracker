"use client";

import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type TimePeriod = "2y" | "5y" | "10y" | "max";

interface ChartDataPoint {
    date: string;
    value: number;
}

interface PortfolioEvolutionChartProps {
    className?: string;
}

export default function PortfolioEvolutionChart({ className = "" }: PortfolioEvolutionChartProps) {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("2y");

    const fetchData = async (period: TimePeriod) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/dashboard/portfolio-evolution?period=${period}`);

            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            const result = await response.json();
            setData(result.data);
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
            return format(date, "dd/MM/yyyy", { locale: ptBR });
        } catch {
            return dateString;
        }
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium text-gray-900">
                        {formatDate(payload[0].payload.date)}
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

    const periodButtons: { label: string; value: TimePeriod }[] = [
        { label: "2 Anos", value: "2y" },
        { label: "5 Anos", value: "5y" },
        { label: "10 Anos", value: "10y" },
        { label: "Max", value: "max" },
    ];

    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-900">Evolução do Patrimônio</h2>

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
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: "14px" }}
                            formatter={() => "Valor do Patrimônio"}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))", r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Valor do Patrimônio"
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
