import React, { useState } from 'react';
import '../../index.css';
import { Calculator, ShoppingCart, Printer, AlertCircle, Package, Scale, Plus, Minus, Trash2, Search, Percent, CreditCard, Split, DollarSign } from 'lucide-react';
import { PDVOperator } from '../../types/pdv';
import { useStore2PDVCashRegister } from '../../hooks/useStore2PDVCashRegister';
import { useStore2Products } from '../../hooks/useStore2Products';
import { useStore2Sales, useStore2Cart } from '../../hooks/useStore2Sales';
import { useScale } from '../../hooks/useScale';
import { PesagemModal } from '../PDV/PesagemModal';
import { useImageUpload } from '../../hooks/useImageUpload';

interface Store2PDVSalesScreenProps {
  operator?: PDVOperator;
  scaleHook?: ReturnType<typeof useScale>;
}

const Store2PDVSalesScreen: React.FC<Store2PDVSalesScreenProps> = ({ operator, scaleHook }) => {
  const { isOpen: isCashRegisterOpen, currentRegister, summary } = useStore2PDVCashRegister();
  const { products, loading: productsLoading, searchProducts } = useStore2Products();
  const { createSale, loading: salesLoading } = useStore2Sales();
  const { 
    items, 
    addItem, 
    removeItem, 
    updateItemQuantity, 
    updateItemWeight,
    clearCart,
    getSubtotal,
    getTotal,
    discount,
    setDiscount
  } = useStore2Cart();
  
  const scale = scaleHook || useScale();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showPesagemModal, setShowPesagemModal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const { getProductImage } = useImageUpload();
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  const categories = [
    { id: 'all', label: 'Todos', icon: '🛍️' },
    { id: 'acai', label: 'Açaí', icon: '🍇' },
    { id: 'sorvetes', label: 'Sorvetes', icon: '🍦' },
    { id: 'bebidas', label: 'Bebidas', icon: '🥤' },
    { id: 'complementos', label: 'Gelatos', icon: '🍨' },
    { id: 'sobremesas', label: 'Cremes', icon: '🍮' },
    { id: 'outros', label: 'Massas', icon: '🧁' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const filteredProducts = React.useMemo(() => {
    let result = searchTerm ? searchProducts(searchTerm) : products;
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    return result.filter(p => p.is_active);
  }, [products, searchProducts, searchTerm, selectedCategory]);

  // Carregar imagens dos produtos
  React.useEffect(() => {
    const loadProductImages = async () => {
      const images: Record<string, string> = {};
      
      for (const product of filteredProducts) {
        try {
          const savedImage = await getProductImage(product.id);
          if (savedImage) {
            images[product.id] = savedImage;
          }
        } catch (error) {
          console.warn(`Erro ao carregar imagem do produto ${product.name}:`, error);
        }
      }
      
      setProductImages(images);
    };

    loadProductImages();
  }, [filteredProducts, getProductImage]);

  const handleAddProduct = (product: any, quantity: number = 1) => {
    if (product.is_weighable) {
      setSelectedProduct(product);
      setShowPesagemModal(true);
    } else {
      addItem(product, quantity);
    }
  };

  const handleWeightConfirm = (weightGrams: number) => {
    if (selectedProduct) {
      const weightKg = weightGrams / 1000;
      addItem(selectedProduct, 1, weightKg);
      setSelectedProduct(null);
      setShowPesagemModal(false);
    }
  };

  const handleFinalizeSale = async () => {
    if (items.length === 0) {
      alert('Adicione produtos ao carrinho');
      return;
    }

    try {
      const discountAmount = discount.type === 'amount' ? discount.value : 
                           discount.type === 'percentage' ? (getSubtotal() * discount.value / 100) : 0;

      const saleData = {
        operator_id: operator?.id,
        customer_name: 'Cliente Loja 2',
        customer_phone: '',
        subtotal: getSubtotal(),
        discount_amount: discountAmount,
        discount_percentage: discount.type === 'percentage' ? discount.value : 0,
        total_amount: getTotal(),
        payment_type: 'dinheiro' as const,
        payment_details: {},
        change_amount: 0,
        notes: 'Venda Loja 2',
        is_cancelled: false,
        channel: 'loja2'
      };

      const saleItems = items.map(item => ({
        product_id: item.product.id,
        product_code: item.product.code,
        product_name: item.product.name,
        quantity: item.quantity,
        weight_kg: item.weight,
        unit_price: item.product.unit_price,
        price_per_gram: item.product.price_per_gram,
        discount_amount: item.discount,
        subtotal: item.subtotal
      }));

      const sale = await createSale(saleData, saleItems, currentRegister?.id);
      setLastSale(sale);
      clearCart();
      
      // Auto print for Store 2
      setTimeout(() => {
        handlePrintOrder();
      }, 500);
      
      // Show elegant success notification
      showSuccessNotification();
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      showErrorNotification('Erro ao finalizar venda');
    }
  };

  const showSuccessNotification = () => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 transform transition-all duration-500 ease-out translate-x-full';
    notification.innerHTML = `
      <div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl border border-green-400 max-w-sm">
        <div class="flex items-center gap-3">
          <div class="bg-white/20 rounded-full p-2 backdrop-blur-sm">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-lg">✅ Venda Realizada!</h3>
            <p class="text-green-100 text-sm">Pedido processado com sucesso</p>
          </div>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-white/80 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="mt-3 flex items-center gap-2 text-green-100 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H9.5a2 2 0 01-2-2V5a2 2 0 00-2-2H4"></path>
          </svg>
          <span>Imprimindo automaticamente...</span>
        </div>
        <div class="absolute top-0 left-0 w-full h-1 bg-white/30 rounded-t-xl">
          <div class="h-full bg-white rounded-t-xl animate-pulse"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.className = notification.className.replace('translate-x-full', 'translate-x-0');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.className = notification.className.replace('translate-x-0', 'translate-x-full');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 500);
    }, 5000);
  };

  const showErrorNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 transform transition-all duration-500 ease-out translate-x-full';
    notification.innerHTML = `
      <div class="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl shadow-2xl border border-red-400 max-w-sm">
        <div class="flex items-center gap-3">
          <div class="bg-white/20 rounded-full p-2 backdrop-blur-sm">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-lg">❌ Erro na Venda</h3>
            <p class="text-red-100 text-sm">${message}</p>
          </div>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-white/80 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="mt-3 flex items-center gap-2 text-red-100 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Tente novamente ou contate o suporte</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.className = notification.className.replace('translate-x-full', 'translate-x-0');
    }, 100);
    
    // Auto remove after 7 seconds (longer for errors)
    setTimeout(() => {
      notification.className = notification.className.replace('translate-x-0', 'translate-x-full');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 500);
    }, 7000);
  };

  const getItemPrice = (item: any) => {
    if (item.product.is_weighable && item.weight) {
      return item.weight * 1000 * (item.product.price_per_gram || 0);
    }
    return (item.product.unit_price || 0) * item.quantity;
  };

  const handlePrintOrder = () => {
    // Simular impressão de pedido para Loja 2
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Pedido Loja 2</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; color: black !important; background: white !important; }
          body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; padding: 2mm; width: 76mm; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .separator { border-bottom: 1px dashed black; margin: 5px 0; padding-bottom: 5px; }
          .flex-between { display: flex; justify-content: space-between; align-items: center; }
        </style>
      </head>
      <body>
        <div class="center separator">
          <div class="bold" style="font-size: 16px;">ELITE AÇAÍ - LOJA 2</div>
          <div>Rua Dois, 2130-A – Residencial 1 – Cágado</div>
          <div>Tel: (85) 98904-1010</div>
        </div>
        
        <div class="center separator">
          <div class="bold">=== PEDIDO LOJA 2 ===</div>
          <div>Data: ${new Date().toLocaleDateString('pt-BR')}</div>
          <div>Hora: ${new Date().toLocaleTimeString('pt-BR')}</div>
          <div>Operador: ${operator?.name || 'Sistema'}</div>
        </div>
        
        ${items.length > 0 ? `
        <div class="separator">
          <div class="bold">ITENS:</div>
          ${items.map((item, index) => `
            <div>
              <div class="bold">${item.product.name}</div>
              <div class="flex-between">
                <span>${item.quantity}x ${formatPrice(item.product.unit_price || 0)}</span>
                <span>${formatPrice(getItemPrice(item))}</span>
              </div>
              ${item.weight ? `<div>Peso: ${(item.weight * 1000).toFixed(0)}g</div>` : ''}
            </div>
          `).join('')}
          <div class="flex-between bold separator">
            <span>TOTAL:</span>
            <span>${formatPrice(getTotal())}</span>
          </div>
        </div>` : ''}
        
        <div class="center">
          <div class="bold">Obrigado pela preferência!</div>
          <div>Elite Açaí - Loja 2</div>
          <div>Impresso: ${new Date().toLocaleString('pt-BR')}</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  const getDiscountAmount = () => {
    if (discount.type === 'percentage') {
      return getSubtotal() * (discount.value / 100);
    } else if (discount.type === 'amount') {
      return Math.min(discount.value, getSubtotal());
    }
    return 0;
  };

  if (!isCashRegisterOpen) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <AlertCircle size={48} className="mx-auto text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          Caixa da Loja 2 Fechado
        </h3>
        <p className="text-gray-500 mb-4">
          Abra um caixa na aba "Caixas" para começar a realizar vendas.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header com busca */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Calculator size={24} className="text-blue-600" />
            Vendas - Loja 2
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Vendas: {summary.sales_count}</span>
            <span>Faturamento: {formatPrice(summary.sales_total)}</span>
          </div>
        </div>
        
        {/* Barra de busca */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produtos por nome ou código..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Área principal de produtos */}
        <div className="flex-1 flex flex-col">
          {/* Categorias */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de produtos */}
          <div className="flex-1 p-4 overflow-y-auto">
            {productsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Nenhum produto encontrado</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group">
                    {/* Imagem do produto */}
                    <div className="relative h-32 bg-gradient-to-br from-blue-50 to-purple-50">
                      {productImages[product.id] || product.image_url ? (
                        <img 
                          src={productImages[product.id] || product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={32} className="text-gray-400" />
                        </div>
                      )}
                      
                      {/* Badge de estoque baixo */}
                      {product.stock_quantity <= product.min_stock && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          Estoque baixo
                        </div>
                      )}
                      
                      {/* Badge de produto pesável */}
                      {product.is_weighable && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full">
                          <Scale size={12} />
                        </div>
                      )}
                    </div>

                    {/* Informações do produto */}
                    <div className="p-3">
                      <h3 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>
                      
                      <div className="text-xs text-gray-500 mb-2">
                        {product.code}
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-lg font-bold text-green-600">
                          {product.is_weighable 
                            ? `${formatPrice((product.price_per_gram || 0) * 1000)}/kg`
                            : formatPrice(product.unit_price || 0)
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          Estoque: {product.stock_quantity}
                        </div>
                      </div>

                      {/* Botão de ação */}
                      <button
                        onClick={() => handleAddProduct(product)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {product.is_weighable ? (
                          <>
                            <Scale size={14} />
                            Pesar
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            Adicionar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carrinho lateral */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Header do carrinho */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={20} />
                Carrinho ({items.length})
              </h3>
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Limpar carrinho"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Itens do carrinho */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <ShoppingCart size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">Carrinho vazio</p>
                  <p className="text-xs text-gray-400 mt-1">Adicione produtos para começar</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {items.map(item => (
                  <div key={`${item.product.id}-${Date.now()}`} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {productImages[item.product.id] || item.product.image_url ? (
                          <img 
                            src={productImages[item.product.id] || item.product.image_url} 
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={20} className="text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-800 text-sm truncate">{item.product.name}</h4>
                            <p className="text-xs text-gray-500">{item.product.code}</p>
                          </div>
                          
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-red-500 hover:text-red-700 p-1 ml-2 flex-shrink-0"
                            title="Remover item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        {/* Controles de quantidade/peso */}
                        {item.product.is_weighable && item.weight ? (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Peso:</span>
                              <span className="font-medium">{(item.weight * 1000).toFixed(0)}g</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateItemWeight(item.product.id, Math.max(0.1, item.weight - 0.1))}
                                className="bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition-colors"
                              >
                                <Minus size={10} />
                              </button>
                              <div className="flex-1 text-center text-xs">
                                {(item.weight * 1000).toFixed(0)}g
                              </div>
                              <button
                                onClick={() => updateItemWeight(item.product.id, item.weight + 0.1)}
                                className="bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition-colors"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                                className="bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition-colors"
                              >
                                <Minus size={10} />
                              </button>
                              <div className="flex-1 text-center text-sm font-medium">
                                {item.quantity}
                              </div>
                              <button
                                onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                                className="bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition-colors"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-2 text-right">
                          <span className="text-sm font-bold text-green-600">
                            {formatPrice(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer do carrinho */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-4">
              {/* Resumo */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatPrice(getSubtotal())}</span>
                </div>
                
                {discount.type !== 'none' && discount.value > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Desconto:</span>
                    <span className="font-medium text-red-600">-{formatPrice(getDiscountAmount())}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-green-600">{formatPrice(getTotal())}</span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDiscount(prev => ({ 
                    type: prev.type === 'percentage' ? 'none' : 'percentage', 
                    value: prev.type === 'percentage' ? 0 : 10 
                  }))}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    discount.type === 'percentage'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  <Percent size={16} />
                  Desconto
                </button>
                
                <button
                  onClick={handlePrintOrder}
                  className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  <Printer size={16} />
                  Imprimir
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  <DollarSign size={16} />
                  Pagamento
                </button>
                
                <button
                  className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  <Split size={16} />
                  Dividir
                </button>
              </div>

              <button
                onClick={handleFinalizeSale}
                disabled={items.length === 0 || salesLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                {salesLoading ? 'Processando...' : 'Finalizar Venda'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de desconto */}
      {discount.type === 'percentage' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Aplicar Desconto</h3>
              <button
                onClick={() => setDiscount({ type: 'none', value: 0 })}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Desconto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDiscount({ type: 'percentage', value: discount.value })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      discount.type === 'percentage'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Percentual (%)
                  </button>
                  <button
                    onClick={() => setDiscount({ type: 'amount', value: 0 })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      discount.type === 'amount'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Valor (R$)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {discount.type === 'percentage' ? 'Percentual de Desconto' : 'Valor do Desconto'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={discount.type === 'percentage' ? '1' : '0.01'}
                    min="0"
                    max={discount.type === 'percentage' ? '100' : getSubtotal()}
                    value={discount.value}
                    onChange={(e) => setDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {discount.type === 'percentage' ? '%' : 'R$'}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatPrice(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Desconto:</span>
                  <span className="text-red-600">-{formatPrice(getDiscountAmount())}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-blue-200 mt-2">
                  <span>Total:</span>
                  <span className="text-green-600">{formatPrice(getTotal())}</span>
                </div>
              </div>

              <button
                onClick={() => setDiscount({ type: 'none', value: 0 })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Aplicar Desconto
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de pesagem */}
      {showPesagemModal && selectedProduct && (
        <PesagemModal
          produto={selectedProduct}
          onConfirmar={handleWeightConfirm}
          onFechar={() => {
            setShowPesagemModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default Store2PDVSalesScreen;