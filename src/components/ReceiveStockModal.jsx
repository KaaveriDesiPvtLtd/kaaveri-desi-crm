import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Package, Calendar, Hash, IndianRupee } from 'lucide-react'
import axios from 'axios'

export default function ReceiveStockModal({ isOpen, onClose, product, onStockReceived }) {
  const [formData, setFormData] = useState({
    batchCode: '',
    manufacturedDate: '',
    expiryDate: '',
    purchasePricePerUnit: '',
    quantity: '',
    unit: '',
    reason: 'Stock received'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setFormData({
        batchCode: `BATCH-${Date.now()}`,
        manufacturedDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        purchasePricePerUnit: product?.costPrice || 0,
        quantity: '',
        unit: product?.unit || 'ml',
        reason: 'Stock received'
      })
      setError('')
    }
  }, [isOpen, product])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await axios.post('/api/crm/stock/receive', {
        productId: product._id,
        batchData: {
          batchCode: formData.batchCode,
          manufacturedDate: formData.manufacturedDate,
          expiryDate: formData.expiryDate || null,
          purchasePricePerUnit: Number(formData.purchasePricePerUnit),
          unit: formData.unit,
          reason: formData.reason
        },
        quantity: Number(formData.quantity),
        performedBy: 'Admin' // Should ideally come from auth context
      })

      onStockReceived()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to receive stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                        <Package size={24} />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-xl font-bold text-slate-900 leading-6">
                          Receive Stock
                        </Dialog.Title>
                        <p className="text-sm text-slate-500">{product?.name}</p>
                      </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
                      <X size={24} />
                    </button>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-2">
                       <X className="w-4 h-4" />
                       {error}
                    </div>
                  )}

                  <form id="receive-stock-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Batch Code *</label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            required
                            type="text"
                            name="batchCode"
                            value={formData.batchCode}
                            onChange={handleChange}
                            className="pl-10 block w-full rounded-xl border-slate-200 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2.5 transition-all"
                            placeholder="BATCH-001"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity *</label>
                        <input
                          required
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2.5 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <Calendar size={14} className="text-slate-400" />
                          Mfg. Date
                        </label>
                        <input
                          type="date"
                          name="manufacturedDate"
                          value={formData.manufacturedDate}
                          onChange={handleChange}
                          className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2.5 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <Calendar size={14} className="text-slate-400" />
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleChange}
                          className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2.5 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <IndianRupee size={14} className="text-slate-400" />
                          Purchase Price (per unit)
                        </label>
                        <input
                          type="number"
                          name="purchasePricePerUnit"
                          value={formData.purchasePricePerUnit}
                          onChange={handleChange}
                          className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2.5 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Unit *</label>
                        <select
                          name="unit"
                          value={formData.unit}
                          onChange={handleChange}
                          className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2.5 transition-all bg-white"
                        >
                          <option value="ml">ml</option>
                          <option value="ltr">ltr</option>
                          <option value="kg">kg</option>
                          <option value="gm">gm</option>
                          <option value="units">units</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Reason / Note</label>
                      <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        rows={2}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2.5 transition-all"
                        placeholder="e.g., New stock arrival"
                      />
                    </div>
                  </form>
                </div>

                <div className="bg-slate-50 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
                  <button
                    type="submit"
                    form="receive-stock-form"
                    disabled={loading}
                    className="inline-flex w-full justify-center rounded-xl bg-yellow-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-yellow-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all sm:w-auto"
                  >
                    {loading ? 'Processing...' : 'Receive Stock'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
