import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit3, Trash2, Save, X, Search, Eye, EyeOff, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useDeliveryProducts, DeliveryProduct } from '../../hooks/useDeliveryProducts';
import { useProductScheduling } from '../../hooks/useProductScheduling';
import ProductScheduleModal from './ProductScheduleModal';
import ImageUploadModal from './ImageUploadModal';
import { useImageUpload } from '../../hooks/useImageUpload';

const ProductsPanel: React.FC = () => {
  const { products, loading, error, createProduct, updateProduct, deleteProduct, searchProducts } = useDeliveryProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<DeliveryProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedProductForSchedule, setSelectedProductForSchedule] = useState<DeliveryProduct | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  const { saveProductSchedule, getProductSchedule } = useProductScheduling();
  const { getProductImage, saveImageToProduct } = useImageUpload();

  const categories = [
    { id: 'all', label: 'Todas as Categorias' },
    { id: 'acai', label: 'Açaí' },
    { id: 'combo', label: 'Combos' },
    { id: 'milkshake', label: 'Milkshakes' },
    { id: 'vitamina', label: 'Vitaminas' },
    { id: 'sorvetes', label: 'Sorvetes' }
  ];

  // Carregar imagens dos produtos
  useEffect(() => {
    const loadProductImages = async () => {
      const images: Record<string, string> = {};
      
      for (const product of products) {
        try {
          const savedImage = await getProductImage(product.id);
          if (savedImage) {
            images[product.id] = savedImage;
          }
        } catch (err) {
          console.warn(`Erro ao carregar imagem do produto ${product.name}:`, err);
        }
      }
      
      setProductImages(images);
    };

    if (products.length > 0) {
      loadProductImages();
    }
  }, [products, getProductImage]);

  const filteredProducts = React.useMemo(() => {
    let result = searchTerm ? searchProducts(searchTerm) : products;
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    return result;
  }, [products, searchProducts, searchTerm, selectedCategory]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleCreate = () => {
    const newProduct: DeliveryProduct = {
      id: '',
      name: '',
      category: 'acai',
      price: 0,
      original_price: undefined,
      description: '',
      image_url: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
      is_active: true,
      is_weighable: false,
      price_per_gram: undefined,
      created_at: '',
      updated_at: ''
    };
    
    setEditingProduct(newProduct);
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    if (!editingProduct.name.trim() || !editingProduct.description.trim()) {
      alert('Nome e descrição são obrigatórios');
      return;
    }

    if (editingProduct.price <= 0) {
      alert('Preço deve ser maior que zero');
      return;
    }

    if (editingProduct.is_weighable && (!editingProduct.price_per_gram || editingProduct.price_per_gram <= 0)) {
      alert('Preço por grama é obrigatório para produtos pesáveis');
      return;
    }

    setSaving(true);
    
    try {
      console.log('💾 Salvando produto no banco:', editingProduct);
      
      if (isCreating) {
        // Criar novo produto no banco
        const { id, created_at, updated_at, ...productData } = editingProduct;
        const newProduct = await createProduct(productData);
        
        // Salvar imagem se houver uma personalizada
        if (editingProduct.image_url && !editingProduct.image_url.includes('pexels.com')) {
          try {
            const savedImageUrl = await saveImageToProduct(editingProduct.image_url, newProduct.id);
            if (savedImageUrl) {
              setProductImages(prev => ({
                ...prev,
                [newProduct.id]: savedImageUrl
              }));
              console.log('✅ Imagem salva no banco:', savedImageUrl);
            }
          } catch (imageError) {
            console.warn('⚠️ Erro ao salvar imagem (produto salvo):', imageError);
          }
        }
        
        console.log('✅ Produto criado no banco:', newProduct.name);
      } else {
        // Atualizar produto existente no banco
        const { created_at, updated_at, ...productData } = editingProduct;
        await updateProduct(editingProduct.id, productData);
        
        // Salvar imagem se houver uma personalizada
        if (editingProduct.image_url && !editingProduct.image_url.includes('pexels.com')) {
          try {
            const savedImageUrl = await saveImageToProduct(editingProduct.image_url, editingProduct.id);
            if (savedImageUrl) {
              setProductImages(prev => ({
                ...prev,
                [editingProduct.id]: savedImageUrl
              }));
              console.log('✅ Imagem salva no banco:', savedImageUrl);
            }
          } catch (imageError) {
            console.warn('⚠️ Erro ao salvar imagem (produto salvo):', imageError);
          }
        }
        
        console.log('✅ Produto atualizado no banco:', editingProduct.name);
      }

      // Mostrar mensagem de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Produto ${isCreating ? 'criado' : 'atualizado'} no banco de dados!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);

      setEditingProduct(null);
      setIsCreating(false);
      
    } catch (err: any) {
      console.error('❌ Erro ao salvar produto:', err);
      alert(`Erro ao salvar produto: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: DeliveryProduct) => {
    if (confirm(`Tem certeza que deseja excluir "${product.name}"?`)) {
      try {
        await deleteProduct(product.id);
        
        // Mostrar mensagem de sucesso
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
        successMessage.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          Produto excluído do banco de dados!
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
    } catch (err: any) {
      console.error('Erro ao salvar programação:', err);
        alert('Erro ao excluir produto. Tente novamente.');
      }
    }
  };

  const handleToggleActive = async (product: DeliveryProduct) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      
      // Mostrar mensagem de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Status do produto alterado no banco!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      alert('Erro ao alterar status. Tente novamente.');
    }
  };

  const handleScheduleProduct = (product: DeliveryProduct) => {
    setSelectedProductForSchedule(product);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (productId: string, scheduledDays: any) => {
    try {
      await saveProductSchedule(productId, scheduledDays);
      setShowScheduleModal(false);
      setSelectedProductForSchedule(null);
      
      // Mostrar mensagem de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Programação salva no banco de dados!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao salvar programação:', err);
      alert('Erro ao salvar programação. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Carregando produtos do banco...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Package size={24} className="text-purple-600" />
            Gerenciar Produtos
          </h2>
          <p className="text-gray-600">Configure produtos, preços e disponibilidade</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {/* Database Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Package size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">✅ Salvamento no Banco de Dados Ativo</p>
            <ul className="list-disc list-inside space-y-1 text-green-700">
              <li><strong>Produtos são salvos permanentemente</strong> no banco de dados Supabase</li>
              <li><strong>Programações de dias</strong> são salvas no banco de dados</li>
              <li><strong>Imagens personalizadas</strong> são salvas no banco de dados</li>
              <li><strong>Sincronização automática</strong> entre todos os dispositivos</li>
              <li>Todas as alterações são <strong>persistentes e permanentes</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">Erro ao carregar produtos</p>
              <p>Verifique a conexão com o banco de dados</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="lg:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="relative">
              <img
                src={productImages[product.id] || product.image_url || 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              
              {!product.is_active && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    Inativo
                  </span>
                </div>
              )}
              
              {product.original_price && product.original_price > product.price && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  PROMOÇÃO
                </div>
              )}

              {product.is_weighable && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  PESÁVEL
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 text-gray-800">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  {product.original_price && product.original_price > product.price ? (
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 font-bold text-lg">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-gray-500 line-through text-sm">
                        {formatPrice(product.original_price)}
                      </span>
                    </div>
                  ) : product.is_weighable && product.price_per_gram ? (
                    <div className="text-purple-600 font-bold text-lg">
                      {formatPrice(product.price_per_gram * 1000)}/kg
                    </div>
                  ) : (
                    <span className="text-purple-600 font-bold text-lg">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
                
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  product.category === 'acai' ? 'bg-purple-100 text-purple-800' :
                  product.category === 'combo' ? 'bg-blue-100 text-blue-800' :
                  product.category === 'milkshake' ? 'bg-green-100 text-green-800' :
                  product.category === 'vitamina' ? 'bg-orange-100 text-orange-800' :
                  product.category === 'sorvetes' ? 'bg-pink-100 text-pink-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {categories.find(c => c.id === product.category)?.label || product.category}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 size={16} />
                  Editar
                </button>
                
                <button
                  onClick={() => handleToggleActive(product)}
                  className={`p-2 rounded-lg transition-colors ${
                    product.is_active
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                  title={product.is_active ? 'Desativar produto' : 'Ativar produto'}
                >
                  {product.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                
                <button
                  onClick={() => handleScheduleProduct(product)}
                  className="p-2 bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-lg transition-colors"
                  title="Programar dias"
                >
                  📅
                </button>
                
                <button
                  onClick={() => handleDelete(product)}
                  className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                  title="Excluir produto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Nenhum produto encontrado' 
              : 'Nenhum produto disponível'
            }
          </p>
        </div>
      )}

      {/* Edit/Create Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {isCreating ? 'Novo Produto' : 'Editar Produto'}
                </h2>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsCreating(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem do Produto
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={productImages[editingProduct.id] || editingProduct.image_url || 'https://via.placeholder.com/100?text=Sem+Imagem'}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    onClick={() => setShowImageUpload(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <ImageIcon size={16} />
                    Alterar Imagem
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    name: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Açaí Premium 500g"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    category: e.target.value as DeliveryProduct['category']
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categories.filter(cat => cat.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Weighable */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_weighable}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      is_weighable: e.target.checked,
                      price_per_gram: e.target.checked ? (editingProduct.price_per_gram || 0.045) : undefined
                    })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Produto pesável (vendido por peso)
                  </span>
                </label>
              </div>

              {/* Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingProduct.is_weighable ? 'Preço por Grama (R$) *' : 'Preço Atual (R$) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.is_weighable ? editingProduct.price_per_gram || '' : editingProduct.price}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (editingProduct.is_weighable) {
                        setEditingProduct({
                          ...editingProduct,
                          price_per_gram: value,
                          price: value * 1000 // Preço por kg para exibição
                        });
                      } else {
                        setEditingProduct({
                          ...editingProduct,
                          price: value
                        });
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                  {editingProduct.is_weighable && editingProduct.price_per_gram && (
                    <p className="text-xs text-gray-500 mt-1">
                      Preço por kg: {formatPrice(editingProduct.price_per_gram * 1000)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Original (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.original_price || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      original_price: parseFloat(e.target.value) || undefined
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00 (opcional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para produtos em promoção
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    description: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Descrição do produto..."
                />
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active !== false}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      is_active: e.target.checked
                    })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Produto ativo (visível no cardápio)
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingProduct.name.trim() || !editingProduct.description.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando no Banco...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isCreating ? 'Criar no Banco' : 'Salvar no Banco'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Schedule Modal */}
      {showScheduleModal && selectedProductForSchedule && (
        <ProductScheduleModal
          product={{
            id: selectedProductForSchedule.id,
            name: selectedProductForSchedule.name,
            category: selectedProductForSchedule.category,
            price: selectedProductForSchedule.price,
            description: selectedProductForSchedule.description,
            image: selectedProductForSchedule.image_url || '',
            originalPrice: selectedProductForSchedule.original_price
          }}
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedProductForSchedule(null);
          }}
          onSave={handleSaveSchedule}
          currentSchedule={getProductSchedule(selectedProductForSchedule.id)}
        />
      )}

      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUploadModal
          isOpen={showImageUpload}
          onClose={() => setShowImageUpload(false)}
          onSelectImage={(imageUrl) => {
            if (editingProduct) {
              setEditingProduct({
                ...editingProduct,
                image_url: imageUrl
              });
              
              // Atualizar preview local
              setProductImages(prev => ({
                ...prev,
                [editingProduct.id]: imageUrl
              }));
            }
            setShowImageUpload(false);
          }}
          currentImage={productImages[editingProduct?.id || ''] || editingProduct?.image_url}
        />
      )}
    </div>
  );
};

export default ProductsPanel;