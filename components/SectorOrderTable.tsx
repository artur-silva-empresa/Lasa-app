import React from 'react';
import { 
  Search, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Save,
  Edit2,
  X,
  Check
} from 'lucide-react';
import { Order, Sector } from '../types';
import { formatDate } from '../utils/formatters';
import StopReasonSelector from './StopReasonSelector';

interface SectorOrderTableProps {
  orders: Order[];
  sector: Sector;
  onViewDetails: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  stopReasonsHierarchy: any[];
}

const ITEMS_PER_PAGE = 50;

const SectorOrderTable: React.FC<SectorOrderTableProps> = ({ orders, sector, onViewDetails, onUpdateOrder, stopReasonsHierarchy }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const deferredSearch = React.useDeferredValue(searchTerm);
  const [currentPage, setCurrentPage] = React.useState(1);
  
  // State for inline editing
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editObs, setEditObs] = React.useState('');
  const [editDate, setEditDate] = React.useState<string>('');

  // Helper to get sector specific data
  const getSectorProducedQty = (order: Order): number => {
    switch (sector.id) {
      case 'tecelagem': return order.felpoCruQty;
      case 'felpo_cru': return order.felpoCruQty;
      case 'tinturaria': return order.tinturariaQty;
      case 'confeccao': return order.confRoupoesQty + order.confFelposQty;
      case 'embalagem': return order.embAcabQty;
      case 'expedicao': return order.stockCxQty;
      default: return 0;
    }
  };

  const getSectorDate = (order: Order): Date | null => {
    switch (sector.id) {
      case 'tecelagem': return order.dataTec;
      case 'felpo_cru': return order.felpoCruDate;
      case 'tinturaria': return order.tinturariaDate;
      case 'confeccao': return order.confDate;
      case 'embalagem': return order.armExpDate;
      case 'expedicao': return order.armExpDate;
      default: return null;
    }
  };

  const filteredOrders = React.useMemo(() => {
    const search = deferredSearch.toLowerCase().trim();
    return orders.filter(o => {
      if (!search) return true;
      return (
        (o.docNr || '').toLowerCase().includes(search) || 
        (o.clientName || '').toLowerCase().includes(search) ||
        (o.reference || '').toLowerCase().includes(search) ||
        (o.colorDesc || '').toLowerCase().includes(search)
      );
    });
  }, [orders, deferredSearch]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handleEditClick = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(order.id);
    setEditObs(order.sectorObservations?.[sector.id] || '');
    
    const predictedDate = order.sectorPredictedDates?.[sector.id];
    setEditDate(predictedDate ? new Date(predictedDate).toISOString().split('T')[0] : '');
  };

  const handleSaveClick = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedObservations = {
        ...(order.sectorObservations || {}),
        [sector.id]: editObs
    };

    const updatedPredictedDates = {
        ...(order.sectorPredictedDates || {}),
        [sector.id]: editDate ? new Date(editDate) : null
    };

    onUpdateOrder({
        ...order,
        sectorObservations: updatedObservations,
        sectorPredictedDates: updatedPredictedDates
    });

    setEditingId(null);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500">
      {/* Header / Toolbar */}
      <div className="flex-shrink-0 p-4 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all dark:text-white"
            />
          </div>
          
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl p-2 shadow-sm transition-colors active:scale-95"
              title="Limpar pesquisa"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Doc. Nr.</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Cliente</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Ref / Cor</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Medida / Família</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Qtd. Ped / Prod</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Data Saída</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[15%]">Observações</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-[10%]">Classificação</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-[10%]">Data Prevista</th>
              <th className="px-2 py-3 w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {paginatedOrders.map((order) => {
              const isEditing = editingId === order.id;
              const producedQty = getSectorProducedQty(order);
              const exitDate = getSectorDate(order);
              const predictedDate = order.sectorPredictedDates?.[sector.id];
              const obs = order.sectorObservations?.[sector.id];

              return (
                <tr 
                  key={order.id} 
                  onClick={() => !isEditing && onViewDetails(order)}
                  className={`hover:bg-blue-50 dark:hover:bg-slate-900 transition-colors group ${isEditing ? 'bg-blue-50 dark:bg-slate-900' : 'cursor-pointer'}`}
                >
                  <td className="px-4 py-3 align-top font-bold text-sm text-slate-800 dark:text-slate-200">{order.docNr}</td>
                  <td className="px-4 py-3 align-top text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[150px]" title={order.clientName}>{order.clientName}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{order.reference}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{order.colorDesc}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{order.sizeDesc}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{order.family}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                        {order.qtyRequested.toLocaleString('pt-PT')} / <span className="font-black text-slate-900 dark:text-white">{producedQty.toLocaleString('pt-PT')}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-center text-xs font-medium text-slate-600 dark:text-slate-400">
                    {formatDate(exitDate)}
                  </td>
                  
                  {/* Editable Observations */}
                  <td className="px-4 py-3 align-top" onClick={e => e.stopPropagation()}>
                    {isEditing ? (
                        <textarea
                            value={editObs}
                            onChange={(e) => setEditObs(e.target.value)}
                            className="w-full text-xs p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                            rows={2}
                            placeholder="Adicionar observação..."
                        />
                    ) : (
                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-2" title={obs}>
                            {obs || '-'}
                        </p>
                    )}
                  </td>

                  {/* Stop Reason Classification */}
                  <td className="px-4 py-3 align-top text-center" onClick={e => e.stopPropagation()}>
                    <StopReasonSelector 
                        currentReason={order.sectorStopReasons?.[sector.id]} 
                        onSelect={(reason) => onUpdateOrder({ 
                          ...order, 
                          sectorStopReasons: { ...(order.sectorStopReasons || {}), [sector.id]: reason } 
                        })}
                        hierarchy={stopReasonsHierarchy}
                    />
                  </td>

                  {/* Editable Predicted Date */}
                  <td className="px-4 py-3 align-top text-center" onClick={e => e.stopPropagation()}>
                    {isEditing ? (
                        <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full text-xs p-1 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        />
                    ) : (
                        <span className={`text-xs font-bold ${predictedDate ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                            {predictedDate ? formatDate(predictedDate) : '-'}
                        </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-3 align-middle text-center" onClick={e => e.stopPropagation()}>
                    {isEditing ? (
                        <div className="flex flex-col gap-1">
                            <button onClick={(e) => handleSaveClick(order, e)} className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors">
                                <Check size={14} />
                            </button>
                            <button onClick={handleCancelClick} className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={(e) => handleEditClick(order, e)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {paginatedOrders.length === 0 && (
                <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                        Nenhum resultado encontrado.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
};

export default SectorOrderTable;
