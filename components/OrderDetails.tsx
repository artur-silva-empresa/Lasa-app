
import React from 'react';
import { X, User, ShoppingBag, Palette, Ruler, CheckCircle, Package, MessageSquare, Save, FileText as FileIcon, Trash2, Lock, Flag, Hand, AlertCircle } from 'lucide-react';
import { Order, Sector, SectorState, User as UserType } from '../types';
import { getSectorState } from '../services/dataService';
import { formatDate } from '../utils/formatters';
import { SECTORS, STATUS_COLORS } from '../constants';
import StopReasonSelector from './StopReasonSelector';

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onUpdateOrder: (updatedOrder: Order) => void;
  user: UserType | null; // Adicionado user prop
  stopReasonsHierarchy: any[];
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onClose, onUpdateOrder, user, stopReasonsHierarchy }) => {
  const [editingSector, setEditingSector] = React.useState<Sector | null>(null);
  const [obsText, setObsText] = React.useState('');
  const [stopReason, setStopReason] = React.useState('');

  const canEdit = user?.role === 'admin';

  const handleSectorClick = (sector: Sector) => {
    setEditingSector(sector);
    setObsText(order.sectorObservations?.[sector.id] || '');
    setStopReason(order.sectorStopReasons?.[sector.id] || '');
  };

  const handleSaveObservation = () => {
    if (!editingSector || !canEdit) return;
    const updatedObservations = { ...(order.sectorObservations || {}), [editingSector.id]: obsText };
    const updatedStopReasons = { ...(order.sectorStopReasons || {}), [editingSector.id]: stopReason };
    onUpdateOrder({ 
      ...order, 
      sectorObservations: updatedObservations,
      sectorStopReasons: updatedStopReasons
    });
    setEditingSector(null);
  };
  
  const getSectorProducedQty = (sectorId: string): number => {
      switch (sectorId) {
        case 'tecelagem': return order.felpoCruQty;
        case 'felpo_cru': return order.felpoCruQty;
        case 'tinturaria': return order.tinturariaQty;
        case 'confeccao': return order.confRoupoesQty + order.confFelposQty;
        case 'embalagem': return order.embAcabQty;
        case 'expedicao': return order.stockCxQty;
        default: return 0;
      }
  };

  const getSectorDate = (sectorId: string): Date | null => {
    switch (sectorId) {
      case 'tecelagem': return order.dataTec;
      case 'felpo_cru': return order.felpoCruDate;
      case 'tinturaria': return order.tinturariaDate;
      case 'confeccao': return order.confDate;
      case 'embalagem': return order.armExpDate;
      case 'expedicao': return order.armExpDate;
      default: return null;
    }
  };

  const getPriorityInfo = (p: number) => {
      switch(p) {
          case 1: return { label: 'Prioridade Alta', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' };
          case 2: return { label: 'Prioridade Média', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' };
          case 3: return { label: 'Prioridade Baixa', className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' };
          default: return null;
      }
  };

  const priorityInfo = order.priority ? getPriorityInfo(order.priority) : null;
  
  const missingQty = Math.max(0, order.qtyRequested - order.stockCxQty);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 md:p-4 overscroll-none"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-950 w-full max-w-[95vw] lg:max-w-6xl xl:max-w-7xl h-[95vh] rounded-2xl md:rounded-3xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="space-y-1 w-full max-w-[90%]">
            
            {/* Linha 1: Cliente (Destaque Principal) + Nr Documento (Centrado Verticalmente) */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <User size={18} className="shrink-0" />
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-tight leading-none">
                        {order.clientName}
                    </h2>
                </div>
                <span className="text-sm md:text-base font-bold text-slate-400 dark:text-slate-500 pt-0.5">
                    {order.docNr}
                </span>
            </div>

            {/* Linha 2: Detalhes Artigo + Badges */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm md:text-base font-bold text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-x-2">
                    {order.reference} <span className="text-slate-300 dark:text-slate-600">•</span> {order.colorDesc} <span className="text-slate-300 dark:text-slate-600">•</span> {order.sizeDesc || order.size}
                </span>

                <div className="flex items-center gap-2">
                    {/* Priority Badge */}
                    {priorityInfo && (
                        <div className={`px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${priorityInfo.className}`}>
                            <Flag size={10} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-wide">{priorityInfo.label}</span>
                        </div>
                    )}

                    {/* Manual Confection Badge */}
                    {order.isManual && (
                        <div className="px-2 py-0.5 rounded-md border bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 flex items-center gap-1.5">
                            <Hand size={10} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-wide">Conf. Manual</span>
                        </div>
                    )}
                </div>
            </div>

          </div>
          <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 transition-all shadow-sm shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-slate-950">
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
            {/* Progress Tracker */}
            <section>
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">Fluxo de Produção</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-y-3 gap-x-2">
                {SECTORS.map((s) => {
                  const sectorState = getSectorState(order, s.id);
                  const producedQty = getSectorProducedQty(s.id);
                  const hasObs = order.sectorObservations?.[s.id];
                  const SectorIcon = s.icon;
                  
                  return (
                    <button 
                      key={s.id} 
                      onClick={() => handleSectorClick(s)}
                      className="flex flex-col items-center gap-1.5 group transition-all"
                    >
                      {/* Ícone Reduzido */}
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm relative transition-all group-active:scale-90 ${STATUS_COLORS[sectorState as keyof typeof STATUS_COLORS]} hover:brightness-110`}>
                        <SectorIcon size={18} className="text-white" />
                        {sectorState === SectorState.COMPLETED && (
                          <div className="absolute -top-1.5 -right-1.5 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm">
                            <CheckCircle size={14} className="text-emerald-500" />
                          </div>
                        )}
                        {hasObs && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white dark:border-slate-800 rounded-full"></div>}
                      </div>
                      
                      <div className={`px-1.5 py-0.5 rounded-md min-w-[50px] text-center border ${producedQty >= order.qtyRequested && order.qtyRequested > 0 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800'}`}>
                        <span className={`text-[10px] md:text-xs leading-none ${producedQty >= order.qtyRequested && order.qtyRequested > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          <span className="font-medium opacity-60">{order.qtyRequested.toLocaleString('pt-PT')} / </span>
                          <span className="font-black">{producedQty.toLocaleString('pt-PT')}</span>
                        </span>
                      </div>

                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase text-center leading-tight truncate w-full">
                        {s.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {editingSector && (
                <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-3 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col gap-1">
                        <h4 className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase flex items-center gap-2"><MessageSquare size={12}/> Notas: {editingSector.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1"><AlertCircle size={10}/> Classificação:</span>
                            <StopReasonSelector 
                                currentReason={stopReason} 
                                onSelect={setStopReason} 
                                hierarchy={stopReasonsHierarchy}
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {canEdit ? (
                        <button 
                            onClick={() => setObsText('')} 
                            className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                            title="Limpar texto"
                        >
                            <Trash2 size={14} />
                        </button>
                      ) : (
                        <span className="text-slate-400" title="Apenas leitura">
                            <Lock size={12} />
                        </span>
                      )}
                      <button onClick={() => setEditingSector(null)} className="text-blue-400 hover:text-blue-600 p-1 transition-colors"><X size={14}/></button>
                    </div>
                  </div>
                  <textarea
                    value={obsText}
                    onChange={(e) => setObsText(e.target.value)}
                    placeholder={canEdit ? "Escrever nota..." : "Sem observações registadas."}
                    readOnly={!canEdit}
                    className={`w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl p-2 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none ${!canEdit ? 'opacity-70 cursor-not-allowed bg-slate-50 dark:bg-slate-800' : ''}`}
                    autoFocus={canEdit}
                  />
                  {canEdit && (
                    <button onClick={handleSaveObservation} className="w-full mt-2 bg-blue-600 text-white py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                        <Save size={14} /> Guardar
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Info Grid - Reorganizado: 2 colunas */}
            <section className="grid grid-cols-2 gap-3">
              <InfoCard icon={<FileIcon size={14} />} label="PO" value={order.po} />
              <InfoCard icon={<ShoppingBag size={14} />} label="Referência" value={order.reference} subValue={order.colorDesc} />
              <InfoCard icon={<Palette size={14} />} label="Artigo" value={order.articleCode} />
              <InfoCard icon={<Ruler size={14} />} label="Medida / Tamanho" value={order.sizeDesc || order.size} />
            </section>

            {/* Qty & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
              <section className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-4 text-white shadow-xl flex flex-col justify-center border border-slate-800 dark:border-slate-700">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Qtd em Falta</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl lg:text-4xl font-black">{missingQty.toLocaleString('pt-PT')}</span>
                  <span className="text-[10px] font-bold text-slate-500 pb-1.5 uppercase">UNI</span>
                </div>
                <div className="w-full bg-slate-800 dark:bg-slate-700 h-1.5 rounded-full mt-3 mb-2 overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${order.qtyRequested > 0 ? (order.stockCxQty / order.qtyRequested) * 100 : 0}%` }}
                    ></div>
                </div>
                <p className="text-[9px] font-bold text-slate-500 text-right">TOTAL PEDIDO: {order.qtyRequested.toLocaleString('pt-PT')}</p>
              </section>

              <section className="space-y-2 h-full flex flex-col justify-center">
                <DateRow label="Data Entrega" date={order.requestedDate} highlight />
                <DateRow label="Emissão" date={order.issueDate} />
                <DateRow label="Armazém Exp." date={order.armExpDate} />
              </section>
            </div>
          </main>
          
          {/* Observations Sidebar */}
          <aside className="w-full lg:w-96 xl:w-[450px] lg:shrink-0 bg-slate-50 dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
            <div className="p-4 md:p-6 space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">Histórico de Observações</h3>
              {SECTORS.map(sector => {
                const obs = order.sectorObservations?.[sector.id];
                const reason = order.sectorStopReasons?.[sector.id];
                const SectorIcon = sector.icon;
                const sectorDate = getSectorDate(sector.id);
                return (
                  <button 
                    key={sector.id} 
                    onClick={() => handleSectorClick(sector)}
                    className="w-full text-left text-xs bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors p-2 rounded-lg group cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                          <SectorIcon size={14} className="text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div className="flex flex-col">
                            <h4 className="font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{sector.name}</h4>
                            {reason && (
                                <span className="text-[10px] font-black text-rose-500 flex items-center gap-1 mt-0.5">
                                    <AlertCircle size={10} /> {reason}
                                </span>
                            )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {sectorDate && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 pr-1">Data Sector: {formatDate(sectorDate)}</span>}
                        {order.sectorPredictedDates?.[sector.id] && (
                            <span className="text-[10px] font-bold text-rose-500 pr-1">Data Prevista: {formatDate(order.sectorPredictedDates[sector.id])}</span>
                        )}
                      </div>
                    </div>
                    <p className={`mt-2 pl-3 text-sm whitespace-pre-wrap break-words ${obs ? 'text-slate-700 dark:text-slate-300 border-l-2 border-slate-200 dark:border-slate-700' : 'text-slate-400 dark:text-slate-600 italic'}`}>
                      {obs || (canEdit ? 'Sem observações (Clique para editar)' : 'Sem observações')}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, label, value, subValue }: any) => (
  <div className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-full flex flex-col">
    <div className="text-blue-500 dark:text-blue-400 mb-1.5">{icon}</div>
    <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 break-words leading-tight">{value}</p>
    {subValue && <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-auto pt-1.5 font-bold uppercase">{subValue}</p>}
  </div>
);

const DateRow = ({ label, date, highlight }: any) => (
  <div className={`flex justify-between items-center px-4 py-2.5 rounded-xl border ${highlight ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/50' : 'bg-slate-50 border-slate-100 dark:bg-slate-900 dark:border-slate-800'}`}>
    <span className={`text-[9px] font-black uppercase ${highlight ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{label}</span>
    <span className={`text-xs font-black ${highlight ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>{formatDate(date)}</span>
  </div>
);

export default OrderDetails;
