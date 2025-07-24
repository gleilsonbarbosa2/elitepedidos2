import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Package, BarChart3, Settings, Users, ArrowLeft, DollarSign, Bell, FileText, LogOut, User, Layers, ChevronUp, ChevronDown, Truck, ShoppingBag, MessageSquare, Search, Plus, Minus, Trash2, Scale, X, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { usePDVProducts, usePDVSales, usePDVCart } from '../../hooks/usePDV';
import { useScale } from '../../hooks/useScale';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useCashback } from '../../hooks/useCashback';
import { PDVProduct, PDVOperator, PDVCartItem, WeightReading } from '../../types/pdv';
import { PesagemModal } from './PesagemModal';

interface PDVSalesScreenProps {
  operator?: PDVOperator;
  scaleHook?: ReturnType<typeof useScale>;
  storeSettings?: any;
}

const PDVSalesScreen: React.FC<PDVSalesScreenProps> = ({ operator, scaleHook, storeSettings }) => {
  const { products, loading: productsLoading, searchProducts } = usePDVProducts();
  const { createSale, loading: salesLoading } = usePDVSales();
  const { isOpen: isCashRegisterOpen, currentRegister } = usePDVCashRegister();
  const { getRecommendations } = useRecommendations();
  const { getOrCreateCustomer, createPurchaseTransaction } = useCashback();
  
  const {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemWeight,
    applyItemDiscount,
    setDiscount,
    updatePaymentInfo,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    itemCount,
    totalItems,
    discount,
    paymentInfo
  } = usePDVCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedWeighableProduct, setSelectedWeighableProduct] = useState<PDVProduct | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'acai', label: 'Açaí' },
    { id: 'sorvetes', label: 'Sorvetes' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'complementos', label: 'Complementos' },
    { id: 'sobremesas', label: 'Sobremesas' },
    { id: 'outros', label: 'Outros' }
  ];

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

  const handleAddProduct = (product: PDVProduct) => {
    if (product.is_weighable) {
      setSelectedWeighableProduct(product);
      setShowWeightModal(true);
    } else {
      addItem(product, 1);
    }
  };

  const handleWeightConfirm = (weightInGrams: number) => {
    if (selectedWeighableProduct) {
      const weightInKg = weightInGrams / 1000;
      addItem(selectedWeighableProduct, 1, weightInKg);
    }
    setShowWeightModal(false);
    setSelectedWeighableProduct(null);
  };

  const handleFinalizeSale = () => {
    if (items.length === 0) {
      alert('Adicione produtos ao carrinho antes de finalizar a venda');
      return;
    }

    if (!isCashRegisterOpen) {
      alert('Não é possível finalizar vendas sem um caixa aberto');
      return;
    }

    setShowPaymentModal(true);
  };

  const handleConfirmSale = async () => {
    if (!paymentInfo.method) {
      alert('Selecione uma forma de pagamento');
      return;
    }

    setIsProcessingSale(true);

    try {
      // Preparar dados da venda
      const saleData = {
        operator_id: operator?.id,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        subtotal: getSubtotal(),
        discount_amount: getDiscountAmount(),
        discount_percentage: discount.type === 'percentage' ? discount.value : 0,
        total_amount: getTotal(),
        payment_type: paymentInfo.method,
        payment_details: paymentInfo.changeFor ? { change_for: paymentInfo.changeFor } : undefined,
        change_amount: paymentInfo.changeFor ? Math.max(0, paymentInfo.changeFor - getTotal()) : 0,
        notes: '',
        is_cancelled: false
      };

      // Preparar itens da venda
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

      // Criar venda
      const sale = await createSale(saleData, saleItems);

      // Processar cashback se cliente identificado
      if (customerPhone && customerPhone.length >= 11) {
        try {
          const customer = await getOrCreateCustomer(customerPhone, customerName);
          await createPurchaseTransaction(customer.id, getTotal(), sale.id);
        } catch (cashbackError) {
          console.warn('Erro ao processar cashback (venda salva):', cashbackError);
        }
      }

      // Limpar carrinho e fechar modal
      clearCart();
      setShowPaymentModal(false);
      setCustomerPhone('');
      setCustomerName('');

      alert(`Venda #${sale.sale_number} finalizada com sucesso!`);

    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda. Tente novamente.');
    } finally {
      setIsProcessingSale(false);
    }
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Carregando produtos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Calculator size={24} className="text-green-600" />
            Vendas PDV
          </h2>
          <p className="text-gray-600">Sistema de vendas presenciais</p>
        </div>
        
        {itemCount > 0 && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
            {totalItems} item(s) - {formatPrice(getTotal())}
          </div>
        )}
      </div>

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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="lg:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Produtos</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 cursor-pointer transition-colors"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package size={24} className="text-gray-400" />
                      )}
                    </div>
                    <h4 className="font-medium text-gray-800 text-sm mb-1">{product.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">{product.code}</p>
                    
                    {product.is_weighable ? (
                      <div className="flex items-center justify-center gap-1 text-green-600 font-semibold text-sm">
                        <Scale size={14} />
                        {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                      </div>
                    ) : (
                      <div className="font-semibold text-green-600 text-sm">
                        {formatPrice(product.unit_price || 0)}
                      </div>
                    )}
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
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingBag size={20} className="text-green-600" />
              Carrinho ({itemCount})
            </h3>

            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">Carrinho vazio</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-sm">{item.product.name}</h4>
                        <p className="text-xs text-gray-500">{item.product.code}</p>
                        {item.weight && (
                          <p className="text-xs text-blue-600">Peso: {(item.weight * 1000).toFixed(0)}g</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                          className="bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                          className="bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="font-semibold text-green-600 text-sm">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cart Summary */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatPrice(getSubtotal())}</span>
                </div>
                
                {getDiscountAmount() > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto:</span>
                    <span>-{formatPrice(getDiscountAmount())}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">{formatPrice(getTotal())}</span>
                </div>

                <div className="space-y-2 mt-4">
                  <button
                    onClick={handleFinalizeSale}
                    disabled={!isCashRegisterOpen || isProcessingSale}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    {!isCashRegisterOpen ? 'Caixa Fechado' : 'Finalizar Venda'}
                  </button>
                  
                  <button
                    onClick={clearCart}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Limpar Carrinho
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weight Modal */}
      {showWeightModal && selectedWeighableProduct && (
        <PesagemModal
          produto={selectedWeighableProduct}
          onConfirmar={handleWeightConfirm}
          onFechar={() => {
            setShowWeightModal(false);
            setSelectedWeighableProduct(null);
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Finalizar Venda</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">Dados do Cliente (Opcional)</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nome do cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="(85) 99999-9999"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para cashback automático
                  </p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">Forma de Pagamento</h3>
                
                <div className="space-y-2">
                  {[
                    { value: 'dinheiro', label: 'Dinheiro' },
                    { value: 'pix', label: 'PIX' },
                    { value: 'cartao_credito', label: 'Cartão de Crédito' },
                    { value: 'cartao_debito', label: 'Cartão de Débito' },
                    { value: 'voucher', label: 'Voucher' }
                  ].map(method => (
                    <label key={method.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={paymentInfo.method === method.value}
                        onChange={(e) => updatePaymentInfo({ method: e.target.value as any })}
                        className="text-green-600"
                      />
                      <span>{method.label}</span>
                    </label>
                  ))}
                </div>

                {paymentInfo.method === 'dinheiro' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Troco para quanto?
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentInfo.changeFor || ''}
                      onChange={(e) => updatePaymentInfo({ changeFor: parseFloat(e.target.value) || undefined })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Valor para troco"
                    />
                  </div>
                )}
              </div>

              {/* Sale Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Resumo da Venda</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(getSubtotal())}</span>
                  </div>
                  {getDiscountAmount() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span>-{formatPrice(getDiscountAmount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-1">
                    <span>Total:</span>
                    <span className="text-green-600">{formatPrice(getTotal())}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSale}
                disabled={isProcessingSale || !paymentInfo.method}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isProcessingSale ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  'Confirmar Venda'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDVSalesScreen;