
import React from 'react';
import { FolderInput, FolderOutput, Save, FolderOpen, AlertCircle, CheckCircle, Moon, Sun, Trash2, Users, ShieldCheck, UserPlus, Key, Eye, EyeOff, User as UserIcon, Settings as SettingsIcon, Package, Clock, Layers, ChevronRight, X } from 'lucide-react';
import { saveDirectoryHandle, getDirectoryHandle, verifyPermission, hashPassword } from '../services/dataService';
import { User, PermissionLevel, UserPermissions } from '../types';
import { SECTORS } from '../constants';

interface SettingsProps {
  currentTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onResetData?: () => void;
  users?: User[];
  onSaveUser?: (user: User) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ currentTheme, onToggleTheme, onResetData, users = [], onSaveUser, onDeleteUser }) => {
  const [activeTab, setActiveTab] = React.useState<'general' | 'users'>('general');
  const [exportHandle, setExportHandle] = React.useState<any>(null);
  const [importHandle, setImportHandle] = React.useState<any>(null);
  const [statusMsg, setStatusMsg] = React.useState('');

  // User form state
  const [isUserFormOpen, setIsUserFormOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [formData, setFormData] = React.useState({
    username: '',
    name: '',
    password: '',
    role: 'viewer' as 'admin' | 'viewer',
    permissions: {
        dashboard: 'none',
        orders: 'read',
        timeline: 'read',
        config: 'none',
        stopReasons: 'none',
        sectors: {}
    } as UserPermissions
  });
  const [showPassword, setShowPassword] = React.useState(false);

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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Configurações</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gestão do sistema, utilizadores e preferências.</p>
          </div>

          <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
            <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'general' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                Geral
            </button>
            <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                Utilizadores
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            <CheckCircle size={16} /> {statusMsg}
          </div>
        )}
        
        {activeTab === 'general' ? (
        <>
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
        </>
        ) : (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Gestão de Utilizadores</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Administre quem tem acesso e quais as permissões.</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingUser(null);
                        setFormData({
                            username: '',
                            name: '',
                            password: '',
                            role: 'viewer',
                            permissions: {
                                dashboard: 'none',
                                orders: 'read',
                                timeline: 'read',
                                config: 'none',
                                stopReasons: 'none',
                                sectors: {}
                            }
                        });
                        setIsUserFormOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
                >
                    <UserPlus size={18} /> Adicionar
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {users.map(user => (
                    <div key={user.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-900 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-colors">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    {user.name}
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-black ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        {user.role}
                                    </span>
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <UserIcon size={12} /> {user.username}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <ShieldCheck size={12} /> {Object.values(user.permissions || {}).filter(p => p !== 'none').length + Object.values(user.permissions?.sectors || {}).filter(p => p !== 'none').length} permissões
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setEditingUser(user);
                                    setFormData({
                                        username: user.username,
                                        name: user.name,
                                        password: '', // Não mostrar password antiga
                                        role: user.role,
                                        permissions: user.permissions
                                    });
                                    setIsUserFormOpen(true);
                                }}
                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                title="Editar"
                            >
                                <ChevronRight size={20} />
                            </button>
                            <button
                                onClick={() => {
                                    if(window.confirm(`Tem a certeza que deseja remover o utilizador ${user.name}?`)) {
                                        if (onDeleteUser) onDeleteUser(user.id);
                                    }
                                }}
                                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                title="Remover"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        )}

        <div className="text-right pt-4 pb-2 pr-2">
          <p className="text-[9px] font-medium text-slate-400 dark:text-slate-600">
            aplicação criada e desenvolvida por: Artur Silva
          </p>
        </div>
      </div>

      {/* User Form Modal */}
      {isUserFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <UserPlus size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                            {editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
                        </h2>
                    </div>
                    <button onClick={() => setIsUserFormOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">Login</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={e => setFormData({...formData, username: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="ex: jdoe"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">Nome</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="ex: João Silva"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">Perfil / Role</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as 'admin' | 'viewer'})}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="viewer">Viewer (Leitura/Operador)</option>
                                <option value="admin">Admin (Administrador)</option>
                            </select>
                        </div>
                        <div className="space-y-2 relative">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">
                                Palavra-passe {editingUser && <span className="text-blue-500 normal-case font-medium">(deixe vazio para manter atual)</span>}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck size={18} className="text-blue-500" />
                            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100 tracking-tight">Permissões de Acesso</h3>
                        </div>

                        <div className="space-y-4">
                            {/* Páginas Gerais */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Páginas Principais</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                    {[
                                        { id: 'dashboard', label: 'Dashboard', icon: Package },
                                        { id: 'orders', label: 'Encomendas', icon: Package },
                                        { id: 'timeline', label: 'Timeline', icon: Clock },
                                        { id: 'stopReasons', label: 'Motivos de Paragem', icon: Clock },
                                        { id: 'config', label: 'Configurações', icon: SettingsIcon },
                                    ].map(page => (
                                        <div key={page.id} className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <page.icon size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{page.label}</span>
                                            </div>
                                            <div className="flex bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                {(['none', 'read', 'write'] as PermissionLevel[]).map(level => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            permissions: {
                                                                ...formData.permissions,
                                                                [page.id]: level
                                                            }
                                                        })}
                                                        className={`px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all ${
                                                            formData.permissions[page.id as keyof Omit<UserPermissions, 'sectors'>] === level
                                                            ? (level === 'none' ? 'bg-rose-100 text-rose-600' : level === 'read' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600')
                                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                        }`}
                                                    >
                                                        {level === 'none' ? 'Nenhum' : level === 'read' ? 'Ler' : 'Escrita'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Setores */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Acesso por Sector</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                    {SECTORS.map(sector => (
                                        <div key={sector.id} className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <sector.icon size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{sector.name}</span>
                                            </div>
                                            <div className="flex bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                {(['none', 'read', 'write'] as PermissionLevel[]).map(level => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            permissions: {
                                                                ...formData.permissions,
                                                                sectors: {
                                                                    ...(formData.permissions?.sectors || {}),
                                                                    [sector.id]: level
                                                                }
                                                            }
                                                        })}
                                                        className={`px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all ${
                                                            (formData.permissions?.sectors?.[sector.id] || 'none') === level
                                                            ? (level === 'none' ? 'bg-rose-100 text-rose-600' : level === 'read' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600')
                                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                        }`}
                                                    >
                                                        {level === 'none' ? 'Nenhum' : level === 'read' ? 'Ler' : 'Escrita'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                    <button
                        onClick={() => setIsUserFormOpen(false)}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={async () => {
                            if (!formData.username || !formData.name) {
                                alert("Por favor preencha o login e o nome.");
                                return;
                            }

                            const newUser: User = {
                                id: editingUser?.id || crypto.randomUUID(),
                                username: formData.username,
                                name: formData.name,
                                role: formData.role,
                                permissions: formData.permissions,
                                passwordHash: formData.password
                                    ? await hashPassword(formData.password)
                                    : (editingUser?.passwordHash || await hashPassword(''))
                            };

                            if (onSaveUser) await onSaveUser(newUser);
                            setIsUserFormOpen(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-transform active:scale-95 flex items-center gap-2"
                    >
                        <Save size={18} /> Guardar Utilizador
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
