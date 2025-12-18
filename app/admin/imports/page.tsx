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
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { ImportResult } from "@/types/portfolio";

export default function ImportsPage() {
    // Portfolio Consolidado state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [assetType, setAssetType] = useState("");
    const [date, setDate] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    // Proventos state
    const [proventosFile, setProventosFile] = useState<File | null>(null);
    const [isProcessingProventos, setIsProcessingProventos] = useState(false);
    const [proventosResult, setProventosResult] = useState<ImportResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.csv')) {
            setSelectedFile(file);
            setImportResult(null);
        } else {
            alert('Por favor, selecione um arquivo CSV válido');
            e.target.value = '';
        }
    };

    const handleProventosFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.csv')) {
            setProventosFile(file);
            setProventosResult(null);
        } else {
            alert('Por favor, selecione um arquivo CSV válido');
            e.target.value = '';
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            alert('Por favor, selecione um arquivo CSV');
            return;
        }
        if (!assetType) {
            alert('Por favor, selecione o tipo de ativo');
            return;
        }
        if (!date) {
            alert('Por favor, informe a data');
            return;
        }

        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!dateRegex.test(date)) {
            alert('Por favor, informe a data no formato DD/MM/YYYY');
            return;
        }

        setIsImporting(true);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('assetType', assetType);
            formData.append('date', date);

            const response = await fetch('/api/admin/imports/portfolio', {
                method: 'POST',
                body: formData,
            });

            const result: ImportResult = await response.json();
            setImportResult(result);

            if (result.success) {
                setSelectedFile(null);
                setAssetType('');
                setDate('');
                const fileInput = document.getElementById('csv-file') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }
        } catch (error) {
            setImportResult({
                success: false,
                recordsImported: 0,
                recordsDeleted: 0,
                errors: ['Erro ao conectar com o servidor'],
                message: 'Falha na importação',
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleProcessProventos = async () => {
        if (!proventosFile) {
            alert('Por favor, selecione um arquivo CSV');
            return;
        }

        setIsProcessingProventos(true);
        setProventosResult(null);

        try {
            const formData = new FormData();
            formData.append('file', proventosFile);

            const response = await fetch('/api/admin/imports/proventos', {
                method: 'POST',
                body: formData,
            });

            const result: ImportResult = await response.json();
            setProventosResult(result);

            if (result.success) {
                setProventosFile(null);
                const fileInput = document.getElementById('proventos-file') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }
        } catch (error) {
            setProventosResult({
                success: false,
                recordsImported: 0,
                recordsDeleted: 0,
                errors: ['Erro ao conectar com o servidor'],
                message: 'Falha no processamento',
            });
        } finally {
            setIsProcessingProventos(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Importações</h1>
                <p className="text-gray-600 mt-1">Importe dados de portfólio e investimentos</p>
            </div>

            <Tabs defaultValue="portfolio" className="w-full">
                <TabsList>
                    <TabsTrigger value="portfolio">Portfólio Consolidado</TabsTrigger>
                    <TabsTrigger value="proventos">Proventos</TabsTrigger>
                </TabsList>

                <TabsContent value="portfolio" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Importar Portfólio Consolidado</CardTitle>
                            <CardDescription>
                                Faça upload de um arquivo CSV com os dados do seu portfólio
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* File Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="csv-file">Arquivo CSV</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="csv-file"
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        className="cursor-pointer"
                                    />
                                    {selectedFile && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FileText className="w-4 h-4" />
                                            <span>{selectedFile.name}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Selecione um arquivo CSV com os dados do portfólio
                                </p>
                            </div>

                            {/* Asset Type */}
                            <div className="space-y-2">
                                <Label htmlFor="asset-type">Tipo de Ativo</Label>
                                <Select value={assetType} onValueChange={setAssetType}>
                                    <SelectTrigger id="asset-type">
                                        <SelectValue placeholder="Selecione o tipo de ativo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="acoes">Ações</SelectItem>
                                        <SelectItem value="etf">ETF</SelectItem>
                                        <SelectItem value="fii">Fundos Imobiliários</SelectItem>
                                        <SelectItem value="tesouro">Tesouro Direto</SelectItem>
                                        <SelectItem value="bdr">BDR</SelectItem>
                                        <SelectItem value="rfixa">Renda Fixa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <Label htmlFor="date">Data de Referência</Label>
                                <Input
                                    id="date"
                                    type="text"
                                    placeholder="DD/MM/YYYY"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    maxLength={10}
                                />
                                <p className="text-xs text-gray-500">
                                    Informe a data de referência dos dados no formato DD/MM/YYYY
                                </p>
                            </div>

                            {/* Import Button */}
                            <div className="pt-4">
                                <Button
                                    onClick={handleImport}
                                    className="w-full sm:w-auto"
                                    disabled={isImporting}
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Importando...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Importar
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Import Result */}
                            {importResult && (
                                <div className={`mt-6 p-4 rounded-lg border ${importResult.success
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        {importResult.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <h4 className={`font-semibold ${importResult.success ? 'text-green-900' : 'text-red-900'
                                                }`}>
                                                {importResult.success ? 'Importação Concluída!' : 'Erro na Importação'}
                                            </h4>
                                            <p className={`text-sm mt-1 ${importResult.success ? 'text-green-700' : 'text-red-700'
                                                }`}>
                                                {importResult.message}
                                            </p>
                                            {importResult.success && (
                                                <div className="mt-2 text-sm text-green-700">
                                                    <p>• {importResult.recordsImported} registros importados</p>
                                                    {importResult.recordsDeleted > 0 && (
                                                        <p>• {importResult.recordsDeleted} registros anteriores substituídos</p>
                                                    )}
                                                </div>
                                            )}
                                            {!importResult.success && importResult.errors.length > 0 && (
                                                <div className="mt-2 text-sm text-red-700">
                                                    {importResult.errors.map((error, index) => (
                                                        <p key={index}>• {error}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="proventos" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Importar Proventos</CardTitle>
                            <CardDescription>
                                Faça upload de um arquivo CSV com os dados de proventos
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* File Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="proventos-file">Arquivo CSV</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="proventos-file"
                                        type="file"
                                        accept=".csv"
                                        onChange={handleProventosFileChange}
                                        className="cursor-pointer"
                                    />
                                    {proventosFile && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FileText className="w-4 h-4" />
                                            <span>{proventosFile.name}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Selecione um arquivo CSV com os dados de proventos
                                </p>
                            </div>

                            {/* Process Button */}
                            <div className="pt-4">
                                <Button
                                    onClick={handleProcessProventos}
                                    className="w-full sm:w-auto"
                                    disabled={isProcessingProventos}
                                >
                                    {isProcessingProventos ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Processar
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Process Result */}
                            {proventosResult && (
                                <div className={`mt-6 p-4 rounded-lg border ${proventosResult.success
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        {proventosResult.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <h4 className={`font-semibold ${proventosResult.success ? 'text-green-900' : 'text-red-900'
                                                }`}>
                                                {proventosResult.success ? 'Processamento Concluído!' : 'Erro no Processamento'}
                                            </h4>
                                            <p className={`text-sm mt-1 ${proventosResult.success ? 'text-green-700' : 'text-red-700'
                                                }`}>
                                                {proventosResult.message}
                                            </p>
                                            {proventosResult.success && (
                                                <div className="mt-2 text-sm text-green-700">
                                                    <p>• {proventosResult.recordsImported} registros processados</p>
                                                    {proventosResult.recordsDeleted > 0 && (
                                                        <p>• {proventosResult.recordsDeleted} registros anteriores substituídos</p>
                                                    )}
                                                </div>
                                            )}
                                            {!proventosResult.success && proventosResult.errors.length > 0 && (
                                                <div className="mt-2 text-sm text-red-700">
                                                    {proventosResult.errors.map((error, index) => (
                                                        <p key={index}>• {error}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
