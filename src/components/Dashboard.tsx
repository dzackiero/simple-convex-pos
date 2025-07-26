import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Dashboard() {
  const todayStats = useQuery(api.sales.todayStats);
  const monthlyStats = useQuery(api.sales.monthlyStats);
  const recentSales = useQuery(api.sales.recentSales, { limit: 5 });

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!todayStats || !monthlyStats || !recentSales) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Penjualan</h1>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Penjualan Hari Ini</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatRupiah(todayStats.totalRevenue)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Transaksi Hari Ini</h3>
          <p className="text-2xl font-bold text-blue-600">
            {todayStats.totalTransactions}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Rata-rata per Transaksi</h3>
          <p className="text-2xl font-bold text-purple-600">
            {formatRupiah(todayStats.averageTransaction)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Keuntungan Hari Ini</h3>
          <p className="text-2xl font-bold text-orange-600">
            {formatRupiah(todayStats.totalProfit)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            HPP: {formatRupiah(todayStats.totalHpp)}
          </p>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Statistik Bulan Ini</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Penjualan:</span>
              <span className="font-semibold text-green-600">
                {formatRupiah(monthlyStats.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Transaksi:</span>
              <span className="font-semibold text-blue-600">
                {monthlyStats.totalTransactions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Keuntungan Bulan Ini:</span>
              <span className="font-semibold text-orange-600">
                {formatRupiah(monthlyStats.totalProfit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total HPP:</span>
              <span className="font-semibold text-red-600">
                {formatRupiah(monthlyStats.totalHpp)}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Transaksi Terbaru</h3>
          <div className="space-y-3">
            {recentSales.map(sale => (
              <div key={sale._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium">{formatRupiah(sale.total)}</p>
                  <p className="text-xs text-gray-500">
                    {sale.customerName || 'Pelanggan'} • {sale.paymentMethod}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(sale._creationTime)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {sale.items.length} item
                  </p>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p className="text-gray-500 text-center py-4">Belum ada transaksi</p>
            )}
          </div>
        </div>
      </div>

      {/* Daily Chart Data */}
      {Object.keys(monthlyStats.dailyStats).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Penjualan Harian Bulan Ini</h3>
          <div className="space-y-2">
            {Object.entries(monthlyStats.dailyStats)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 7)
              .map(([date, stats]) => (
                <div key={date} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    {new Date(date).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                  <div className="text-right">
                    <p className="font-medium">{formatRupiah(stats.revenue)}</p>
                    <p className="text-xs text-green-600">Profit: {formatRupiah(stats.profit)}</p>
                    <p className="text-xs text-gray-500">{stats.transactions} transaksi</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
