
import React from 'react';
import { FolderInput, FolderOutput, Save, FolderOpen, AlertCircle, CheckCircle, Moon, Sun, Trash2 } from 'lucide-react';
import { saveDirectoryHandle, getDirectoryHandle, verifyPermission } from '../services/dataService';

interface SettingsProps {
  currentTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onResetData?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ currentTheme, onToggleTheme, onResetData }) => {
  const [exportHandle, setExportHandle] = React.useState<any>(null);
  const [importHandle, setImportHandle] = React.useState<any>(null);
  const [statusMsg, setStatusMsg] = React.useState('');

  React.useEffect(() => {
    loadHandles();
  }, []);

  const loadHandles = async () => {
    try {
      const exp = await getDirectoryHandle('export');
      if (exp) setExportHandle(exp);
      
      const imp = await getDirectoryHandle('import');
      if (imp) setImportHandle(imp);
    } catch (e) {
      console.error("Erro ao carregar configurações", e);
    }
  };

  const pickFolder = async (type: 'import' | 'export') => {
    try {
      // @ts-ignore - File System Access API
      const handle = await window.showDirectoryPicker();
      if (handle) {
        await saveDirectoryHandle(type, handle);
        if (type === 'export') setExportHandle(handle);
        else setImportHandle(handle);
        setStatusMsg(`Pasta de ${type === 'export' ? 'Exportação' : 'Importação'} atualizada com sucesso.`);
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setStatusMsg("Erro: O seu navegador pode não suportar esta funcionalidade.");
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Configurações</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gestão de diretorias e preferências do sistema.</p>
        </div>

        {statusMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            <CheckCircle size={16} /> {statusMsg}
          </div>
        )}
        
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl">
                {currentTheme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Aparência Visual</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {currentTheme === 'dark' ? 'Modo Escuro Ativo' : 'Modo Claro Ativo'} - Altere para reduzir o cansaço visual.
                </p>
              </div>
            </div>
            
            {onToggleTheme && (
                <button
                    onClick={onToggleTheme}
                    className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 ${
                        currentTheme === 'dark' ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                >
                    <span
                        className={`absolute top-1 left-1 bg-white rounded-full w-6 h-6 shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                            currentTheme === 'dark' ? 'translate-x-8' : 'translate-x-0'
                        }`}
                    >
                         {currentTheme === 'dark' ? <Moon size={12} className="text-violet-600"/> : <Sun size={12} className="text-amber-500"/>}
                    </span>
                </button>
            )}
          </div>
        </div>

        {/* Export Folder */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <FolderOutput size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Pasta de Exportação (Backups)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Defina onde os ficheiros de base de dados (.sqlite) serão guardados automaticamente ao clicar em "Exportar BD".
              </p>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => pickFolder('export')}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <FolderOpen size={16} /> Escolher Pasta
                </button>
                
                {exportHandle ? (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800">
                    <CheckCircle size={12} /> Selecionada: {exportHandle.name}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-100 dark:border-amber-800">
                    <AlertCircle size={12} /> Não definida (Usará Downloads)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Import Folder */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FolderInput size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Pasta de Importação</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Defina uma pasta padrão para facilitar a localização de ficheiros Excel e Bases de Dados durante a importação.
              </p>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => pickFolder('import')}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <FolderOpen size={16} /> Escolher Pasta
                </button>

                {importHandle ? (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800">
                    <CheckCircle size={12} /> Selecionada: {importHandle.name}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                    Não definida
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Reset Zone */}
        {onResetData && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <Trash2 size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Limpeza de Dados</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Remover todas as encomendas importadas e reiniciar a base de dados local.
              </p>
              
              <button 
                onClick={onResetData}
                className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} /> Reset Aplicação
              </button>
            </div>
          </div>
        </div>
        )}

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase mb-2">Nota Técnica</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Esta funcionalidade utiliza a <strong>File System Access API</strong>. O navegador pode solicitar permissão de acesso "Ver e Editar" sempre que reiniciar a aplicação por motivos de segurança.
          </p>
        </div>

        <div className="text-right pt-4 pb-2 pr-2">
          <p className="text-[9px] font-medium text-slate-400 dark:text-slate-600">
            aplicação criada e desenvolvida por: Artur Silva
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
