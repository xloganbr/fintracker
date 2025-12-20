import ProventosChart from "@/components/proventos-chart";

export default function ProventosPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Proventos</h1>
                <p className="text-gray-600 mt-2">
                    Acompanhe a evolução dos proventos recebidos ao longo do tempo.
                </p>
            </div>

            <ProventosChart />
        </div>
    );
}
