import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Store2Product {
  id: string;
  code: string;
  name: string;
  category: 'acai' | 'bebidas' | 'complementos' | 'sobremesas' | 'outros' | 'sorvetes';
  is_weighable: boolean;
  unit_price?: number;
  price_per_gram?: number;
  image_url?: string;
  stock_quantity: number;
  min_stock: number;
  is_active: boolean;
  barcode?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useStore2Products = () => {
  const [products, setProducts] = useState<Store2Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando produtos da Loja 2...');
      
      const { data, error } = await supabase
        .from('store2_products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
      console.log(`✅ ${data?.length || 0} produtos da Loja 2 carregados`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      console.error('❌ Erro ao carregar produtos da Loja 2:', errorMessage);
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (product: Omit<Store2Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('🚀 Criando produto na Loja 2:', product);
      
      const { data, error } = await supabase
        .from('store2_products')
        .insert([product])
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prev => [...prev, data]);
      console.log('✅ Produto da Loja 2 criado:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao criar produto da Loja 2:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar produto');
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Store2Product>) => {
    try {
      console.log('✏️ Atualizando produto da Loja 2:', id, updates);
      
      const { data, error } = await supabase
        .from('store2_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prev => prev.map(p => p.id === id ? data : p));
      console.log('✅ Produto da Loja 2 atualizado:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao atualizar produto da Loja 2:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar produto');
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Excluindo produto da Loja 2:', id);
      
      const { error } = await supabase
        .from('store2_products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
      console.log('✅ Produto da Loja 2 excluído');
    } catch (err) {
      console.error('❌ Erro ao excluir produto da Loja 2:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir produto');
    }
  }, []);

  const searchProducts = useCallback((query: string) => {
    if (!query.trim()) return products;
    
    const searchTerm = query.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.code.toLowerCase().includes(searchTerm) ||
      product.barcode?.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  }, [products]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    refetch: fetchProducts
  };
};