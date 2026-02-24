import React from 'react';
import { Clock, ChevronRight, Plus, Edit2, Trash2, Check, X, GripVertical } from 'lucide-react';

interface StopReasonsProps {
  hierarchy: any[];
  onUpdateHierarchy: (newHierarchy: any[]) => void;
}

const StopReasons: React.FC<StopReasonsProps> = ({ hierarchy, onUpdateHierarchy }) => {
  const [editingCategoryIndex, setEditingCategoryIndex] = React.useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = React.useState('');
  
  const [editingReason, setEditingReason] = React.useState<{catIdx: number, reasonIdx: number} | null>(null);
  const [editReasonText, setEditReasonText] = React.useState('');

  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');

  const [addingReasonToCatIdx, setAddingReasonToCatIdx] = React.useState<number | null>(null);
  const [newReasonText, setNewReasonText] = React.useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onUpdateHierarchy([...hierarchy, { category: newCategoryName.trim(), reasons: [] }]);
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleUpdateCategory = (index: number) => {
    if (editCategoryName.trim()) {
      const newHierarchy = [...hierarchy];
      newHierarchy[index] = { ...newHierarchy[index], category: editCategoryName.trim() };
      onUpdateHierarchy(newHierarchy);
      setEditingCategoryIndex(null);
    }
  };

  const handleDeleteCategory = (index: number) => {
    if (window.confirm(`Tem a certeza que deseja apagar a categoria "${hierarchy[index].category}" e todos os seus motivos?`)) {
      const newHierarchy = hierarchy.filter((_, i) => i !== index);
      onUpdateHierarchy(newHierarchy);
    }
  };

  const handleAddReason = (catIdx: number) => {
    if (newReasonText.trim()) {
      const newHierarchy = [...hierarchy];
      newHierarchy[catIdx] = { 
        ...newHierarchy[catIdx], 
        reasons: [...newHierarchy[catIdx].reasons, newReasonText.trim()] 
      };
      onUpdateHierarchy(newHierarchy);
      setNewReasonText('');
      setAddingReasonToCatIdx(null);
    }
  };

  const handleUpdateReason = (catIdx: number, reasonIdx: number) => {
    if (editReasonText.trim()) {
      const newHierarchy = [...hierarchy];
      const newReasons = [...newHierarchy[catIdx].reasons];
      newReasons[reasonIdx] = editReasonText.trim();
      newHierarchy[catIdx] = { ...newHierarchy[catIdx], reasons: newReasons };
      onUpdateHierarchy(newHierarchy);
      setEditingReason(null);
    }
  };

  const handleDeleteReason = (catIdx: number, reasonIdx: number) => {
    const newHierarchy = [...hierarchy];
    const newReasons = newHierarchy[catIdx].reasons.filter((_: any, i: number) => i !== reasonIdx);
    newHierarchy[catIdx] = { ...newHierarchy[catIdx], reasons: newReasons };
    onUpdateHierarchy(newHierarchy);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 overflow-y-auto h-full pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-900/20">
            <Clock size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Motivos de Paragens</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Gestão de motivos predefinidos para paragens de produção</p>
          </div>
        </div>

        <button 
          onClick={() => setIsAddingCategory(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
        >
          <Plus size={18} />
          Nova Categoria
        </button>
      </div>

      {isAddingCategory && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl mb-8 animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleAddCategory} className="flex items-center gap-3">
            <input 
              autoFocus
              type="text"
              placeholder="Nome da nova categoria..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
            <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Check size={20}/></button>
            <button type="button" onClick={() => setIsAddingCategory(false)} className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"><X size={20}/></button>
          </form>
        </div>
      )}

      <div className="grid gap-8 max-w-5xl">
        {hierarchy.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-4 bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              {editingCategoryIndex === groupIndex ? (
                <div className="flex items-center gap-2 flex-1">
                  <input 
                    autoFocus
                    type="text"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                  <button onClick={() => handleUpdateCategory(groupIndex)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Check size={16}/></button>
                  <button onClick={() => setEditingCategoryIndex(null)} className="text-rose-600 hover:bg-rose-50 p-1 rounded"><X size={16}/></button>
                </div>
              ) : (
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  {group.category}
                  <button 
                    onClick={() => { setEditingCategoryIndex(groupIndex); setEditCategoryName(group.category); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                </h2>
              )}
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setAddingReasonToCatIdx(groupIndex)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Adicionar Motivo"
                >
                  <Plus size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteCategory(groupIndex)}
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  title="Apagar Categoria"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.reasons.map((reason: string, index: number) => (
                <div 
                  key={index}
                  className="flex items-start justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                >
                  {editingReason?.catIdx === groupIndex && editingReason?.reasonIdx === index ? (
                    <div className="flex items-center gap-1 w-full">
                      <input 
                        autoFocus
                        type="text"
                        value={editReasonText}
                        onChange={(e) => setEditReasonText(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-none text-xs font-bold outline-none dark:text-white"
                      />
                      <button onClick={() => handleUpdateReason(groupIndex, index)} className="text-emerald-600"><Check size={14}/></button>
                      <button onClick={() => setEditingReason(null)} className="text-rose-600"><X size={14}/></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="mt-0.5 shrink-0 text-slate-300 group-hover:text-blue-500 transition-colors">
                          <ChevronRight size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight truncate" title={reason}>{reason}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button 
                          onClick={() => { setEditingReason({catIdx: groupIndex, reasonIdx: index}); setEditReasonText(reason); }}
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDeleteReason(groupIndex, index)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {addingReasonToCatIdx === groupIndex && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl animate-in zoom-in-95 duration-200">
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Novo motivo..."
                    value={newReasonText}
                    onChange={(e) => setNewReasonText(e.target.value)}
                    className="flex-1 bg-transparent border-none text-xs font-bold outline-none dark:text-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddReason(groupIndex)}
                  />
                  <button onClick={() => handleAddReason(groupIndex)} className="text-blue-600"><Check size={16}/></button>
                  <button onClick={() => setAddingReasonToCatIdx(null)} className="text-slate-400"><X size={16}/></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl max-w-5xl">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          <strong>Nota:</strong> Estas alterações são guardadas localmente e refletidas imediatamente em todas as listagens de encomendas.
        </p>
      </div>
    </div>
  );
};

export default StopReasons;
