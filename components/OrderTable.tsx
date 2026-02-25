import React from 'react';
import { 
  Search, 
  ListFilter, 
  Calendar,
  AlertTriangle,
  FileText,
  Database,
  Loader2,
  Users,
  Tag,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Flag,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { Order, OrderState, SectorState, User } from '../types';
import { getOrderState, getSectorState, exportOrdersToSQLite, getDirectoryHandle, getWeekRange, exportOrdersToExcel } from '../services/dataService';
import { formatDate } from '../utils/formatters';
import { SECTORS } from '../constants';
import StopReasonSelector from './StopReasonSelector';

// Definição dos tipos de filtros ativos vindos do Dashboard
export type ActiveFilterType = 'LATE' | 'WEEK_DELIVERIES' | 'WEEK_COMPLETED' | null;

interface OrderTableProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  excelHeaders: Record<string, string>;
  activeFilter?: ActiveFilterType;
  user: User | null;
  onUpdatePriority?: (docNr: string, priority: number) => void;
  onUpdateManual?: (docNr: string, isManual: boolean) => void;
  onUpdateStopReason?: (docNr: string, sectorId: string, reason: string) => void;
  stopReasonsHierarchy: any[];
}

const ITEMS_PER_PAGE = 50;

// Helper para número da semana ISO
const getISOWeek = (d: Date) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

