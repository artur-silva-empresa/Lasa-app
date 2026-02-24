import React from 'react';
import { ChevronRight, ChevronDown, AlertCircle, X } from 'lucide-react';
import { STOP_REASONS_HIERARCHY } from '../constants';

interface StopReasonSelectorProps {
  currentReason?: string;
  onSelect: (reason: string) => void;
  disabled?: boolean;
  hierarchy: any[];
}

const StopReasonSelector: React.FC<StopReasonSelectorProps> = ({ currentReason, onSelect, disabled, hierarchy }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [customReason, setCustomReason] = React.useState('');
  const [isEnteringCustom, setIsEnteringCustom] = React.useState(false);
  
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedCategory(null);
        setIsEnteringCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReasonClick = (reason: string) => {
    if (reason.toLowerCase().includes('outro')) {
      setIsEnteringCustom(true);
    } else {
      onSelect(reason);
      setIsOpen(false);
      setSelectedCategory(null);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customReason.trim()) {
      onSelect(`${selectedCategory}: ${customReason.trim()}`);
      setCustomReason('');
      setIsEnteringCustom(false);
      setIsOpen(false);
      setSelectedCategory(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
          currentReason 
            ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800' 
            : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={currentReason || 'Classificar motivo de paragem'}
      >
        <AlertCircle size={12} />
        <span className="max-w-[80px] truncate">
          {currentReason || 'Motivo'}
        </span>
        <ChevronDown size={10} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {!selectedCategory ? (
            <div className="p-2 space-y-1">
              <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                Categorias
              </div>
              {hierarchy.map((group) => (
                <button
                  key={group.category}
                  onClick={() => setSelectedCategory(group.category)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors group"
                >
                  {group.category}
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400" />
                </button>
              ))}
              {currentReason && (
                <button
                  onClick={() => {
                    onSelect('');
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors mt-2 border-t border-slate-100 dark:border-slate-800 pt-3"
                >
                  <X size={14} />
                  Limpar Classificação
                </button>
              )}
            </div>
          ) : isEnteringCustom ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{selectedCategory}</h4>
                <button onClick={() => setIsEnteringCustom(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
              </div>
              <form onSubmit={handleCustomSubmit} className="space-y-2">
                <textarea
                  autoFocus
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Descreva o motivo..."
                  className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirmar Motivo
                </button>
              </form>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold text-blue-600 hover:underline mb-2"
              >
                ← Voltar
              </button>
              <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                {selectedCategory}
              </div>
              {hierarchy.find(g => g.category === selectedCategory)?.reasons.map((reason: string) => (
                <button
                  key={reason}
                  onClick={() => handleReasonClick(reason)}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StopReasonSelector;
