import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, ChevronDown, ChevronRight, Package } from 'lucide-react';
import AddProductModal from '../components/AddProductModal';
import ReceiveStockModal from '../components/ReceiveStockModal';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_PATH || '/api/crm';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('inventory', 'write');
  const canStock = hasPermission('inventory', 'stock');

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API_BASE_URL}/products`);
      const productsArray = Array.isArray(data) ? data : [];
      setProducts(productsArray);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch products');
      setLoading(false);
      console.error('Error fetching products:', err);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`);
      fetchProducts();
      alert("Product deleted successfully");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete product");
    }
  };

  const [editingProduct, setEditingProduct] = useState(null);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleReceiveStock = (product) => {
    setSelectedProductForStock(product);
    setIsReceiveModalOpen(true);
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const colCount = 7 + (canWrite ? 1 : 0) + (canStock ? 1 : 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Inventory Management</h1>
        {canWrite && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-2 py-4 w-8"></th>
                <th className="px-4 py-4 font-semibold text-slate-600 text-center">Product ID</th>
                <th className="px-4 py-4 font-semibold text-slate-600 text-center">Name</th>
                <th className="px-4 py-4 font-semibold text-slate-600 text-center">Category</th>
                <th className="px-4 py-4 font-semibold text-slate-600 text-center">Base Price</th>
                <th className="px-4 py-4 font-semibold text-slate-600 text-center">Badge</th>
                <th className="px-4 py-4 font-semibold text-slate-600 text-center">Current Stock</th>
                {canStock && <th className="px-4 py-4 font-semibold text-slate-600 text-center">Inventory Control</th>}
                {canWrite && <th className="px-4 py-4 font-semibold text-slate-600 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={colCount} className="text-center py-8">Loading inventory...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={colCount} className="text-center py-8">No products found. Add one to get started.</td></tr>
              ) : (
                products.map((product) => {
                  const isExpanded = !!expandedRows[product._id];
                  const bv = product.baseVariant;
                  const variants = product.variants || [];
                  const hasVariants = bv || variants.length > 0;

                  return (
                    <React.Fragment key={product._id}>
                      {/* Main product row */}
                      <tr
                        className={`transition-colors cursor-pointer select-none ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                        onClick={() => hasVariants && toggleRow(product._id)}
                      >
                        <td className="px-2 py-4 text-center">
                          {hasVariants ? (
                            <span className="text-slate-400 hover:text-slate-600">
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </span>
                          ) : (
                            <span className="inline-block w-4" />
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm font-mono text-slate-500 text-center">{product.productId}</td>
                        <td className="px-4 py-4 font-medium text-slate-800 text-center">
                          {product.name}
                          {(product.quantity !== undefined || product.unit) && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              {product.quantity || 0} {product.unit || ''}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-slate-600 text-center">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                            {product.category || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center font-medium text-slate-800">₹{product.baseVariant?.price || product.basePrice}</td>
                        <td className="px-4 py-4 text-center">
                          {product.badge ? (
                            <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs font-semibold">
                              {product.badge}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`font-bold text-sm ${product.currentStock <= 5 ? 'text-red-600 bg-red-50 px-2 py-1 rounded-md' : 'text-slate-700'}`}>
                            {product.currentStock || 0}
                            <span className="ml-1 text-[10px] text-slate-400 font-normal uppercase">{product.unit || 'units'}</span>
                          </span>
                        </td>
                        {canStock && (
                          <td className="px-4 py-4 text-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleReceiveStock(product); }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-xs font-bold transition-all border border-yellow-100" 
                              title="Receive Stock"
                            >
                              <Package size={14} />
                              <span>Add Stock</span>
                            </button>
                          </td>
                        )}
                        {canWrite && (
                          <td className="px-4 py-4 text-center">
                            <div className="flex justify-center space-x-2" onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={() => handleEdit(product)}
                                className="p-1.5 hover:bg-gray-100 rounded text-slate-500 hover:text-blue-600 flex items-center gap-1" 
                                title="Edit"
                              >
                                <Edit size={18} />
                                <span className="text-[10px] font-bold sm:hidden">Edit</span>
                              </button>
                              <button 
                                onClick={() => handleDelete(product._id)}
                                className="p-1.5 hover:bg-red-50 rounded text-slate-500 hover:text-red-500 flex items-center gap-1" 
                                title="Delete"
                              >
                                <Trash2 size={18} />
                                <span className="text-[10px] font-bold sm:hidden">Delete</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Expanded variant details sub-row */}
                      {isExpanded && hasVariants && (
                        <tr className="bg-slate-50/60 border-t-0">
                          <td colSpan={colCount} className="px-6 py-4">
                            <div className="ml-6 space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Variant Details</p>
                                <div className="text-xs font-medium text-slate-400">Total Stock: <span className="text-slate-700 font-bold">{product.currentStock}</span></div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {/* Base Variant Card */}
                                {bv && (
                                  <div className="flex items-center gap-3 bg-white border border-yellow-200 rounded-lg px-4 py-3 shadow-sm">
                                    <div className="flex-shrink-0 w-1.5 h-10 bg-yellow-400 rounded-full" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-slate-800 truncate">{bv.label}</span>
                                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase">Base</span>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span>{bv.quantity} {bv.unit}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="font-semibold text-slate-700">₹{bv.price}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Additional Variant Cards */}
                                {variants.map((v, idx) => (
                                  <div key={idx} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
                                    <div className="flex-shrink-0 w-1.5 h-10 bg-purple-400 rounded-full" />
                                    <div className="flex-1 min-w-0">
                                      <span className="font-semibold text-sm text-slate-800 truncate block">{v.label}</span>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span>{v.value} {v.unit || ''}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="font-semibold text-slate-700">+₹{v.priceIncrement || 0}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddProductModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        onProductAdded={fetchProducts} 
        productToEdit={editingProduct}
      />

      <ReceiveStockModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        product={selectedProductForStock}
        onStockReceived={fetchProducts}
      />
    </div>
  );
};

export default Inventory;
