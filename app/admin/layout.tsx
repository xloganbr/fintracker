"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, LogOut, Menu, X, Upload, ClipboardCheck, TrendingUp, Tags } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Check if user is authenticated
    if (!session) {
        router.push("/login");
        return null;
    }

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push("/login");
    };

    const menuItems = [
        {
            icon: LayoutDashboard,
            label: "Dashboard",
            href: "/admin",
        },
        {
            icon: TrendingUp,
            label: "Proventos",
            href: "/admin/proventos",
        },
        {
            icon: Tags,
            label: "Categorização",
            href: "/admin/categorization",
        },
        {
            icon: Users,
            label: "Usuários",
            href: "/admin/users",
        },
        {
            icon: Upload,
            label: "Importações",
            href: "/admin/imports",
        },
        {
            icon: ClipboardCheck,
            label: "Conferências",
            href: "/admin/reviews",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5 text-white"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                            />
                        </svg>
                    </div>
                    <span className="font-bold text-lg">FinTracker</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2"
                >
                    {isMobileMenuOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <Menu className="w-6 h-6" />
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white border-b border-gray-200">
                    <nav className="px-4 py-2 space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <item.icon className="w-5 h-5 text-gray-600" />
                                <span className="text-gray-700">{item.label}</span>
                            </Link>
                        ))}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        >
                            <LogOut className="w-5 h-5 text-gray-600" />
                            <span className="text-gray-700">Sair</span>
                        </button>
                    </nav>
                </div>
            )}

            <div className="flex">
                {/* Sidebar - Desktop */}
                <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-6 h-6 text-white"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                                />
                            </svg>
                        </div>
                        <span className="font-bold text-xl">FinTracker</span>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900"
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="px-4 py-4 border-t border-gray-200">
                        <div className="flex items-center gap-3 px-4 py-2 mb-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                    {session?.user?.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {session?.user?.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {session?.user?.email}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="w-full"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sair
                        </Button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 lg:pl-64">
                    <div className="px-4 py-6 lg:px-8">{children}</div>
                </main>
            </div>
        </div>
    );
}
