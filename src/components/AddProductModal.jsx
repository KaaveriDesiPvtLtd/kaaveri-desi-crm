import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Plus, Trash2 } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_PATH || '/api/crm';

export default function AddProductModal({ isOpen, onClose, onProductAdded, productToEdit }) {
  const initialFormState = {
    productId: '',
    name: '',
    category: '',
    badge: '',
    description: '',
    baseVariant: { label: '', quantity: '', unit: '', price: '' },
    currentStock: '',
    discountPercent: '',
    benefits: [''],
    variants: [{ label: '', value: '', unit: '', priceIncrement: '0' }],
    media: [] // Combined array for up to 5 items
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      // Collect existing media from the media array OR legacy fields
      let existingMedia = [];
      if (productToEdit.media?.length) {
        existingMedia = [...productToEdit.media];
      } else {
        // Backfill from legacy fields if media array is empty
        existingMedia = [
          productToEdit.image,
          productToEdit.image2,
          productToEdit.videoUrl
        ].filter(Boolean);
      }

      // Populate baseVariant from new field or fallback to legacy fields
      const bv = productToEdit.baseVariant || {};
      const baseVariant = {
        label: bv.label || (productToEdit.quantity && productToEdit.unit ? `${productToEdit.quantity} ${productToEdit.unit}` : ''),
        quantity: bv.quantity || productToEdit.quantity || '',
        unit: bv.unit || productToEdit.unit || '',
        price: bv.price || productToEdit.basePrice || '',
      };

      setFormData({
        productId: productToEdit.productId || '',
        name: productToEdit.name || '',
        category: productToEdit.category || '',
        badge: productToEdit.badge || '',
        description: productToEdit.description || '',
        baseVariant,
        currentStock: productToEdit.currentStock || '',
        discountPercent: productToEdit.discountPercent || '',
        benefits: productToEdit.benefits?.length ? productToEdit.benefits : [''],
        variants: productToEdit.variants?.length 
          ? productToEdit.variants.map(v => ({...v, unit: v.unit || '', priceIncrement: v.priceIncrement || 0})) 
          : [{ label: '', value: '', unit: '', priceIncrement: '0' }],
        media: existingMedia
      });
    } else {
      setFormData(initialFormState);
    }
  }, [productToEdit, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (formData.media.length >= 5) {
        setError('Maximum 5 media items allowed');
        return;
      }

      // 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        setError('File size too large. Max 10MB allowed.');
        return;
      }

      setIsProcessingMedia(true);
      setError('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, media: [...prev.media, reader.result] }));
        setIsProcessingMedia(false);
        // Reset input value to allow re-selecting the same file if removed
        e.target.value = '';
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setIsProcessingMedia(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = (index) => {
    const newMedia = formData.media.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, media: newMedia }));
  };

  const handleBenefitChange = (index, value) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({ ...formData, benefits: newBenefits });
  };

  const addBenefit = () => {
    setFormData({ ...formData, benefits: [...formData.benefits, ''] });
  };

  const removeBenefit = (index) => {
    const newBenefits = formData.benefits.filter((_, i) => i !== index);
    setFormData({ ...formData, benefits: newBenefits });
  };
  
  const getAvailableUnits = (mainUnit = formData.baseVariant.unit) => {
    if (mainUnit === 'kg' || mainUnit === 'gm') {
      return ['kg', 'gm'];
    } else if (mainUnit === 'ltr' || mainUnit === 'ml') {
      return ['ltr', 'ml'];
    }
    return ['kg', 'gm', 'ltr', 'ml']; // Fallback
  };

  const handleBaseVariantChange = (field, value) => {
    setFormData({ ...formData, baseVariant: { ...formData.baseVariant, [field]: value } });
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };

  const addVariant = () => {
    const availableUnits = getAvailableUnits();
    const defaultUnit = availableUnits[0] || '';
    setFormData({ ...formData, variants: [...formData.variants, { label: '', value: '', unit: defaultUnit, priceIncrement: '0' }] });
  };

  const removeVariant = (index) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const images = formData.media.filter(m => typeof m === 'string' && m.startsWith('data:image'));
      if (images.length < 2) {
        setError('At least 2 images are required for the product.');
        setLoading(false);
        return;
      }

      // Validate base variant
      if (!formData.baseVariant.label || !formData.baseVariant.quantity || !formData.baseVariant.price) {
        setError('Base variant label, quantity, and price are required.');
        setLoading(false);
        return;
      }

      // Filter out empty benefits and variants
      const cleanedData = {
        ...formData,
        baseVariant: {
          label: formData.baseVariant.label,
          quantity: Number(formData.baseVariant.quantity),
          unit: formData.baseVariant.unit || getAvailableUnits()[0] || '',
          price: Number(formData.baseVariant.price)
        },
        // Legacy fields for backward compat
        basePrice: String(formData.baseVariant.price),
        quantity: Number(formData.baseVariant.quantity),
        unit: formData.baseVariant.unit || getAvailableUnits()[0] || '',
        currentStock: Number(formData.currentStock) || 0,
        discountPercent: Number(formData.discountPercent) || 0,
        benefits: formData.benefits.filter(b => b.trim() !== ''),
        variants: formData.variants
          .filter(v => v.label && v.value)
          .map(v => ({
            label: v.label,
            value: Number(v.value),
            unit: v.unit || getAvailableUnits()[0] || '',
            priceIncrement: Number(v.priceIncrement) || 0
          }))
      };

      if (productToEdit) {
        await axios.put(`${API_BASE_URL}/products/${productToEdit._id}`, cleanedData);
      } else {
        await axios.post(`${API_BASE_URL}/products`, cleanedData);
      }
      
      onProductAdded(); // Refetch products
      onClose();
      // Reset form handled by useEffect
    } catch (err) {
      let errorMessage = `Failed to ${productToEdit ? 'update' : 'add'} product. `;
      
      if (err.response) {
        // Server-side validation or other errors
        const serverError = err.response.data.error || err.response.data.message;
        if (serverError) {
          errorMessage = serverError;
        } else {
          errorMessage += 'The server encountered an issue while processing your request.';
        }
      } else if (err.request) {
        // Network errors
        errorMessage = 'Network error: Please check your internet connection and try again.';
      } else {
        errorMessage += 'An unexpected error occurred.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full sm:max-w-2xl transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl transition-all max-h-screen sm:max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {productToEdit ? 'Edit Product' : 'Add New Product'}
                    </Dialog.Title>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {productToEdit && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Product ID</label>
                        <input type="text" value={formData.productId} disabled className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 shadow-sm text-sm border p-2 cursor-not-allowed" />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="text" name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2" placeholder="e.g., Ghee, Pickles" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description *</label>
                    <textarea required name="description" value={formData.description} onChange={handleChange} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Badge <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="text" name="badge" value={formData.badge} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2" placeholder="e.g., Best Seller" />
                  </div>

                  {/* Base Variant */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Variant *</label>
                    <div className="space-y-3 p-3 border-2 border-yellow-400 rounded-lg bg-yellow-50/30">
                      {/* Label - Full Width */}
                      <div>
                        <input
                          type="text"
                          value={formData.baseVariant.label}
                          onChange={(e) => handleBaseVariantChange('label', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2"
                          placeholder="Variant Label (e.g. 500 ml Pack, 1 kg Pack)"
                          required
                        />
                      </div>
                      
                      {/* Quantity, Unit, Price */}
                      <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                        <div className="flex-1 min-w-[120px]">
                          <input
                            type="number"
                            value={formData.baseVariant.quantity}
                            onChange={(e) => handleBaseVariantChange('quantity', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2"
                            placeholder="Quantity (500)"
                            required
                          />
                        </div>
                        
                        <select
                          value={formData.baseVariant.unit}
                          onChange={(e) => handleBaseVariantChange('unit', e.target.value)}
                          className="w-24 rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2 bg-white"
                        >
                          <option value="">Unit</option>
                          <option value="kg">kg</option>
                          <option value="ltr">ltr</option>
                          <option value="ml">ml</option>
                          <option value="gm">gm</option>
                        </select>

                        <div className="flex-1 min-w-[120px]">
                          <input
                            type="number"
                            value={formData.baseVariant.price}
                            onChange={(e) => handleBaseVariantChange('price', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2"
                            placeholder="Price ₹"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Stock & Discount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Current Stock <span className="text-[10px] text-slate-400 font-normal">(Read-only - Add via 📦 button)</span></label>
                      <input 
                        type="number" 
                        name="currentStock" 
                        value={formData.currentStock} 
                        readOnly 
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 shadow-sm text-sm border p-2 cursor-not-allowed" 
                        placeholder="0" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Discount (%) <span className="text-gray-400 font-normal">(0–100)</span></label>
                      <input type="number" name="discountPercent" value={formData.discountPercent} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2" placeholder="e.g., 20" min="0" max="100" />
                    </div>
                  </div>

                  {/* Media Grid */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Media (Photos/Videos - Max 5) *</label>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {/* Show existing media */}
                      {formData.media.map((item, index) => (
                        <div key={index} className="flex-shrink-0">
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                            {item.startsWith('data:video') || item.includes('.mp4') || item.includes('youtube') ? (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Video</span>
                              </div>
                            ) : (
                              <img src={item} alt={`Media ${index}`} className="w-full h-full object-cover" />
                            )}
                            <button
                              type="button"
                              onClick={() => removeMedia(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-sm z-10"
                              title="Remove media"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Show Plus Sign or Processing Loader */}
                      {formData.media.length < 5 && (
                        <div className="flex-shrink-0">
                          {isProcessingMedia ? (
                            <div className="flex flex-col items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50">
                              <div className="w-6 h-6 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mb-2" />
                              <span className="text-[10px] text-yellow-700 font-medium">Processing...</span>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-yellow-400 hover:bg-yellow-50 cursor-pointer transition-all">
                              <Plus className="text-gray-400" size={20} />
                              <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={(e) => handleFileChange(e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      )}

                      {/* Dummy slots to fill up to 5 if preferred, but usually cleaner to just show what's there + 1 */}
                    </div>
                  </div>


                  {/* Benefits */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Benefits <span className="text-gray-400 font-normal">(optional)</span></label>
                    {formData.benefits.map((benefit, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => handleBenefitChange(index, e.target.value)}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2"
                          placeholder="Enter benefit"
                        />
                        {formData.benefits.length > 1 && (
                          <button type="button" onClick={() => removeBenefit(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addBenefit} className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
                      <Plus size={16} /> Add Benefit
                    </button>
                  </div>

                  {/* Variants */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Variants <span className="text-gray-400 font-normal">(optional)</span></label>
                    {formData.variants.map((variant, index) => {
                      const availableUnits = getAvailableUnits();

                      return (
                        <div key={index} className="space-y-3 mb-4 p-3 border rounded-lg bg-gray-50/50 relative">
                          {/* Label - Full Width */}
                          <div>
                            <input
                              type="text"
                              value={variant.label}
                              onChange={(e) => handleVariantChange(index, 'label', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2"
                              placeholder="Variant Label (e.g. Family Pack, 500ml Pack)"
                            />
                          </div>
                          
                          {/* Other fields below */}
                          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                            <div className="flex-1 min-w-[120px]">
                              <input
                                type="number"
                                value={variant.value}
                                onChange={(e) => handleVariantChange(index, 'value', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2"
                                placeholder="Value (500)"
                              />
                            </div>
                            
                            <select
                              value={variant.unit}
                              onChange={(e) => handleVariantChange(index, 'unit', e.target.value)}
                              className="w-24 rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2 bg-white"
                            >
                              {availableUnits.map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>

                            <div className="flex-1 min-w-[140px]">
                              <input
                                type="number"
                                value={variant.priceIncrement}
                                onChange={(e) => handleVariantChange(index, 'priceIncrement', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm border p-2"
                                placeholder="Price +₹"
                              />
                            </div>

                            {formData.variants.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => removeVariant(index)} 
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Remove variant"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <button type="button" onClick={addVariant} className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
                      <Plus size={16} /> Add Variant
                    </button>
                  </div>

                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center rounded-md border border-transparent bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 w-full disabled:opacity-50"
                    >
                      {loading ? (productToEdit ? 'Updating...' : 'Adding...') : (productToEdit ? 'Update Product' : 'Add Product')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