const OrderTable: React.FC<OrderTableProps> = React.memo(({ orders, onViewDetails, excelHeaders, activeFilter, user, onUpdatePriority, onUpdateManual, onUpdateStopReason, stopReasonsHierarchy }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const deferredSearch = React.useDeferredValue(searchTerm);
  
  // Estados dos Filtros
  const [filterDocSeries, setFilterDocSeries] = React.useState('All');
  const [filterComercial, setFilterComercial] = React.useState('All');
  const [filterReference, setFilterReference] = React.useState('All');
  const [filterStatus, setFilterStatus] = React.useState('All');
  const [filterPriority, setFilterPriority] = React.useState('All'); 
  const [filterManual, setFilterManual] = React.useState(false); 
  const [filterHasObservations, setFilterHasObservations] = React.useState(false);
  
  // Alterado de boolean para Date | null para suportar navegação
  const [filterDate, setFilterDate] = React.useState<Date | null>(null);

  // Estado para controlar qual menu de prioridade está aberto
  const [openPriorityMenuId, setOpenPriorityMenuId] = React.useState<string | null>(null);
  
  // Ref para fechar menu ao clicar fora
  const menuRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenPriorityMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Efeito para aplicar filtros quando activeFilter muda (Dashboard)
  React.useEffect(() => {
      if (activeFilter === 'LATE') {
          setFilterStatus('Atrasadas');
          setFilterDate(null);
      } else if (activeFilter === 'WEEK_DELIVERIES') {
          setFilterStatus('All'); 
          setFilterDate(new Date()); // Define semana atual
      } else if (activeFilter === 'WEEK_COMPLETED') {
          setFilterStatus('Concluídas'); 
          setFilterDate(new Date()); // Define semana atual
      }
  }, [activeFilter]);

  // Paginação
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportSuccess, setExportSuccess] = React.useState(false);

  // Estados para exportação Excel
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const [excelExportSuccess, setExcelExportSuccess] = React.useState(false);

  const statusOptions = [
    { id: 'All', label: 'Todos os Estados' },
    { id: 'Atrasadas', label: 'Atrasadas' },
    { id: 'Em produção', label: 'Em produção' },
    { id: 'Concluídas', label: 'Concluídas' },
    { id: 'Em Aberto', label: 'Em Aberto' },
  ];

  const priorityOptions = [
    { id: 'All', label: 'Todas Prioridades' },
    { id: 'Any', label: 'Com Prioridade (Qualquer)' },
    { id: '1', label: 'Prioridade 1 (Alta)' },
    { id: '2', label: 'Prioridade 2 (Média)' },
    { id: '3', label: 'Prioridade 3 (Baixa)' },
    { id: '0', label: 'Sem Prioridade' },
  ];

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

  const comercialOptions = React.useMemo(() => {
    let filtered = orders;
    if (filterDocSeries !== 'All') {
        filtered = filtered.filter(o => getDocSeries(o.docNr) === filterDocSeries);
    }
    const set = new Set(filtered.map(o => o.comercial).filter(Boolean));
    return Array.from(set).sort();
  }, [orders, filterDocSeries]);

  const referenceOptions = React.useMemo(() => {
    let filtered = orders;
    if (filterDocSeries !== 'All') {
        filtered = filtered.filter(o => getDocSeries(o.docNr) === filterDocSeries);
    }
    if (filterComercial !== 'All') {
        filtered = filtered.filter(o => o.comercial === filterComercial);
    }
    const set = new Set(filtered.map(o => o.reference).filter(Boolean));
    return Array.from(set).sort();
  }, [orders, filterDocSeries, filterComercial]);

  const hasObservations = (order: Order) => {
    return order.sectorObservations && Object.values(order.sectorObservations).some(v => v && v.trim() !== '');
  };

  // Funções de Navegação de Semana
  const handlePrevWeek = () => {
    if (filterDate) {
      const newDate = new Date(filterDate);
      newDate.setDate(newDate.getDate() - 7);
      setFilterDate(newDate);
    }
  };

  const handleNextWeek = () => {
    if (filterDate) {
      const newDate = new Date(filterDate);
      newDate.setDate(newDate.getDate() + 7);
      setFilterDate(newDate);
    }
  };

  const finalFilteredOrders = React.useMemo(() => {
    // Calcular range da semana selecionada, se houver
    let weekStart: Date, weekEnd: Date;
    if (filterDate) {
      const range = getWeekRange(filterDate);
      weekStart = range.start;
      weekEnd = range.end;
    }

    return orders.filter(o => {
      const matchesDocSeries = filterDocSeries === 'All' || getDocSeries(o.docNr) === filterDocSeries;
      const matchesComercial = filterComercial === 'All' || o.comercial === filterComercial;
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
      
      const hasPriorityFilter = filterPriority !== 'All';
      const hasManualFilter = filterManual;

      let matchesPriority = true;
      if (hasPriorityFilter) {
         const p = o.priority || 0;
         if (filterPriority === 'Any') {
             matchesPriority = p > 0;
         } else {
             matchesPriority = p.toString() === filterPriority;
         }
      }

      let matchesManual = true;
      if (hasManualFilter) {
          matchesManual = !!o.isManual;
      }

      let matchesFlags = true;
      if (hasPriorityFilter && hasManualFilter) {
          matchesFlags = matchesPriority || matchesManual;
      } else {
          matchesFlags = matchesPriority && matchesManual;
      }
      
      if (activeFilter === 'WEEK_COMPLETED') {
         const state = getOrderState(o);
         const isCompletedOrShipped = state === OrderState.COMPLETED || getSectorState(o, 'expedicao') === SectorState.COMPLETED || getSectorState(o, 'expedicao') === SectorState.IN_PROGRESS;
         if (!isCompletedOrShipped) matchesStatus = false;
      }

      // Filtro de Semana (Dinâmico)
      let matchesWeek = true;
      if (filterDate) {
          const dateToCheck = o.requestedDate || o.armExpDate;
          matchesWeek = !!dateToCheck && dateToCheck >= weekStart && dateToCheck <= weekEnd;
      }

      const matchesObservations = !filterHasObservations || hasObservations(o);

      const search = deferredSearch.toLowerCase().trim();
      const matchesSearch = !search || 
                            (o.docNr || '').toLowerCase().includes(search) || 
                            (o.po || '').toLowerCase().includes(search) ||
                            (o.reference || '').toLowerCase().includes(search) ||
                            (o.comercial || '').toLowerCase().includes(search) ||
                            (o.clientName || '').toLowerCase().includes(search) ||
                            (o.family || '').toLowerCase().includes(search) ||
                            (o.sizeDesc || '').toLowerCase().includes(search);
      
      return matchesDocSeries && matchesComercial && matchesReference && matchesStatus && matchesSearch && matchesObservations && matchesWeek && matchesFlags;
    });
  }, [orders, deferredSearch, filterStatus, filterDocSeries, filterComercial, filterReference, filterHasObservations, filterDate, filterPriority, filterManual, activeFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, filterDocSeries, filterComercial, filterReference, filterStatus, filterHasObservations, filterDate, filterPriority, filterManual]);

  React.useEffect(() => {
    setFilterComercial('All');
    setFilterReference('All');
  }, [filterDocSeries]);

  React.useEffect(() => {
    setFilterReference('All');
  }, [filterComercial]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterDocSeries('All');
    setFilterComercial('All');
    setFilterReference('All');
    setFilterStatus('All');
    setFilterPriority('All');
    setFilterManual(false);
    setFilterHasObservations(false);
    setFilterDate(null);
  };

  const toggleHeaderPriorityFilter = () => {
      if (filterPriority === 'All') {
          setFilterPriority('Any');
      } else {
          setFilterPriority('All');
      }
  };

  const hasActiveFilters = searchTerm !== '' || filterDocSeries !== 'All' || filterComercial !== 'All' || filterReference !== 'All' || filterStatus !== 'All' || filterPriority !== 'All' || filterHasObservations || filterDate !== null || filterManual;

  const handleExport = async () => {
    if (finalFilteredOrders.length === 0) return;
    setIsExporting(true);
    setExportSuccess(false);
    try {
      const exportHandle = await getDirectoryHandle('export');
      await new Promise(resolve => setTimeout(resolve, 100));

      const isFullList = orders.length === finalFilteredOrders.length;
      const prefix = isFullList ? "Listagem completa" : "Listagem parcial";
      
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const dateStr = `${day}-${month}-${year}`;
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      
      const fileName = `${prefix} ${dateStr} ${timeStr}.sqlite`;

      await exportOrdersToSQLite(finalFilteredOrders, excelHeaders, exportHandle, fileName);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert("Erro ao exportar: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExcelExport = async () => {
    if (finalFilteredOrders.length === 0) return;
    setIsExportingExcel(true);
    setExcelExportSuccess(false);
    try {
        await new Promise(resolve => setTimeout(resolve, 100));

        const isFullList = orders.length === finalFilteredOrders.length;
        const prefix = isFullList ? "Listagem completa" : "Listagem parcial";
        
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateStr = `${day}-${month}-${year}`;
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');

        const fileName = `${prefix} ${dateStr} ${timeStr}.xlsx`;

        exportOrdersToExcel(finalFilteredOrders, fileName);
        setExcelExportSuccess(true);
        setTimeout(() => setExcelExportSuccess(false), 3000);
    } catch (error) {
        console.error(error);
        alert("Erro ao exportar Excel.");
    } finally {
        setIsExportingExcel(false);
    }
  };

  const getStatusBadge = (order: Order) => {
    const state = getOrderState(order);
    switch (state) {
      case OrderState.COMPLETED: 
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">Concluída</span>;
      case OrderState.LATE: 
        return <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-800 inline-flex items-center justify-center gap-1"><AlertTriangle size={10} /> Atrasada</span>;
      case OrderState.IN_PRODUCTION: 
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800">Em Produção</span>;
      default: 
        return <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700">Em Aberto</span>;
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

  // Pagination Logic
  const totalPages = Math.ceil(finalFilteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return finalFilteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [finalFilteredOrders, currentPage]);

  const handlePriorityClick = (e: React.MouseEvent, orderId: string) => {
      e.stopPropagation();
      setOpenPriorityMenuId(openPriorityMenuId === orderId ? null : orderId);
  };

  const handleSetPriority = (docNr: string, level: number) => {
      if (onUpdatePriority) {
          onUpdatePriority(docNr, level);
          setOpenPriorityMenuId(null);
      }
  };

  const handleManualClick = (e: React.MouseEvent, docNr: string, currentStatus: boolean) => {
      e.stopPropagation();
      if (onUpdateManual && user?.permissions?.orders === 'write') {
          onUpdateManual(docNr, !currentStatus);
      }
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex-shrink-0 p-4 md:p-6 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white transition-colors">Listagem de Encomendas</h2>
              <div className="flex items-center gap-2">
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{finalFilteredOrders.length} registos encontrados</p>
                {filterDate && (
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 animate-in fade-in">
                        Filtro: Semana {getISOWeek(filterDate)}
                    </span>
                )}
                {filterManual && (
                    <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 animate-in fade-in">
                        Filtro: Conf. Manual
                    </span>
                )}
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
                {/* Botão Exportar Excel */}
                <button 
                  onClick={handleExcelExport}
                  disabled={isExportingExcel}
                  className={`px-4 py-2 text-white rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 min-w-[150px] justify-center ${
                    excelExportSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                  }`}
                  title="Exportar Lista para Excel"
                >
                   {isExportingExcel ? (
                      <>
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-xs font-bold uppercase">A Gerar...</span>
                      </>
                   ) : excelExportSuccess ? (
                      <>
                          <Check size={16} />
                          <span className="text-xs font-bold uppercase">Sucesso</span>
                      </>
                   ) : (
                      <>
                          <FileSpreadsheet size={16} />
                          <span className="text-xs font-bold uppercase">Exportar Excel</span>
                      </>
                   )}
                </button>

                {/* Botão Exportar BD */}
                {user?.permissions?.config === 'write' && (
                <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className={`px-4 py-2 text-white rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 min-w-[140px] justify-center ${
                        exportSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                    }`}
                    title="Exportar Base de Dados (SQLite)"
                    >
                    {isExporting ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-xs font-bold uppercase">A Gerar...</span>
                        </>
                    ) : exportSuccess ? (
                        <>
                            <Check size={16} />
                            <span className="text-xs font-bold uppercase">Guardado</span>
                        </>
                    ) : (
                        <>
                            <Database size={16} />
                            <span className="text-xs font-bold uppercase">Exportar BD</span>
                        </>
                    )}
                </button>
                )}
            </div>
          </div>
          
          <div className="flex flex-col xl:flex-row gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Pesquisar texto..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all h-full dark:text-white"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl p-2 shadow-sm transition-colors active:scale-95 flex items-center justify-center"
                  title="Limpar todos os filtros e pesquisa"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              
              {/* Seletor de Semana Atualizado */}
              {!filterDate ? (
                <button 
                  onClick={() => setFilterDate(new Date())}
                  className="flex items-center gap-2 border rounded-xl px-3 py-2 shadow-sm grow md:grow-0 transition-colors bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Filtrar por Semana"
                >
                   <Calendar size={14} className="text-slate-400" />
                   <span className="text-xs font-bold">Filtrar Semana</span>
                </button>
              ) : (
                <div className="flex items-center bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm overflow-hidden grow md:grow-0">
                  <button onClick={handlePrevWeek} className="px-2 py-2 hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-300 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <div className="px-2 flex flex-col items-center justify-center min-w-[100px]">
                    <span className="text-[10px] font-black uppercase text-blue-500 dark:text-blue-400 leading-none">Semana {getISOWeek(filterDate)}</span>
                    <span className="text-[10px] font-medium text-blue-700 dark:text-blue-200 leading-none mt-0.5">
                       {(() => {
                         const {start, end} = getWeekRange(filterDate);
                         return `${start.getDate()} ${start.toLocaleString('pt-PT', {month: 'short'})} - ${end.getDate()} ${end.toLocaleString('pt-PT', {month: 'short'})}`;
                       })()}
                    </span>
                  </div>
                  <button onClick={handleNextWeek} className="px-2 py-2 hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-300 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                  <div className="w-px h-6 bg-blue-200 dark:bg-blue-800 mx-1"></div>
                  <button onClick={() => setFilterDate(null)} className="px-2 py-2 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-blue-400 dark:text-blue-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm grow md:grow-0">
                <Flag size={14} className="text-slate-400" />
                <select 
                  className="bg-transparent outline-none text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer min-w-[110px] w-full md:w-auto"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  {priorityOptions.map(opt => <option key={opt.id} value={opt.id} className="dark:bg-slate-900">{opt.label}</option>)}
                </select>
              </div>

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

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm grow md:grow-0">
                <Users size={14} className="text-slate-400" />
                <select 
                  className="bg-transparent outline-none text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer min-w-[120px] max-w-[200px] w-full md:w-auto truncate"
                  value={filterComercial}
                  onChange={(e) => setFilterComercial(e.target.value)}
                  disabled={comercialOptions.length === 0 && filterDocSeries === 'All'}
                >
                  <option value="All" className="dark:bg-slate-900">Todos os Comerciais</option>
                  {comercialOptions.map(opt => <option key={opt} value={opt} className="dark:bg-slate-900">{opt}</option>)}
                </select>
              </div>

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

              {/* Botões Mobile */}
              <div className="md:hidden flex gap-2">
                <button 
                  onClick={handleExcelExport}
                  disabled={isExportingExcel}
                  className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-green-400 transition-all shadow-sm active:scale-95"
                >
                  {isExportingExcel ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
                </button>

                {user?.permissions?.config === 'write' && (
                    <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-400 transition-all shadow-sm active:scale-95"
                    >
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 shadow-sm transition-colors">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap w-[15%]">
                    <div className="flex items-center gap-2">
                        Documento / PO
                        <div className="flex gap-1">
                            <button 
                                onClick={toggleHeaderPriorityFilter}
                                className={`transition-all hover:scale-110 active:scale-95 ${filterPriority !== 'All' ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                                title={filterPriority === 'All' ? "Filtrar por Prioridade" : "Limpar filtro de Prioridade"}
                            >
                                <Flag 
                                    size={14} 
                                    className={filterPriority === 'Any' || (filterPriority !== 'All' && filterPriority !== '0') ? 'fill-blue-500 text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} 
                                    strokeWidth={2.5}
                                />
                            </button>
                            {/* Header M Filter */}
                            <button
                                onClick={() => setFilterManual(!filterManual)}
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold transition-all hover:scale-110 active:scale-95 ${filterManual ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-300 dark:bg-slate-700 text-white dark:text-slate-300 opacity-50 hover:opacity-100'}`}
                                title="Filtrar por Confeção Manual"
                            >
                                M
                            </button>
                        </div>
                    </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap w-[35%]">Cliente (Comercial) / Ref + Cor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap w-[10%]">Medida / Família</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap w-[15%]">Qtd. Pedida / Entrega</th>
                <th className="px-2 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-[5%]">
                    <button 
                        onClick={() => setFilterHasObservations(!filterHasObservations)}
                        className={`flex items-center justify-center gap-1 mx-auto transition-all ${filterHasObservations ? 'text-blue-600 dark:text-blue-400 scale-110' : 'hover:text-slate-600 dark:hover:text-slate-300'}`}
                        title={filterHasObservations ? "Mostrar todas" : "Filtrar apenas com observações"}
                    >
                        Obs.
                        <Filter size={10} strokeWidth={3} className={filterHasObservations ? "fill-blue-100 dark:fill-blue-900" : ""} />
                    </button>
                </th>
                <th className="px-2 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-[10%]">Classificação</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-[10%]">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950 transition-colors">
              {paginatedOrders.map((order) => (
                <tr 
                  key={order.id} 
                  onClick={() => onViewDetails(order)}
                  className="hover:bg-blue-50 dark:hover:bg-slate-900 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-start gap-2">
                        <div className="flex flex-col gap-1.5 shrink-0 pt-0.5 items-center">
                            {/* Priority Flag */}
                            <div className="relative">
                                <button 
                                    onClick={(e) => user?.permissions?.orders === 'write' ? handlePriorityClick(e, order.id) : null}
                                    className={`transition-all ${user?.permissions?.orders === 'write' ? 'hover:scale-110 active:scale-95 cursor-pointer' : 'cursor-default'}`}
                                    title={user?.permissions?.orders === 'write' ? "Alterar Prioridade" : "Prioridade"}
                                >
                                    <Flag size={16} className={getPriorityColor(order.priority || 0)} strokeWidth={2} />
                                </button>
                                
                                {/* Priority Menu */}
                                {openPriorityMenuId === order.id && (
                                    <div 
                                        ref={menuRef}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute top-6 left-0 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-xl p-2 z-50 flex flex-col gap-1 min-w-[140px] animate-in fade-in zoom-in-95"
                                    >
                                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase px-2 mb-1">Definir Prioridade</p>
                                        <button onClick={() => handleSetPriority(order.docNr, 1)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-xs font-bold text-red-900 dark:text-red-400">
                                            <Flag size={12} className="fill-red-900 dark:fill-red-400"/> Alta
                                        </button>
                                        <button onClick={() => handleSetPriority(order.docNr, 2)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg text-xs font-bold text-orange-600 dark:text-orange-400">
                                            <Flag size={12} className="fill-orange-500 dark:fill-orange-400"/> Média
                                        </button>
                                        <button onClick={() => handleSetPriority(order.docNr, 3)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg text-xs font-bold text-yellow-500 dark:text-yellow-400">
                                            <Flag size={12} className="fill-yellow-400 dark:fill-yellow-400"/> Baixa
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-0.5"></div>
                                        <button onClick={() => handleSetPriority(order.docNr, 0)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400">
                                            <Flag size={12} className="text-slate-300 dark:text-slate-600"/> Remover
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Manual Confection 'M' Flag */}
                            <button
                                onClick={(e) => handleManualClick(e, order.docNr, !!order.isManual)}
                                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center border transition-all ${user?.permissions?.orders === 'write' ? 'hover:scale-110 active:scale-95 cursor-pointer' : 'cursor-default'} ${order.isManual ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-400 dark:hover:text-slate-500'}`}
                                title={user?.permissions?.orders === 'write' ? "Alternar Confeção Manual" : "Confeção Manual"}
                            >
                                M
                            </button>
                        </div>
                        
                        <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{order.docNr || '-'}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap block mt-0.5">PO: {order.po || '-'}</span>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-black text-slate-900 dark:text-white leading-tight block truncate max-w-[400px]" title={order.clientName}>
                            {order.clientName || <span className="text-slate-300 italic">Sem Cliente</span>}
                            {order.comercial && <span className="ml-2 text-[10px] text-blue-500 dark:text-blue-400 font-bold">({order.comercial})</span>}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] max-w-[400px] mt-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap" title="Referência">
                                {order.reference || '-'}
                            </span>
                            {order.colorDesc && (
                                <span className="font-medium text-slate-500 dark:text-slate-400 truncate border-l border-slate-300 dark:border-slate-700 pl-2" title={`Cor: ${order.colorDesc}`}>
                                    {order.colorDesc}
                                </span>
                            )}
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[100px]">
                      {order.sizeDesc || '-'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[100px] uppercase font-medium mt-0.5">
                      {order.family || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200 block">{order.qtyRequested.toLocaleString('pt-PT')} <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">UN</span></span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 mt-1">
                       <Calendar size={11} className="text-slate-400" /> {formatDate(order.requestedDate)}
                    </span>
                  </td>
                  <td className="px-2 py-4 align-middle text-center">
                    {hasObservations(order) && (
                        <div title="Tem observações">
                            <Eye size={16} className="text-slate-400 dark:text-slate-500 mx-auto group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                        </div>
                    )}
                  </td>
                  <td className="px-2 py-4 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                    <StopReasonSelector 
                        currentReason={order.sectorStopReasons?.['planeamento']} 
                        onSelect={(reason) => onUpdateStopReason?.(order.docNr, 'planeamento', reason)}
                        disabled={user?.permissions?.orders !== 'write'}
                        hierarchy={stopReasonsHierarchy}
                    />
                  </td>
                  <td className="px-6 py-4 align-middle text-center">
                    {getStatusBadge(order)}
                  </td>
                </tr>
              ))}
              {paginatedOrders.length === 0 && (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                        Nenhum resultado encontrado.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Grid */}
        <div className="md:hidden grid grid-cols-1 gap-3 p-4">
          {paginatedOrders.map((order) => (
            <div 
              key={order.id}
              onClick={() => onViewDetails(order)}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm active:bg-slate-50 dark:active:bg-slate-800 transition-colors space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                   {/* Mobile Flags Container */}
                    <div className="pt-0.5 flex flex-col gap-1 items-center">
                       <Flag size={16} className={getPriorityColor(order.priority || 0)} strokeWidth={2} />
                       {order.isManual && (
                           <div className="w-3.5 h-3.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[8px] font-bold flex items-center justify-center border border-indigo-200 dark:border-indigo-800">M</div>
                       )}
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-white text-base leading-none">{order.docNr || '-'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">PO: {order.po || '-'}</p>
                            {hasObservations(order) && <Eye size={14} className="text-blue-500" />}
                        </div>
                    </div>
                </div>
                {getStatusBadge(order)}
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2">
                <div className="col-span-2">
                   <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Cliente / Comercial</p>
                   <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                        {order.clientName || '-'}
                        {order.comercial && <span className="ml-1 text-[11px] text-blue-500 font-bold italic">({order.comercial})</span>}
                   </p>
                </div>
                <div className="col-span-2">
                   <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Ref / Cor</p>
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{order.reference || '-'}</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{order.colorDesc}</span>
                   </div>
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Medida</p>
                   <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight truncate">{order.sizeDesc || '-'}</p>
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Família</p>
                   <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight truncate">{order.family || '-'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Qtd. Pedida</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">{order.qtyRequested.toLocaleString('pt-PT')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Entrega</p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{formatDate(order.requestedDate)}</p>
                </div>
              </div>
            </div>
          ))}
          {paginatedOrders.length === 0 && (
             <div className="p-8 text-center text-slate-400 font-medium">Nenhum resultado encontrado.</div>
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 flex items-center justify-between shrink-0 safe-bottom transition-colors">
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
  );
});

export default OrderTable;