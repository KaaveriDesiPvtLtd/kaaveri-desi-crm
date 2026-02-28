import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Filter, Eye, IndianRupee, Clock, CheckCircle, Truck, XCircle, RefreshCw, ChevronDown, Calendar, CreditCard, User, MapPin, Package, ExternalLink } from 'lucide-react';
import axios from 'axios';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = '/api/crm';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('orders', 'write');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [isPolling, setIsPolling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(null); // ID of order
  const [showFilters, setShowFilters] = useState(false);
  const [sideFilters, setSideFilters] = useState({
    channel: 'All',
    dateRange: 'All', // All, Today, Yesterday, Last 7 Days
    amountRange: 'All' // All, <1000, 1000-5000, >5000
  });

  const fetchOrders = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      // Sort by createdAt descending (recent first) - backend should handle this but manual sort for safety
      const sortedOrders = (response.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  // Polling logic
  useEffect(() => {
    let interval;
    if (isPolling) {
      interval = setInterval(() => {
        fetchOrders(false);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPolling, fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, { status: newStatus });
      if (response.data) {
        // Optimistic / Manual Refresh: Update local state immediately for "shifting"
        setOrders(prev => prev.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      }
      setShowStatusMenu(null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const s = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase();
    switch (s) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Processing': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Advanced Optimized Filtering Algorithm
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Status Tab filter - Case Insensitive check for safety
      if (activeTab !== 'All') {
        const orderStatus = order.status?.toLowerCase();
        const tabStatus = activeTab.toLowerCase();
        if (orderStatus !== tabStatus) return false;
      }

      // 2. Search Query (Order ID or Customer Name)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = order.orderId?.toLowerCase().includes(query);
        const matchesCustomer = order.customer?.name?.toLowerCase().includes(query);
        if (!matchesId && !matchesCustomer) return false;
      }

      // 3. Side Filters: Channel
      if (sideFilters.channel !== 'All' && order.channel !== sideFilters.channel) return false;

      // 4. Side Filters: Date Range
      if (sideFilters.dateRange !== 'All') {
        const orderDate = moment(order.createdAt);
        const today = moment().startOf('day');
        if (sideFilters.dateRange === 'Today' && !orderDate.isSame(today, 'day')) return false;
        if (sideFilters.dateRange === 'Yesterday' && !orderDate.isSame(today.clone().subtract(1, 'day'), 'day')) return false;
        if (sideFilters.dateRange === 'Last 7 Days' && orderDate.isBefore(today.clone().subtract(7, 'days'))) return false;
      }

      // 5. Side Filters: Amount
      if (sideFilters.amountRange !== 'All') {
        const amount = order.revenue;
        if (sideFilters.amountRange === '<1000' && amount >= 1000) return false;
        if (sideFilters.amountRange === '1000-5000' && (amount < 1000 || amount > 5000)) return false;
        if (sideFilters.amountRange === '>5000' && amount <= 5000) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery, sideFilters]);


  return (
    <div className="h-[calc(100vh-80px)] flex flex-col space-y-4 sm:space-y-6 overflow-hidden pb-4">
      {/* Header & Controls - Fixed */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Orders</h1>
          <div className="flex items-center mt-1 gap-2">
            <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-slate-500 font-medium">
              {isPolling ? 'Live Polling Active (5s)' : 'Polling Paused'}
            </span>
            <button 
              onClick={() => setIsPolling(!isPolling)}
              className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-md transition-colors ${isPolling ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
            >
              {isPolling ? 'STOP' : 'START'}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:min-w-[300px]">
            <input 
              type="text" 
              placeholder="Search by ID or Customer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all text-sm" 
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => fetchOrders(true)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all"
              title="Refresh Data"
            >
              <RefreshCw size={18} />
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center space-x-2 px-4 py-2 border rounded-xl transition-all text-sm font-medium ${showFilters ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <Filter size={18} />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side Filters (Collapsible Overlay) - Fixed */}
      {showFilters && (
        <div className="flex-shrink-0 bg-white border border-slate-100 rounded-2xl shadow-xl p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 animate-in slide-in-from-top duration-200">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Channel</label>
            <select 
              value={sideFilters.channel}
              onChange={(e) => setSideFilters(prev => ({ ...prev, channel: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500/30 text-sm"
            >
              <option value="All">All Channels</option>
              {['Website', 'WhatsApp', 'In-Person', 'Amazon', 'Blinkit', 'Flipkart', 'Swiggy Instamart'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time Period</label>
            <select 
              value={sideFilters.dateRange}
              onChange={(e) => setSideFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500/30 text-sm"
            >
              <option value="All">Lifetime</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Value</label>
            <select 
              value={sideFilters.amountRange}
              onChange={(e) => setSideFilters(prev => ({ ...prev, amountRange: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500/30 text-sm"
            >
              <option value="All">Any Amount</option>
              <option value="<1000">Below ₹1,000</option>
              <option value="1000-5000">₹1,000 - ₹5,000</option>
              <option value=">5000">Above ₹5,000</option>
            </select>
          </div>
        </div>
      )}

      {/* Status Tabs - Fixed */}
      <div className="flex-shrink-0 flex space-x-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
        {['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
            <button 
                key={status} 
                onClick={() => setActiveTab(status)}
                className={`relative px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 group ${activeTab === status ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
                {status}
            </button>
        ))}
      </div>

      {/* Orders Table - Scrollable Container */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto scrollbar-thin">
          <table className="w-full text-left min-w-[1000px] border-collapse relative">
            <thead className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Date</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Channel</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Status</th>
                {canWrite && <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-500 font-medium">Fetching orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300"><Search size={40} /></div>
                      <span className="text-slate-500 font-medium">No matches found for your criteria</span>
                      <button onClick={() => { setSearchQuery(''); setSideFilters({ channel: 'All', dateRange: 'All', amountRange: 'All' }); setActiveTab('All'); }} className="text-yellow-600 text-sm font-bold hover:underline">Clear all filters</button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="group hover:bg-slate-50/80 transition-all duration-200">
                    <td className="px-6 py-4 align-middle relative">
                      <div className="flex flex-col max-w-[150px]">
                        <span className="font-bold text-slate-900 group-hover:text-yellow-600 transition-colors uppercase truncate" title={order.orderId}>
                          {order.orderId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{order.userId || 'Guest'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{order.items?.length || 0} {order.items?.length === 1 ? 'Product' : 'Products'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center align-middle">
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-700">{moment(order.createdAt).format('DD MMM YYYY')}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{moment(order.createdAt).format('hh:mm A')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center align-middle">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                          {order.channel}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-900">₹{order.revenue?.toLocaleString()}</span>
                        <span className="text-[10px] text-green-600 font-bold">Profit: ₹{Math.round(order.netProfit)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center align-middle relative">
                      {canWrite ? (
                        <>
                        <button 
                          onClick={() => setShowStatusMenu(showStatusMenu === order._id ? null : order._id)}
                          className={`group/status flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold border-2 transition-all ${getStatusColor(order.status)} hover:shadow-md`}
                        >
                            {order.status}
                            <ChevronDown size={14} className={`transition-transform duration-200 ${showStatusMenu === order._id ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Status Dropdown Menu */}
                        {showStatusMenu === order._id && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 py-2 p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                             <p className="text-[10px] font-bold text-slate-400 uppercase px-3 py-1 mb-1">Move Status to:</p>
                             {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                               <button 
                                 key={s}
                                 disabled={s === order.status}
                                 onClick={() => updateStatus(order._id, s)}
                                 className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${s === order.status ? 'bg-slate-50 text-slate-300' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
                               >
                                  <div className={`w-2 h-2 rounded-full ${getStatusColor(s).split(' ')[0]}`}></div>
                                  {s}
                               </button>
                             ))}
                          </div>
                        )}
                        </>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold border-2 ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      )}
                    </td>
                    {canWrite && (
                      <td className="px-6 py-4 text-center align-middle">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-yellow-50 rounded-xl transition-all"
                          >
                            <Eye size={20} />
                          </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal (Overlay) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="w-full sm:w-[500px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold uppercase tracking-wide">{selectedOrder.orderId}</h3>
                <span className="text-xs text-slate-400 font-mono">Date: {moment(selectedOrder.createdAt).format('MMMM D, YYYY hh:mm A')}</span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronDown className="rotate-90" size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Customer Info */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                  <User size={14} />
                  Customer Details
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg uppercase">
                    {selectedOrder.customer?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{selectedOrder.customer?.name || 'Unknown'}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                       {selectedOrder.customer?.email}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                       {selectedOrder.customer?.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 px-2">
                   <MapPin className="text-slate-400 mt-1" size={18} />
                   <p className="text-sm text-slate-600 leading-relaxed italic">
                     {selectedOrder.customer?.address || 'No address provided'}
                   </p>
                </div>
              </section>

              {/* Items List */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                  <Package size={14} />
                  Order Items ({selectedOrder.items?.length})
                </div>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-tighter">SKU: {item.sku}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-900">₹{item.price.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 font-bold">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Financial Breakdown */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                  <IndianRupee size={14} />
                  Financial Summary ({selectedOrder.channel})
                </div>
                <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between text-sm opacity-60">
                    <span>Revenue (Order Total)</span>
                    <span>₹{selectedOrder.revenue?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm opacity-60">
                    <span>Platform Commission</span>
                    <span className="text-red-400">- ₹{Math.round(selectedOrder.platformCommission)?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm opacity-60">
                    <span>Shipping Cost</span>
                    <span className="text-red-400">- ₹{selectedOrder.shippingCost?.toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-40">Net Profit</span>
                      <span className="text-2xl font-black text-green-400">₹{Math.round(selectedOrder.netProfit)?.toLocaleString()}</span>
                    </div>
                    <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase border border-white/10">
                      Calculated
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-slate-50 flex gap-3">
               <button 
                 onClick={() => setSelectedOrder(null)}
                 className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white transition-all shadow-sm"
               >
                 Close Details
               </button>
               <button 
                 className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
               >
                 <ExternalLink size={18} />
                 Print Invoice
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
