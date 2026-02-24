
import React from 'react';
import { X, Upload, FileCheck, Loader2, AlertCircle, Database, ExternalLink, Merge, FileSpreadsheet, FolderOpen } from 'lucide-react';
import { parseDataFile, getDirectoryHandle, verifyPermission } from '../services/dataService';
import { Order } from '../types';

interface ImportModalProps {
  onClose: () => void;
  onImport: (baseData: { orders: Order[], headers: Record<string, string> } | null, newData: { orders: Order[], headers: Record<string, string> } | null) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const [fileBase, setFileBase] = React.useState<File | null>(null);
  const [fileNew, setFileNew] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [folderFiles, setFolderFiles] = React.useState<{name: string, handle: any}[]>([]);
  const [hasImportFolder, setHasImportFolder] = React.useState(false);

  React.useEffect(() => {
    checkImportFolder();
  }, []);

  const checkImportFolder = async () => {
    try {
      const handle = await getDirectoryHandle('import');
      if (handle) {
        setHasImportFolder(true);
        if (await verifyPermission(handle, false)) {
            listFiles(handle);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const listFiles = async (dirHandle: any) => {
    const files = [];
    try {
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && (entry.name.endsWith('.xlsx') || entry.name.endsWith('.sqlite'))) {
          files.push({ name: entry.name, handle: entry });
        }
      }
      setFolderFiles(files.sort((a,b) => b.name.localeCompare(a.name))); // Mais recentes primeiro
    } catch (e) {
      console.error("Erro ao listar ficheiros", e);
    }
  };

  const requestFolderAccess = async () => {
    const handle = await getDirectoryHandle('import');
    if (handle) {
        if (await verifyPermission(handle, false)) {
            listFiles(handle);
        }
    }
  };

  const handleFileFromFolder = async (fileEntry: {name: string, handle: any}) => {
    try {
      const file = await fileEntry.handle.getFile();
      if (file.name.endsWith('.sqlite') || file.name.endsWith('.db')) {
        setFileBase(file);
      } else if (file.name.endsWith('.xlsx')) {
        setFileNew(file);
      }
    } catch (e) {
      setError("Erro ao ler ficheiro da pasta.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'base' | 'new') => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (type === 'base') {
          if (file.name.endsWith('.sqlite') || file.name.endsWith('.db')) {
              setFileBase(file);
          } else {
              setError('Para a Base de Dados, utilize ficheiros .sqlite ou .db');
          }
      } else {
          if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
              setFileNew(file);
          } else {
              setError('Para novos dados externos, utilize ficheiros Excel (.xlsx)');
          }
      }
    }
  };

  const handleSubmit = async () => {
    if (!fileBase && !fileNew) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      let baseData = null;
      let newData = null;

      if (fileBase) {
        baseData = await parseDataFile(fileBase);
      }

      if (fileNew) {
        newData = await parseDataFile(fileNew);
      }

      onImport(baseData, newData);
    } catch (err) {
      console.error(err);
      setError('Erro ao processar os ficheiros. Verifique se os formatos estão corretos.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Sincronização de Dados</h2>
            <p className="text-xs text-slate-500 font-medium">Fusão de Base de Dados SQLite com Excel Externo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-700 animate-in fade-in duration-200 mb-6">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Esquerda: Upload Manual */}
            <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    {/* Slot 1: Base de Dados SQLite */}
                    <div className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col h-full ${fileBase ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${fileBase ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                            <Database size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">Base de Dados (SQLite)</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-4 flex-1 leading-tight">Carregue o ficheiro .sqlite para manter histórico.</p>
                        
                        <label className="block mt-auto">
                            <div className={`cursor-pointer py-3 px-4 rounded-xl border text-center text-xs font-bold uppercase tracking-wider transition-all ${fileBase ? 'bg-white border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                            {fileBase ? <span className="flex items-center justify-center gap-2"><FileCheck size={14}/> {fileBase.name}</span> : 'Selecionar .sqlite'}
                            </div>
                            <input type="file" className="hidden" accept=".sqlite,.db" onChange={(e) => handleFileChange(e, 'base')} />
                        </label>
                    </div>

                    {/* Slot 2: Novos Dados Excel */}
                    <div className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col h-full ${fileNew ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${fileNew ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                            <FileSpreadsheet size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">Novos Dados (Excel)</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-4 flex-1 leading-tight">Ficheiro .xlsx com novas encomendas.</p>
                        
                        <label className="block mt-auto">
                            <div className={`cursor-pointer py-3 px-4 rounded-xl border text-center text-xs font-bold uppercase tracking-wider transition-all ${fileNew ? 'bg-white border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                            {fileNew ? <span className="flex items-center justify-center gap-2"><FileCheck size={14}/> {fileNew.name}</span> : 'Selecionar .xlsx'}
                            </div>
                            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={(e) => handleFileChange(e, 'new')} />
                        </label>
                    </div>
                </div>
            </div>

            {/* Direita: Pasta Definida */}
            {hasImportFolder && (
                <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><FolderOpen size={16}/> Pasta Rápida</h3>
                        <button onClick={requestFolderAccess} className="text-[10px] uppercase font-bold text-blue-600 hover:underline">Atualizar</button>
                    </div>
                    
                    <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-2 overflow-y-auto max-h-[200px] lg:max-h-[300px]">
                        {folderFiles.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center min-h-[100px]">
                                <p className="text-xs">Nenhum ficheiro compatível encontrado ou acesso pendente.</p>
                                <button onClick={requestFolderAccess} className="mt-2 text-xs text-blue-500 font-bold">Permitir Acesso</button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {folderFiles.map((f, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleFileFromFolder(f)}
                                        className="w-full text-left p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all group border border-transparent hover:border-slate-200"
                                    >
                                        <div className="flex items-start gap-2">
                                            {f.name.endsWith('.sqlite') ? <Database size={14} className="mt-0.5 text-emerald-500"/> : <FileSpreadsheet size={14} className="mt-0.5 text-blue-500"/>}
                                            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 break-all leading-tight">{f.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

          </div>
          
          <div className="mt-6 bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
             <Merge size={24} className="text-amber-600 shrink-0" />
             <div>
                <h4 className="text-amber-800 text-xs font-bold uppercase tracking-wider mb-1">Nota de Fusão</h4>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  O sistema irá cruzar os dados usando o <strong>Nr. Documento e Item</strong>. As observações do SQLite serão preservadas.
                </p>
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition-colors text-xs uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={(!fileBase && !fileNew) || isProcessing}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 text-xs uppercase tracking-widest flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                A Processar...
              </>
            ) : (
              'Iniciar Processamento'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
