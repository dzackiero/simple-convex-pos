import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { POSInterface } from "./components/POSInterface";
import { Dashboard } from "./components/Dashboard";
import { ProductManagement } from "./components/ProductManagement";
import { Transactions } from "./components/Transactions";
import { Settings } from "./components/Settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'dashboard' | 'products' | 'transactions' | 'settings'>('pos');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">POS System</h2>
        <div className="flex items-center gap-4">
          <Authenticated>
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('pos')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'pos'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kasir
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'products'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Produk
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Transaksi
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pengaturan
              </button>
            </nav>
          </Authenticated>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-4">
        <Content activeTab={activeTab} />
      </main>
      <Toaster />
    </div>
  );
}

function Content({ activeTab }: { activeTab: 'pos' | 'dashboard' | 'products' | 'transactions' | 'settings' }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Authenticated>
        {activeTab === 'pos' && <POSInterface />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'settings' && <Settings />}
      </Authenticated>
      
      <Unauthenticated>
        <div className="max-w-md mx-auto mt-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistem POS</h1>
            <p className="text-gray-600">Silakan masuk untuk menggunakan sistem kasir</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
