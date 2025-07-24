import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { PDVCashRegister, PDVCashRegisterSummary, PDVCashRegisterEntry } from '../../types/pdv';

interface Store2CashRegisterPrintViewProps {
  register: PDVCashRegister;
  summary: PDVCashRegisterSummary;
  entries: PDVCashRegisterEntry[];
  onClose: () => void;
}

const Store2CashRegisterPrintView: React.FC<Store2CashRegisterPrintViewProps> = ({
  register,
  summary,
  entries,
  onClose
}) => {
  const [printerSettings, setPrinterSettings] = useState({
    paper_width: '80mm',
    page_size: 300,
    font_size: 14,
    scale: 1,
    margin_left: 0,
    margin_top: 1,
    margin_bottom: 1
  });

  // Carregar configurações de impressora do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('store2_printer_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setPrinterSettings(settings);
      } catch (e) {
        console.error('Erro ao carregar configurações de impressora da Loja 2:', e);
      }
    }
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    return labels[method] || method;
  };

  const handlePrint = () => {
    window.print();
  };

  const printerStyle = `
    @media print {
      @page {
        size: A4 portrait;
        margin: 0 !important;
        padding: 0 !important;
      }

      html, body {
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        font-family: 'Courier New', monospace !important;
        font-size: 14px !important;
        line-height: 1.3 !important;
        overflow: visible !important;
        background: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        min-height: 100vh !important;
        zoom: 1 !important;
        transform: none !important;
      }

      #print-container {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
        min-height: 100vh !important;
        display: block !important;
        position: static !important;
      }

      * {
        color: black !important;
        box-sizing: border-box !important;
        background: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        max-width: none !important;
        max-height: none !important;
      }

      .print\\:hidden, button, .no-print, .fixed {
        display: none !important;
      }

      .thermal-receipt {
        padding: 2mm !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        border: none !important;
        overflow: visible !important;
        page-break-inside: auto !important;
      }

      .thermal-receipt .mb-1 { margin-bottom: 1mm !important; }
      .thermal-receipt .mb-2 { margin-bottom: 2mm !important; }
      .thermal-receipt .mb-3 { margin-bottom: 3mm !important; }

      .thermal-receipt .pb-2 { padding-bottom: 2mm !important; }
      .thermal-receipt .pt-2 { padding-top: 2mm !important; }

      .thermal-receipt .text-xs { font-size: 12px !important; }
      .thermal-receipt .text-sm { font-size: 13px !important; }

      .thermal-receipt .space-y-1 > * + * { margin-top: 1mm !important; }

      .thermal-receipt .border-b { border-bottom: 1px solid black !important; }
      .thermal-receipt .border-t { border-top: 1px solid black !important; }
      .thermal-receipt .border-dashed { border-style: dashed !important; }

      img {
        max-width: 100% !important;
        height: auto !important;
        page-break-inside: avoid !important;
      }

      /* Ensure content is visible */
      .bg-white {
        background: white !important;
      }
      
      .rounded-lg, .rounded-xl {
        border-radius: 0 !important;
      }
      
      .shadow-sm, .shadow-md, .shadow-lg {
        box-shadow: none !important;
      }
      
      /* Force visibility of all content */
      .thermal-receipt, .thermal-receipt * {
        visibility: visible !important;
        display: block !important;
      }
      
      .thermal-receipt .flex {
        display: flex !important;
      }
      
      .thermal-receipt .text-center {
        text-align: center !important;
      }
    }

    .thermal-receipt {
      font-family: 'Courier New', monospace !important;
      background: white;
    }
  `;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:static print:bg-white print:p-0">
      <div className="bg-white rounded-lg max-w-sm w-full max-h-[90vh] overflow-hidden print:max-w-full print:w-full print:max-h-none print:overflow-visible print:rounded-none">
        {/* Controles de impressão - não aparecem na impressão */}
        <div className="p-4 border-b border-gray-200 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Impressão Térmica - Movimentações do Caixa - Loja 2
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                title="Imprimir usando as configurações definidas"
              >
                Imprimir
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <p>• Configure a impressora para "Térmico Direto"</p>
            <p>• Largura do papel: 80mm (79,5mm ± 0,5mm)</p>
            <p>• Use papel térmico de qualidade</p>
          </div>
        </div>

        {/* Conteúdo para impressão térmica */}
        <div className="thermal-receipt overflow-y-auto max-h-[calc(90vh-120px)] print:overflow-visible print:max-h-none">
          <div className="p-2 print:p-0">
            {/* Cabeçalho */}
            <div className="text-center mb-3 pb-2 border-b border-dashed border-gray-400">
              <div className="mb-2">
                <h1 className="text-lg font-bold">ELITE AÇAÍ - LOJA 2</h1>
                <p className="text-xs">Relatório de Caixa</p>
              </div>
              
              <div className="text-xs space-y-1">
                <p>Rua Dois, 2130-A</p>
                <p>Residencial 1 - Cágado</p>
                <p>Tel: (85) 98904-1010</p>
                <p>WhatsApp: (85) 98904-1010</p>
              </div>
            </div>

            {/* Informações do Caixa */}
            <div className="mb-3 text-xs">
              <div className="text-center font-bold mb-2">
                === MOVIMENTAÇÕES DO CAIXA - LOJA 2 ===
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Caixa:</span>
                  <span>#{register.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Abertura:</span>
                  <span>{formatDate(register.opened_at)}</span>
                </div>
                {register.closed_at && (
                  <div className="flex justify-between">
                    <span>Fechamento:</span>
                    <span>{formatDate(register.closed_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="mb-3 pb-2 border-b border-dashed border-gray-400">
              <div className="font-bold text-xs mb-1">RESUMO FINANCEIRO - LOJA 2:</div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Valor de Abertura:</span>
                  <span>{formatPrice(register.opening_amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vendas Loja 2:</span>
                  <span>{formatPrice(summary?.sales_total || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outras Entradas:</span>
                  <span>{formatPrice(summary?.other_income_total || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Saídas:</span>
                  <span>{formatPrice(summary?.total_expense || 0)}</span>
                </div>
                <div className="pt-2 border-t border-gray-300">
                  <div className="flex justify-between font-bold">
                    <span>SALDO ESPERADO:</span>
                    <span>{formatPrice(summary?.expected_balance || 0)}</span>
                  </div>
                </div>
                {register.closing_amount !== null && (
                  <>
                    <div className="flex justify-between">
                      <span>Valor de Fechamento:</span>
                      <span>{formatPrice(register.closing_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diferença:</span>
                      <span className="font-bold">
                        {(() => {
                          const difference = (register.closing_amount || 0) - (summary?.expected_balance || 0);
                          return formatPrice(difference);
                        })()}
                        <span className="ml-1 text-xs">
                          {(() => {
                            const difference = (register.closing_amount || 0) - (summary?.expected_balance || 0);
                            return difference < 0 ? '(falta)' : difference > 0 ? '(sobra)' : '(exato)';
                          })()}
                        </span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Movimentações Detalhadas */}
            <div className="mb-3">
              <div className="font-bold text-xs mb-2">MOVIMENTAÇÕES DETALHADAS - LOJA 2:</div>
              
              {entries.length === 0 ? (
                <div className="text-xs text-center py-2">
                  Nenhuma movimentação registrada
                </div>
              ) : (
                entries.map((entry, index) => (
                  <div key={entry.id} className="mb-2 pb-2 border-b border-dotted border-gray-300">
                    <div className="text-xs">
                      <div className="flex justify-between font-medium mb-1">
                        <span>{index + 1}. {entry.type === 'income' ? 'ENTRADA' : 'SAÍDA'}</span>
                        <span className={entry.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {entry.type === 'income' ? '+' : '-'}{formatPrice(entry.amount)}
                        </span>
                      </div>
                      
                      <div className="ml-2">
                        <div>Descrição: {entry.description}</div>
                        <div>Forma: {getPaymentMethodLabel(entry.payment_method)}</div>
                        <div>Data: {formatDate(entry.created_at)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totais por Forma de Pagamento */}
            <div className="mb-3 pb-2 border-b border-dashed border-gray-400">
              <div className="font-bold text-xs mb-1">POR FORMA DE PAGAMENTO - LOJA 2:</div>
              <div className="text-xs space-y-1">
                {['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'].map(method => {
                  const methodEntries = entries.filter(e => e.payment_method === method);
                  const income = methodEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
                  const expense = methodEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
                  const total = income - expense;
                  
                  if (total !== 0) {
                    return (
                      <div key={method} className="flex justify-between">
                        <span>{getPaymentMethodLabel(method)}:</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Rodapé */}
            <div className="text-center text-xs border-t border-dashed border-gray-400 pt-2">
              <div className="mb-2">
                <div className="font-bold">RELATÓRIO DE CAIXA - LOJA 2</div>
                <div>Elite Açaí - Sistema PDV</div>
              </div>
              
              <div className="space-y-1">
                <div>Operador: {register.operator_id || 'Sistema'}</div>
                <div>Impresso: {new Date().toLocaleString('pt-BR')}</div>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                <div>Elite Açaí - Loja 2</div>
                <div>Rua Dois, 2130-A – Residencial 1 – Cágado</div>
                <div>CNPJ: 00.000.000/0001-00</div>
                <div>Este é um relatório interno</div>
                <div>Não é um documento fiscal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Estilos específicos para impressão térmica */}
      <style jsx>{printerStyle}</style>
    </div>
  );
};

export default Store2CashRegisterPrintView;