import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TrendingUp, TrendingDown, Package, ShoppingCart, AlertTriangle, IndianRupee, Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const POLL_INTERVAL = 10000; // 10 seconds

// ── Skeleton loaders ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-3 w-28 bg-slate-200 rounded" />
        <div className="h-7 w-20 bg-slate-200 rounded" />
        <div className="h-3 w-24 bg-slate-200 rounded" />
      </div>
      <div className="w-12 h-12 bg-slate-200 rounded-lg" />
    </div>
  </div>
);

const SkeletonChart = () => (
  <div className="h-80 flex items-end gap-3 px-4 pb-4 animate-pulse">
    {[60, 45, 75, 55, 40, 70].map((h, i) => (
      <div key={i} className="flex-1 bg-slate-200 rounded-t" style={{ height: `${h}%` }} />
    ))}
  </div>
);

// ── KPI card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        {subtitle && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-500'}`}>
            {trend === 'up' && <TrendingUp size={12} />}
            {trend === 'down' && <TrendingDown size={12} />}
            {subtitle}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
    </div>
  </div>
);

// ── Period selector for chart ─────────────────────────────────────────────────
const PERIODS = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: 'week' },
  { label: '30 Days', value: 'month' },
  { label: 'All Time', value: 'all' },
];

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const Dashboard = () => {
  // KPIs
  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(true);

  // Chart
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('all');

  // Stock
  const [stockData, setStockData] = useState(null);
  const [stockLoading, setStockLoading] = useState(true);

  // Polling
  const [polling, setPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollRef = useRef(null);

  // ── Fetch functions ───────────────────────────────────────────────────────
  const fetchKpis = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/crm/dashboard/kpis');
      setKpis(data);
    } catch (e) {
      console.error('KPI fetch error:', e);
    } finally {
      setKpisLoading(false);
    }
  }, []);

  const fetchChart = useCallback(async (period) => {
    setChartLoading(true);
    try {
      const { data } = await axios.get(`/api/crm/dashboard/sales-by-channel?period=${period}`);
      setChartData(data);
    } catch (e) {
      console.error('Chart fetch error:', e);
    } finally {
      setChartLoading(false);
    }
  }, []);

  const fetchStock = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/crm/dashboard/low-stock');
      setStockData(data);
    } catch (e) {
      console.error('Stock fetch error:', e);
    } finally {
      setStockLoading(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchKpis();
    fetchChart(chartPeriod);
    fetchStock();
    setLastUpdated(new Date());
  }, [fetchKpis, fetchChart, fetchStock, chartPeriod]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => { fetchKpis(); }, [fetchKpis]);
  useEffect(() => { fetchChart(chartPeriod); }, [chartPeriod]);
  useEffect(() => { fetchStock(); }, [fetchStock]);

  // ── Polling logic ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (polling) {
      pollRef.current = setInterval(() => {
        fetchKpis();
        fetchStock();
        setLastUpdated(new Date());
      }, POLL_INTERVAL);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [polling, fetchKpis, fetchStock]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatCurrency = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;
  const formatTime = (d) => d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  const revenueSubtitle = kpis?.revenueChangePercent != null
    ? `${kpis.revenueChangePercent >= 0 ? '+' : ''}${kpis.revenueChangePercent}% vs yesterday`
    : 'No orders yesterday';
  const revenueTrend = kpis?.revenueChangePercent == null ? null : kpis.revenueChangePercent >= 0 ? 'up' : 'down';

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Dashboard</h1>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">Updated {formatTime(lastUpdated)}</span>
          )}

          {/* Manual refresh */}
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm transition-colors"
            title="Refresh now"
          >
            <RefreshCw size={15} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Polling toggle */}
          <button
            onClick={() => setPolling(p => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              polling
                ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={polling ? 'Auto-refresh ON (every 10s) — click to stop' : 'Enable auto-refresh'}
          >
            {polling ? <Wifi size={15} /> : <WifiOff size={15} />}
            <span className="hidden sm:inline">{polling ? 'Live' : 'Polling Off'}</span>
            {polling && (
              <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpisLoading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              title="Revenue (Today)"
              value={formatCurrency(kpis?.revenueToday)}
              icon={IndianRupee}
              color="bg-emerald-500"
              subtitle={revenueSubtitle}
              trend={revenueTrend}
            />
            <StatCard
              title="Orders (Today)"
              value={kpis?.ordersToday ?? '—'}
              icon={ShoppingCart}
              color="bg-blue-500"
              subtitle={`${kpis?.pendingOrders ?? 0} Pending`}
              trend={null}
            />
            <StatCard
              title="Profit (Today)"
              value={formatCurrency(kpis?.profitToday)}
              icon={Activity}
              color="bg-purple-500"
              subtitle={kpis?.revenueToday > 0
                ? `${Math.round((kpis.profitToday / kpis.revenueToday) * 100)}% Margin`
                : 'No revenue today'}
              trend={null}
            />
            <StatCard
              title="Low Stock Items"
              value={kpis?.lowStockCount ?? '—'}
              icon={AlertTriangle}
              color="bg-red-500"
              subtitle="≤ 10 units remaining"
              trend={null}
            />
          </>
        )}
      </div>

      {/* ── Charts + Stock ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sales by Channel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">Sales by Channel</h3>
            <div className="flex gap-1">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setChartPeriod(p.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    chartPeriod === p.value
                      ? 'bg-yellow-400 text-slate-900'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {chartLoading ? (
            <SkeletonChart />
          ) : chartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
              No orders found for this period
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#f59e0b" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Stock Overview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Stock Overview</h3>

          {stockLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-12 bg-slate-100 rounded-lg" />
              <div className="h-12 bg-slate-100 rounded-lg" />
              <div className="h-24 bg-slate-100 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary rows */}
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded text-yellow-600"><Package size={20} /></div>
                  <div>
                    <p className="font-medium text-sm">Total Products</p>
                    <p className="text-xs text-slate-500">{stockData?.activeProducts ?? 0} Active</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{stockData?.totalProducts ?? 0}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded text-blue-600"><Package size={20} /></div>
                  <div>
                    <p className="font-medium text-sm">Total Stock Units</p>
                    <p className="text-xs text-slate-500">Across all categories</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{(stockData?.totalStock ?? 0).toLocaleString('en-IN')}</span>
              </div>

              {/* Low stock alerts */}
              {(stockData?.lowStockProducts?.length ?? 0) > 0 ? (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <h4 className="text-red-800 font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} /> Low Stock Alerts
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {stockData.lowStockProducts.map(p => (
                      <li key={p.id}>
                        • {p.name} — only {p.stock} {p.unit} left
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-green-700 text-sm flex items-center gap-2">
                  <Package size={16} /> All products are well-stocked
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
