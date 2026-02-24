import React from 'react';
import { StoppageReason } from '../types';
import { INITIAL_STOPPAGE_REASONS } from '../constants/stoppageReasons';
import { Plus, Trash2, Save, X, Edit2, AlertCircle } from 'lucide-react';

const StoppageReasonsPage: React.FC = () => {
  const [reasons, setReasons] = React.useState<StoppageReason[]>(() => {
    const saved = localStorage.getItem('stoppageReasons');
    return saved ? JSON.parse(saved) : INITIAL_STOPPAGE_REASONS;
  });

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editType, setEditType] = React.useState('');
  const [editReason, setEditReason] = React.useState('');
  
  const [newType, setNewType] = React.useState('');
  const [newReason, setNewReason] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('stoppageReasons', JSON.stringify(reasons));
  }, [reasons]);

  const handleEditClick = (reason: StoppageReason) => {
    setEditingId(reason.id);
    setEditType(reason.type);
    setEditReason(reason.reason);
  };

  const handleSaveEdit = () => {
    if (!editType.trim() || !editReason.trim()) return;
    
    setReasons(prev => prev.map(r => 
      r.id === editingId ? { ...r, type: editType, reason: editReason } : r
    ));
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem a certeza que deseja eliminar este motivo?')) {
      setReasons(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleAdd = () => {
    if (!newType.trim() || !newReason.trim()) return;
    
    const newId = `custom-${Date.now()}`;
    setReasons(prev => [...prev, { id: newId, type: newType, reason: newReason }]);
    setNewType('');
    setNewReason('');
    setIsAdding(false);
  };

  // Group by type
  const groupedReasons = React.useMemo(() => {
    const groups: Record<string, StoppageReason[]> = {};
    reasons.forEach(r => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [reasons]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Motivos de Paragens</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configuração dos motivos de paragem/atraso</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-lg shadow-blue-900/20"
        >
          <Plus size={16} />
          Adicionar Motivo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isAdding && (
          <div className="mb-6 p-4 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm animate-in slide-in-from-top-2">
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wider">Novo Motivo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Motivo</label>
                <input 
                  type="text" 
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="Ex: PRODUÇÃO"
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Motivo</label>
                <input 
                  type="text" 
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Descrição do motivo..."
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAdd}
                disabled={!newType.trim() || !newReason.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Save size={14} />
                Guardar
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {Object.entries(groupedReasons).map(([type, typeReasons]) => (
            <div key={type} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">{type}</h3>
                <span className="text-xs font-medium text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{typeReasons.length} motivos</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {typeReasons.map((reason) => (
                  <div key={reason.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group flex items-center justify-between gap-4">
                    {editingId === reason.id ? (
                      <div className="flex-1 flex flex-col md:flex-row gap-3 items-center w-full">
                        <input 
                          type="text" 
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className="w-full md:w-1/3 p-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        />
                        <input 
                          type="text" 
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value)}
                          className="w-full md:flex-1 p-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={handleSaveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Save size={16} /></button>
                          <button onClick={handleCancelEdit} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"><X size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">{reason.reason}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditClick(reason)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(reason.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoppageReasonsPage;
