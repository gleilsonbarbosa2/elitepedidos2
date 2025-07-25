import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useStoreHours } from '../../hooks/useStoreHours';

interface StoreHour {
  id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

const DAYS = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

const StoreHoursPanel: React.FC = () => {
  const { hours, loading, updateHours } = useStoreHours();
  const [localHours, setLocalHours] = useState<StoreHour[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (hours) {
      setLocalHours(hours);
    }
  }, [hours]);

  const handleToggleDay = (dayIndex: number) => {
    setLocalHours(prev => prev.map(hour => 
      hour.day_of_week === dayIndex 
        ? { ...hour, is_open: !hour.is_open }
        : hour
    ));
  };

  const handleTimeChange = (dayIndex: number, field: 'open_time' | 'close_time', value: string) => {
    setLocalHours(prev => prev.map(hour => 
      hour.day_of_week === dayIndex 
        ? { ...hour, [field]: value }
        : hour
    ));
  };

  const handleSaveHours = async () => {
    console.log('🔄 Iniciando salvamento dos horários...');
    console.log('📊 Dados a serem salvos:', localHours);
    
    setSaving(true);
    setMessage(null);
    
    try {
      // Verificar se há mudanças
      const hasChanges = JSON.stringify(hours) !== JSON.stringify(localHours);
      console.log('🔍 Há mudanças para salvar?', hasChanges);
      
      if (!hasChanges) {
        setMessage({ type: 'success', text: 'Nenhuma alteração detectada.' });
        setSaving(false);
        return;
      }

      console.log('💾 Enviando dados para o banco...');
      await updateHours(localHours);
      
      console.log('✅ Dados salvos com sucesso no banco de dados!');
      setMessage({ 
        type: 'success', 
        text: 'Horários salvos com sucesso no banco de dados!' 
      });
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Erro ao salvar horários:', error);
      setMessage({ 
        type: 'error', 
        text: `Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique o console para mais detalhes.` 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando horários...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Horários de Funcionamento</h2>
      </div>

      {/* Informações importantes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Informações Importantes:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Os horários são salvos automaticamente no banco de dados Supabase</li>
              <li>As alterações são sincronizadas em tempo real</li>
              <li>Verifique o console do navegador (F12) para logs detalhados</li>
              <li>Os horários afetam a disponibilidade da loja para pedidos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="space-y-4">
        {localHours.map((hour) => (
          <div key={hour.day_of_week} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hour.is_open}
                    onChange={() => handleToggleDay(hour.day_of_week)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">
                    {DAYS[hour.day_of_week]}
                  </span>
                </label>
              </div>
              
              {hour.is_open && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Abertura:</label>
                    <input
                      type="time"
                      value={hour.open_time}
                      onChange={(e) => handleTimeChange(hour.day_of_week, 'open_time', e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Fechamento:</label>
                    <input
                      type="time"
                      value={hour.close_time}
                      onChange={(e) => handleTimeChange(hour.day_of_week, 'close_time', e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
              
              {!hour.is_open && (
                <span className="text-sm text-gray-500 italic">Fechado</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveHours}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Horários'}
        </button>
      </div>
    </div>
  );
};

export default StoreHoursPanel;