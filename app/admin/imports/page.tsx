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
import { Upload, FileText } from "lucide-react";

export default function ImportsPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [assetType, setAssetType] = useState("");
    const [date, setDate] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.csv')) {
            setSelectedFile(file);
        } else {
            alert('Por favor, selecione um arquivo CSV válido');
            e.target.value = '';
        }
    };

    const handleImport = () => {
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

        // Validar formato da data DD/MM/YYYY
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!dateRegex.test(date)) {
            alert('Por favor, informe a data no formato DD/MM/YYYY');
            return;
        }

        // Lógica de importação será implementada no próximo prompt
        console.log('Importando:', { selectedFile, assetType, date });
        alert('Funcionalidade de importação será implementada no próximo passo!');
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
                                <Button onClick={handleImport} className="w-full sm:w-auto">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Importar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
