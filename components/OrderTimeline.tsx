
import React from 'react';
import { Order, OrderState, SectorState } from '../types';
import { SECTORS, STATUS_COLORS } from '../constants';
import { getSectorState, getOrderState } from '../services/dataService';
import { formatDate } from '../utils/formatters';
import { 
  Search, 
  ListFilter, 
  RotateCcw, 
  FileText, 
  Users, 
  Tag,
  ChevronLeft,
  ChevronRight,
  Flag
} from 'lucide-react';

interface OrderTimelineProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
}

const ITEMS_PER_PAGE = 50;

const OrderTimeline: React.FC<OrderTimelineProps> = ({ orders, onViewDetails }) => {
  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = React.useState('');
  const deferredSearch = React.useDeferredValue(searchTerm);

  const [filterDocSeries, setFilterDocSeries] = React.useState('All');
  const [filterClient, setFilterClient] = React.useState('All');
  const [filterReference, setFilterReference] = React.useState('All');
  const [filterStatus, setFilterStatus] = React.useState('All');

  // Paginação
  const [currentPage, setCurrentPage] = React.useState(1);

  const statusOptions = [
    { id: 'All', label: 'Todos os Estados' },
    { id: 'Atrasadas', label: 'Atrasadas' },
    { id: 'Em produção', label: 'Em produção' },
    { id: 'Concluídas', label: 'Concluídas' },
    { id: 'Em Aberto', label: 'Em Aberto' },
  ];

  // Helpers de Filtros
  const getDocSeries = (docNr: string) => {
    if (!docNr) return null;
    const parts = docNr.split('-');
    if (parts.length > 1) {
        return parts.slice(0, -1).join('-');
    }
    return null;
  };

  const seriesOptions = React.useMemo(() => {
    const set = new Set(orders.map(o => getDocSeries(o.docNr)).filter((v): v is string => v !== null));
    return Array.from(set).sort();
  }, [orders]);

  const clientOptions = React.useMemo(() => {
    let filtered = orders;
    if (filterDocSeries !== 'All') {
        filtered = filtered.filter(o => getDocSeries(o.docNr) === filterDocSeries);
    }
    const set = new Set(filtered.map(o => o.clientName).filter(Boolean));
    return Array.from(set).sort();
  }, [orders, filterDocSeries]);

  const referenceOptions = React.useMemo(() => {
    let filtered = orders;
    if (filterDocSeries !== 'All') {
        filtered = filtered.filter(o => getDocSeries(o.docNr) === filterDocSeries);
    }
    if (filterClient !== 'All') {
        filtered = filtered.filter(o => o.clientName === filterClient);
    }
    const set = new Set(filtered.map(o => o.reference).filter(Boolean));
    return Array.from(set).sort();
  }, [orders, filterDocSeries, filterClient]);

  // Lógica de Filtragem Principal
  const filteredOrders = React.useMemo(() => {
    return orders.filter(o => {
      const matchesDocSeries = filterDocSeries === 'All' || getDocSeries(o.docNr) === filterDocSeries;
      const matchesClient = filterClient === 'All' || o.clientName === filterClient;
      const matchesReference = filterReference === 'All' || o.reference === filterReference;

      let matchesStatus = true;
      if (filterStatus !== 'All') {
        const state = getOrderState(o);
        switch (filterStatus) {
          case 'Atrasadas': matchesStatus = state === OrderState.LATE; break;
          case 'Em produção': matchesStatus = state === OrderState.IN_PRODUCTION; break;
          case 'Concluídas': matchesStatus = state === OrderState.COMPLETED; break;
          case 'Em Aberto': matchesStatus = state === OrderState.OPEN; break;
        }
      }

      const search = deferredSearch.toLowerCase().trim();
      const matchesSearch = !search || 
                            (o.docNr || '').toLowerCase().includes(search) || 
                            (o.po || '').toLowerCase().includes(search) ||
                            (o.reference || '').toLowerCase().includes(search) ||
                            (o.clientName || '').toLowerCase().includes(search) ||
                            (o.family || '').toLowerCase().includes(search) ||
                            (o.sizeDesc || '').toLowerCase().includes(search);
      
      return matchesDocSeries && matchesClient && matchesReference && matchesStatus && matchesSearch;
    });
  }, [orders, deferredSearch, filterStatus, filterDocSeries, filterClient, filterReference]);

  // Reset pagination on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, filterDocSeries, filterClient, filterReference, filterStatus]);

  // Helper para obter a data específica do setor
  const getSectorDate = (order: Order, sectorId: string): Date | null => {
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

  // Helper para obter quantidade produzida por setor
  const getSectorProducedQty = (order: Order, sectorId: string): number => {
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
  
  const getPriorityColor = (p: number) => {
      switch(p) {
          case 1: return "text-red-900 dark:text-red-400 fill-red-900 dark:fill-red-400";
          case 2: return "text-orange-500 dark:text-orange-400 fill-orange-500 dark:fill-orange-400";
          case 3: return "text-yellow-400 dark:text-yellow-400 fill-yellow-400 dark:fill-yellow-400";
          default: return "text-slate-200 dark:text-slate-700 fill-slate-200 dark:fill-slate-700";
      }
  };

  // Reset de Filtros
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterDocSeries('All');
    setFilterClient('All');
    setFilterReference('All');
    setFilterStatus('All');
  };

  React.useEffect(() => {
    setFilterClient('All');
    setFilterReference('All');
  }, [filterDocSeries]);

  React.useEffect(() => {
    setFilterReference('All');
  }, [filterClient]);

  const hasActiveFilters = searchTerm !== '' || filterDocSeries !== 'All' || filterClient !== 'All' || filterReference !== 'All' || filterStatus !== 'All';

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500">
      {/* Header com Filtros */}
      <div className="flex-shrink-0 p-4 md:p-6 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">Timeline de Produção</h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Visualização Gantt do fluxo produtivo</p>
            </div>
            <div className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg">
                {filteredOrders.length} registos
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Pesquisar (PO, Ref, Doc...)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all h-full dark:text-white"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2 items-center">
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl p-2 shadow-sm transition-colors active:scale-95 flex items-center justify-center"
                  title="Limpar todos os filtros"
                >
                  <RotateCcw size={16} />
                </button>
              )}

              {/* Filtro Série */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm grow md:grow-0">
                <FileText size={14} className="text-slate-400" />
                <select 
                  className="bg-transparent outline-none text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer min-w-[80px] w-full md:w-auto"
                  value={filterDocSeries}
                  onChange={(e) => setFilterDocSeries(e.target.value)}
                >
                  <option value="All" className="dark:bg-slate-900">Todas as Séries</option>
                  {seriesOptions.map(opt => <option key={opt} value={opt} className="dark:bg-slate-900">{opt}</option>)}
                </select>
              </div>

              {/* Filtro Cliente */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm grow md:grow-0">
                <Users size={14} className="text-slate-400" />
                <select 
                  className="bg-transparent outline-none text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer min-w-[120px] max-w-[200px] w-full md:w-auto truncate"
                  value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                  disabled={clientOptions.length === 0 && filterDocSeries === 'All'}
                >
                  <option value="All" className="dark:bg-slate-900">Todos os Clientes</option>
                  {clientOptions.map(opt => <option key={opt} value={opt} className="dark:bg-slate-900">{opt}</option>)}
                </select>
              </div>

              {/* Filtro Referência */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm grow md:grow-0">
                <Tag size={14} className="text-slate-400" />
                <select 
                  className="bg-transparent outline-none text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer min-w-[120px] max-w-[200px] w-full md:w-auto truncate"
                  value={filterReference}
                  onChange={(e) => setFilterReference(e.target.value)}
                  disabled={referenceOptions.length === 0}
                >
                  <option value="All" className="dark:bg-slate-900">Todas as Referências</option>
                  {referenceOptions.map(opt => <option key={opt} value={opt} className="dark:bg-slate-900">{opt}</option>)}
                </select>
              </div>

              {/* Filtro Estado */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm grow md:grow-0">
                <ListFilter size={14} className="text-slate-400" />
                <select 
                  className="bg-transparent outline-none text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer min-w-[110px] w-full md:w-auto"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {statusOptions.map(opt => <option key={opt.id} value={opt.id} className="dark:bg-slate-900">{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Grid Area */}
      <div className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col transition-colors">
          <div className="overflow-auto flex-1">
            <div className="min-w-[1000px]">
              {/* Table Header */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                <div className="w-60 p-2 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  Referência / Detalhes
                </div>
                <div className="flex-1 flex">
                  {SECTORS.map(s => (
                    <div key={s.id} className="flex-1 p-2 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-slate-800">
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedOrders.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <p className="text-sm font-medium">Nenhuma encomenda corresponde aos filtros selecionados.</p>
                  </div>
                ) : (
                  paginatedOrders.map(order => (
                    <div key={order.id} className="flex hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <div 
                        onClick={() => onViewDetails(order)}
                        className="w-60 p-1 border-r border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 group-hover:bg-blue-50/50 dark:group-hover:bg-slate-800/50 flex flex-col justify-center cursor-pointer transition-colors"
                        title="Clique para ver detalhes do fluxo de produção"
                      >
                        
                        {/* 1 - Referência (Fonte reduzida) */}
                        <div className="mb-0.5">
                           <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate block leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400" title={order.reference}>
                              {order.reference}
                           </span>
                        </div>

                        {/* 2 - Cor + Medida (Fonte reduzida) */}
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 mb-1 leading-none">
                           <span className="truncate font-medium max-w-[120px]" title={order.colorDesc}>
                              {order.colorDesc}
                           </span>
                           {order.sizeDesc && <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0"></span>}
                           <span className="font-bold uppercase truncate" title={order.sizeDesc}>
                              {order.sizeDesc}
                           </span>
                           {/* Flag de Prioridade */}
                           {(order.priority || 0) > 0 && (
                               <Flag size={10} className={`ml-1 ${getPriorityColor(order.priority || 0)}`} strokeWidth={3} />
                           )}
                           {/* Flag de Confeção Manual */}
                           {order.isManual && (
                               <div 
                                   className="ml-0.5 w-3 h-3 rounded-[3px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-[7px] font-black leading-none shrink-0"
                                   title="Confeção Manual"
                               >
                                   M
                               </div>
                           )}
                        </div>
                        
                        {/* 3 - Nr Documento + Cliente (Lado a Lado) */}
                        <div className="flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-1 mt-0.5">
                           <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap leading-none group-hover:border-blue-200 dark:group-hover:border-slate-600" title="Nr. Documento">
                              {order.docNr}
                           </span>
                           <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate font-medium leading-none min-w-0 flex-1" title={order.clientName}>
                              {order.clientName}
                           </span>
                        </div>
                      </div>

                      <div className="flex-1 flex items-center px-2 gap-1">
                        {SECTORS.map(s => {
                          const state = getSectorState(order, s.id);
                          const date = getSectorDate(order, s.id);
                          const producedQty = getSectorProducedQty(order, s.id);
                          const now = new Date();
                          now.setHours(0,0,0,0);
                          
                          const isLate = date && date < now && state !== SectorState.COMPLETED;
                          const bgColor = isLate ? 'bg-rose-400 dark:bg-rose-500' : STATUS_COLORS[state as keyof typeof STATUS_COLORS];

                          return (
                            <div key={s.id} className="flex-1 relative py-1 flex items-center">
                              <div 
                                className={`h-10 rounded-md ${bgColor} w-full relative shadow-sm flex flex-col items-center justify-center transition-colors border border-black/5 dark:border-white/10 gap-0.5`}
                                title={`${s.name} - Ped: ${order.qtyRequested} / Prod: ${producedQty}`}
                              >
                                {date && (
                                  <span className="text-[9px] font-medium text-slate-900 uppercase tracking-tight leading-none mix-blend-multiply dark:mix-blend-normal dark:text-black/80">
                                    {formatDate(date)}
                                  </span>
                                )}
                                <span className="text-[8px] font-bold text-slate-800/80 leading-none mix-blend-multiply dark:mix-blend-normal dark:text-black/80">
                                    Ped. {order.qtyRequested} / Prod. {producedQty}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
           {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center justify-between shrink-0 transition-colors">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-2">
                        Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent text-slate-600 dark:text-slate-400"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent text-slate-600 dark:text-slate-400"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline;
