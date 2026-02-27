import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('settings', 'write');
  const [settings, setSettings] = useState({
    commissionRates: {
      amazon: 25,
      blinkit: 28,
      flipkart: 22,
      swiggy: 30,
      website: 2
    },
    shipping: {
      defaultCost: 100,
      freeShippingThreshold: 1000
    },
    inventory: {
      lowStockThreshold: 10
    }
  });

  const handleChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 border-b pb-2">Commission Rates (%)</h3>
          <div className="space-y-4">
            {Object.entries(settings.commissionRates).map(([platform, rate]) => (
              <div key={platform} className="flex justify-between items-center">
                <label className="capitalize text-slate-600 text-sm sm:text-base">{platform}</label>
                <div className="flex items-center">
                    <input 
                        type="number" 
                        value={rate} 
                        onChange={(e) => handleChange('commissionRates', platform, parseInt(e.target.value))}
                        disabled={!canWrite}
                        className="w-16 sm:w-20 px-2 sm:px-3 py-1 border rounded-lg text-right text-sm sm:text-base disabled:bg-slate-50 disabled:text-slate-400" 
                    />
                    <span className="ml-2 text-slate-400 text-sm">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 border-b pb-2">Inventory Alerts</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-slate-600 text-sm sm:text-base">Low Stock Threshold</label>
                <div className="flex items-center">
                    <input 
                        type="number" 
                        value={settings.inventory.lowStockThreshold} 
                        onChange={(e) => handleChange('inventory', 'lowStockThreshold', parseInt(e.target.value))}
                        disabled={!canWrite}
                        className="w-16 sm:w-20 px-2 sm:px-3 py-1 border rounded-lg text-right text-sm sm:text-base disabled:bg-slate-50 disabled:text-slate-400" 
                    />
                    <span className="ml-2 text-slate-400 text-sm">units</span>
                </div>
              </div>
           </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 border-b pb-2">Shipping Configuration</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-slate-600 text-sm sm:text-base">Default Shipping Cost</label>
                <div className="flex items-center">
                    <span className="mr-2 text-slate-400 text-sm">₹</span>
                    <input 
                        type="number" 
                        value={settings.shipping.defaultCost} 
                        onChange={(e) => handleChange('shipping', 'defaultCost', parseInt(e.target.value))}
                        disabled={!canWrite}
                        className="w-16 sm:w-20 px-2 sm:px-3 py-1 border rounded-lg text-right text-sm sm:text-base disabled:bg-slate-50 disabled:text-slate-400" 
                    />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-slate-600 text-sm sm:text-base">Free Shipping Above</label>
                <div className="flex items-center">
                    <span className="mr-2 text-slate-400 text-sm">₹</span>
                    <input 
                        type="number" 
                        value={settings.shipping.freeShippingThreshold} 
                        onChange={(e) => handleChange('shipping', 'freeShippingThreshold', parseInt(e.target.value))}
                        disabled={!canWrite}
                        className="w-16 sm:w-20 px-2 sm:px-3 py-1 border rounded-lg text-right text-sm sm:text-base disabled:bg-slate-50 disabled:text-slate-400" 
                    />
                </div>
              </div>
           </div>
        </div>
      </div>

      {canWrite && (
        <div className="flex justify-end">
          <button className="w-full sm:w-auto bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
              Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;
