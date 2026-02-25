
import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrderTable, { ActiveFilterType } from './components/OrderTable';
import OrderTimeline from './components/OrderTimeline';
import OrderDetails from './components/OrderDetails';
import ImportModal from './components/ImportModal';
import Settings from './components/Settings';
import StopReasons from './components/StopReasons';
import Login from './components/Login';
import { Order, User } from './types';
import { generateMockOrders, loadOrdersFromDB, saveOrdersToDB, clearOrdersFromDB, loadStopReasonsFromDB, saveStopReasonsToDB, loadUsersFromDB, initializeDefaultUsers, saveUserToDB, deleteUserFromDB } from './services/dataService';
import { WifiOff, CheckCircle2, X, Download, Loader2 } from 'lucide-react';
import { SECTORS, STOP_REASONS_HIERARCHY } from './constants';

import SectorOrderTable from './components/SectorOrderTable';

const App: React.FC = () => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [stopReasons, setStopReasons] = React.useState<any[]>(STOP_REASONS_HIERARCHY);
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeView, setActiveView] = React.useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [excelHeaders, setExcelHeaders] = React.useState<Record<string, string>>({});
  
  // Auth State
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  
  // Theme State
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  // Estado para controlo de filtros vindos do dashboard
  const [activeDashboardFilter, setActiveDashboardFilter] = React.useState<ActiveFilterType>(null);
  
  // PWA Installation support
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);

  // Estado para notificações do sistema
  const [notification, setNotification] = React.useState<{message: string, type: 'success' | 'info'} | null>(null);

  React.useEffect(() => {
    // Theme Initialization
    const savedTheme = localStorage.getItem('texflow-theme') as 'light' | 'dark';
    if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
        // Default to Light mode if no preference saved
        setTheme('light');
        document.documentElement.classList.remove('dark');
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Monitor network status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('texflow-theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Utilizador aceitou a instalação');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // Auto-dismiss notification
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Initialize from IndexedDB
  React.useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const [savedData, savedStopReasons, initialUsers] = await Promise.all([
          loadOrdersFromDB(),
          loadStopReasonsFromDB(),
          initializeDefaultUsers()
        ]);
        
        if (savedData && savedData.orders.length > 0) {
          setOrders(savedData.orders);
          setExcelHeaders(savedData.headers);
        } else {
          // Iniciar vazio se não houver dados
          setOrders([]);
        }

        if (savedStopReasons) {
          setStopReasons(savedStopReasons);
        }

        if (initialUsers) {
          setUsers(initialUsers);
        }
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // Save to IndexedDB whenever orders change (Debounced to avoid excessive writes)
  React.useEffect(() => {
    if (orders.length > 0 && !isLoading) {
      const timer = setTimeout(() => {
          saveOrdersToDB(orders, excelHeaders).catch(err => console.error("Erro ao guardar dados:", err));
      }, 1000); // Wait 1s after last change before saving
      return () => clearTimeout(timer);
    }
  }, [orders, excelHeaders, isLoading]);

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };
  
  // Função para atualizar prioridade em lote (por Nr Doc)
  const handleUpdatePriority = (docNr: string, priority: number) => {
    setOrders(prev => prev.map(o => {
        // Atualiza todos os itens que partilham o mesmo número de documento
        if (o.docNr === docNr) {
            return { ...o, priority };
        }
        return o;
    }));
  };

  // Função para atualizar flag manual em lote (por Nr Doc)
  const handleUpdateManual = (docNr: string, isManual: boolean) => {
    setOrders(prev => prev.map(o => {
        // Atualiza todos os itens que partilham o mesmo número de documento
        if (o.docNr === docNr) {
            return { ...o, isManual };
        }
        return o;
    }));
  };

  // Função para atualizar motivo de paragem em lote (por Nr Doc)
  const handleUpdateStopReason = (docNr: string, sectorId: string, stopReason: string) => {
    setOrders(prev => prev.map(o => {
        if (o.docNr === docNr) {
            const sectorStopReasons = { ...(o.sectorStopReasons || {}), [sectorId]: stopReason };
            return { ...o, sectorStopReasons };
        }
        return o;
    }));
  };

  const handleUpdateStopReasonsHierarchy = (newHierarchy: any[]) => {
    setStopReasons(newHierarchy);
    saveStopReasonsToDB(newHierarchy).catch(err => console.error("Erro ao guardar motivos:", err));
  };

  const handleSaveUser = async (user: User) => {
    await saveUserToDB(user);
    const updatedUsers = await loadUsersFromDB();
    setUsers(updatedUsers);
    setNotification({ message: 'Utilizador guardado com sucesso.', type: 'success' });
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUserFromDB(userId);
    const updatedUsers = await loadUsersFromDB();
    setUsers(updatedUsers);
    setNotification({ message: 'Utilizador removido com sucesso.', type: 'success' });
  };

  const handleImport = (
    baseData: { orders: Order[], headers: Record<string, string> } | null, 
    newData: { orders: Order[], headers: Record<string, string> } | null
  ) => {
    let finalOrders: Order[] = [];
    let finalHeaders: Record<string, string> = {};
    let message = "";

    if (baseData && !newData) {
      finalOrders = baseData.orders;
      finalHeaders = baseData.headers;
      message = `Base de dados carregada com ${finalOrders.length} registos.`;
    } else if (newData && !baseData) {
      finalOrders = newData.orders;
      finalHeaders = newData.headers;
      message = `Dados importados com ${finalOrders.length} registos novos.`;
    } else if (baseData && newData) {
      const mergedMap = new Map<string, Order>();
      let addedCount = 0;
      let updatedCount = 0;

      const getCompositeKey = (o: Order) => `${o.docNr}-${o.itemNr}`;

      baseData.orders.forEach(o => {
        if (o.docNr) mergedMap.set(getCompositeKey(o), o);
      });
      
      newData.orders.forEach(newOrder => {
        if (!newOrder.docNr) return;
        const key = getCompositeKey(newOrder);
        const existing = mergedMap.get(key);
        
        if (existing) {
          updatedCount++;
          mergedMap.set(key, {
            ...newOrder,
            id: existing.id,
            priority: existing.priority, // Manter prioridade existente
            isManual: existing.isManual, // Manter flag manual existente
            sectorObservations: existing.sectorObservations || {},
            sectorPredictedDates: existing.sectorPredictedDates || {},
            sectorStopReasons: existing.sectorStopReasons || {}
          });
        } else {
          addedCount++;
          mergedMap.set(key, newOrder);
        }
      });
      
      finalOrders = Array.from(mergedMap.values());
      finalHeaders = { ...baseData.headers, ...newData.headers };
      message = `Importação concluída: ${addedCount} novas linhas adicionadas e ${updatedCount} atualizadas.`;
    }

    setOrders(finalOrders);
    setExcelHeaders(finalHeaders);
    setIsImportModalOpen(false);
    setNotification({ message, type: 'success' });
    setActiveView('orders');
    
    // Force immediate save after import
    saveOrdersToDB(finalOrders, finalHeaders);
  };
  
  const handleResetData = async () => {
    if (window.confirm("ATENÇÃO: Tem a certeza que deseja apagar todos os dados?\n\nEsta ação irá limpar a base de dados local e remover todas as encomendas importadas.")) {
        setIsLoading(true);
        try {
            await clearOrdersFromDB();
            setOrders([]); 
            setExcelHeaders({});
            setNotification({ message: 'Dados da aplicação limpos com sucesso.', type: 'success' });
        } catch (error) {
            console.error(error);
            setNotification({ message: 'Erro ao limpar dados.', type: 'info' });
        } finally {
            setIsLoading(false);
        }
    }
  };

  const selectedOrder = React.useMemo(() => 
    orders.find(o => o.id === selectedOrderId) || null
  , [orders, selectedOrderId]);

  const handleViewDetails = React.useCallback((order: Order) => {
    setSelectedOrderId(order.id);
  }, []);
  
  // Função chamada pelo Dashboard ao clicar num cartão
  const handleNavigateToOrders = (filter: ActiveFilterType) => {
      setActiveDashboardFilter(filter);
      setActiveView('orders');
  };
  
  const getFirstAvailableView = (user: User | null): string => {
    if (!user || !user.permissions) return 'login';

    const perms = user.permissions;
    if (perms.dashboard && perms.dashboard !== 'none') return 'dashboard';
    if (perms.orders && perms.orders !== 'none') return 'orders';
    if (perms.timeline && perms.timeline !== 'none') return 'timeline';

    const sectors = perms.sectors || {};
    const firstSector = SECTORS.find(s => sectors[s.id] && sectors[s.id] !== 'none');
    if (firstSector) return `sector-${firstSector.id}`;

    if ((perms.config && perms.config !== 'none') || (perms.stopReasons && perms.stopReasons !== 'none')) return 'config';

    return 'none';
  };

  // Reset do filtro ao mudar de vista manualmente
  const handleSetActiveView = (view: string) => {
      if (view !== 'orders') setActiveDashboardFilter(null);
      setActiveView(view);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 dark:text-slate-500">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p className="text-sm font-medium">A carregar a sua produção...</p>
        </div>
      );
    }

    if (activeView.startsWith('sector-')) {
        const sectorId = activeView.replace('sector-', '');
        const sector = SECTORS.find(s => s.id === sectorId);

        // Permission Check
        const sectors = currentUser?.permissions?.sectors || {};
        const permission = sectors[sectorId] || 'none';
        if (permission === 'none') {
            const nextView = getFirstAvailableView(currentUser);
            if (nextView !== activeView) {
                setActiveView(nextView);
            }
            return null;
        }

        return (
            <div className="flex flex-col h-full">
                <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        {sector?.icon && React.createElement(sector.icon, { size: 24 })}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Sector: {sector?.name}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Listagem de encomendas</p>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <SectorOrderTable 
                        orders={orders} 
                        sector={sector!}
                        onViewDetails={handleViewDetails} 
                        onUpdateOrder={handleUpdateOrder}
                        stopReasonsHierarchy={stopReasons}
                        user={currentUser}
                    />
                </div>
            </div>
        );
    }

    switch (activeView) {
      case 'dashboard':
        if (!currentUser?.permissions?.dashboard || currentUser?.permissions?.dashboard === 'none') {
            const fallback = getFirstAvailableView(currentUser);
            if (fallback !== 'dashboard') { setActiveView(fallback); return null; }
        }
        return <Dashboard orders={orders} onNavigateToOrders={handleNavigateToOrders} />;
      case 'orders':
        if (!currentUser?.permissions?.orders || currentUser?.permissions?.orders === 'none') {
            const fallback = getFirstAvailableView(currentUser);
            if (fallback !== 'orders') { setActiveView(fallback); return null; }
        }
        return <OrderTable 
          orders={orders} 
          onViewDetails={handleViewDetails} 
          excelHeaders={excelHeaders} 
          activeFilter={activeDashboardFilter}
          user={currentUser} 
          onUpdatePriority={handleUpdatePriority}
          onUpdateManual={handleUpdateManual}
          onUpdateStopReason={handleUpdateStopReason}
          stopReasonsHierarchy={stopReasons}
        />;
      case 'timeline':
        if (!currentUser?.permissions?.timeline || currentUser?.permissions?.timeline === 'none') {
            const fallback = getFirstAvailableView(currentUser);
            if (fallback !== 'timeline') { setActiveView(fallback); return null; }
        }
        return <OrderTimeline orders={orders} onViewDetails={handleViewDetails} />;
      case 'config':
        const hasConfigPerm = currentUser?.permissions?.config && currentUser?.permissions?.config !== 'none';
        const hasStopPerm = currentUser?.permissions?.stopReasons && currentUser?.permissions?.stopReasons !== 'none';
        if (!hasConfigPerm && !hasStopPerm) {
            const fallback = getFirstAvailableView(currentUser);
            if (fallback !== 'config') { setActiveView(fallback); return null; }
        }
        return (
          <Settings
            currentTheme={theme}
            onToggleTheme={toggleTheme}
            onResetData={handleResetData}
            users={users}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      case 'stop-reasons':
        return <StopReasons hierarchy={stopReasons} onUpdateHierarchy={handleUpdateStopReasonsHierarchy} />;
      case 'none':
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <X size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Acesso Restrito</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs">Não tem permissões para visualizar nenhuma página do sistema. Contacte o administrador.</p>
                <button
                    onClick={() => setCurrentUser(null)}
                    className="mt-6 text-blue-600 font-bold hover:underline"
                >
                    Voltar ao Login
                </button>
            </div>
        );
      default:
        return <Dashboard orders={orders} />;
    }
  };

  const alertCount = React.useMemo(() => orders.filter(o => {
    const now = new Date();
    return o.requestedDate && o.requestedDate < now && o.qtyOpen > 0;
  }).length, [orders]);

  // Se não estiver logado, mostra apenas o Login
  if (!currentUser) {
    return (
      <Login onLogin={(user) => {
        setCurrentUser(user);

        // Determinar vista inicial baseada em permissões
        let initialView = user.role === 'admin' ? 'dashboard' : 'orders';

        // Validar se tem permissão para a vista inicial
        const perms: any = user.permissions;
        if (perms[initialView] === 'none') {
            initialView = getFirstAvailableView(user);
        }

        setActiveView(initialView);
      }} />
    );
  }

  return (
    <>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 flex items-center justify-center gap-2 z-[120] animate-in slide-in-from-top duration-300 safe-top">
          <WifiOff size={12} />
          Modo Offline Ativo - A utilizar dados locais
        </div>
      )}

      {showInstallBanner && (
        <div className="fixed bottom-20 md:bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 z-[110] animate-in slide-in-from-bottom duration-500">
          <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-2xl shadow-2xl border border-blue-500 dark:border-blue-600 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg"><Download size={20} /></div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-tight">Instalar TexFlow</h4>
                <p className="text-[10px] opacity-80 leading-tight">Aceda mais rápido e trabalhe offline.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleInstallClick} className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-transform active:scale-95">Instalar</button>
              <button onClick={() => setShowInstallBanner(false)} className="p-1 hover:bg-white/10 rounded-full"><X size={16}/></button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed top-6 right-6 z-[115] animate-in slide-in-from-right duration-300 max-w-md">
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-start gap-4 border border-slate-700 dark:border-slate-800">
                <div className="bg-emerald-500 rounded-full p-1 mt-0.5 shrink-0 text-slate-900">
                    <CheckCircle2 size={16} strokeWidth={3} />
                </div>
                <div>
                    <h4 className="font-bold text-sm mb-1">Sucesso</h4>
                    <p className="text-sm text-slate-300 font-medium leading-snug">{notification.message}</p>
                </div>
                <button 
                    onClick={() => setNotification(null)}
                    className="ml-2 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
      )}

      <Layout 
        activeView={activeView} 
        setActiveView={handleSetActiveView} 
        onImportClick={() => setIsImportModalOpen(true)}
        alertCount={alertCount}
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
      >
        {renderContent()}
      </Layout>

      {selectedOrder && (
        <OrderDetails 
          order={selectedOrder} 
          onClose={() => setSelectedOrderId(null)}
          onUpdateOrder={handleUpdateOrder}
          user={currentUser}
          stopReasonsHierarchy={stopReasons}
        />
      )}

      {isImportModalOpen && (
        <ImportModal 
          onClose={() => setIsImportModalOpen(false)} 
          onImport={handleImport} 
        />
      )}
    </>
  );
};

export default App;
