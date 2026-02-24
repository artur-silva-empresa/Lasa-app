
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { Order, DashboardKPIs } from '../types';
import { calculateKPIs } from '../services/dataService';
import { SECTORS } from '../constants';
import { ActiveFilterType } from './OrderTable';

interface DashboardProps {
  orders: Order[];
  onNavigateToOrders?: (filter: ActiveFilterType) => void;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#64748b'];

const Dashboard: React.FC<DashboardProps> = ({ orders, onNavigateToOrders }) => {
  const kpis = calculateKPIs(orders);

  // Status Data precisa ser ajustado para refletir contagens totais, 
  // mas o KPI de ativas agora é por DOC, aqui mantemos por linha para o gráfico de pizza ser preciso na carga
  const statusData = [
    { name: 'Em Produção', value: kpis.totalInProduction - kpis.totalLate }, 
    { name: 'Atrasadas', value: kpis.totalLate },
    { name: 'Concluídas', value: orders.filter(o => o.qtyOpen === 0).length },
  ];

  const sectorLoadData = React.useMemo(() => {
    const load = {
      tecelagem: 0,
      felpo_cru: 0,
      tinturaria: 0,
      confeccao: 0,
      embalagem: 0,
      expedicao: 0
    };

    orders.forEach(order => {
      const qReq = order.qtyRequested || 0;
      if (qReq <= 0) return;

      const pTecelagem = order.felpoCruQty || 0;
      const pFelpoCru = order.felpoCruQty || 0; 
      const pTinturaria = order.tinturariaQty || 0;
      const pConfeccao = (order.confRoupoesQty || 0) + (order.confFelposQty || 0);
      const pEmbalagem = order.embAcabQty || 0;
      const pExpedicao = order.stockCxQty || 0;

      load.tecelagem += Math.max(0, qReq - pTecelagem);
      load.felpo_cru += Math.max(0, qReq - pFelpoCru);
      load.tinturaria += Math.max(0, qReq - pTinturaria);
      load.confeccao += Math.max(0, qReq - pConfeccao);
      load.embalagem += Math.max(0, qReq - pEmbalagem);
      load.expedicao += Math.max(0, qReq - pExpedicao);
    });

    return [
      { name: 'Tecelagem', value: load.tecelagem, color: '#3b82f6' },
      { name: 'Felpo Cru', value: load.felpo_cru, color: '#6366f1' },
      { name: 'Tinturaria', value: load.tinturaria, color: '#8b5cf6' },
      { name: 'Confecção', value: load.confeccao, color: '#d946ef' },
      { name: 'Embalagem', value: load.embalagem, color: '#ec4899' },
      { name: 'Expedição', value: load.expedicao, color: '#14b8a6' },
    ];
  }, [orders]);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 scroll-smooth">
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-4">
        <div className="flex flex-col gap-1 px-1">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white transition-colors">Resumo de Produção</h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Indicadores de desempenho e carga fabril em tempo real.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <KPICard 
            title="Encomendas Ativas" 
            value={kpis.totalActiveDocs} 
            subtitle="Documentos em carteira"
            icon={<TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />}
            color="blue"
            // Não clicável ou leva para todas (opcional, deixei sem clique pois não foi pedido especificamente para este)
          />
          <KPICard 
            title="Encomendas Atrasadas" 
            value={kpis.totalLate} 
            subtitle="Qualquer sector"
            icon={<AlertCircle size={16} className="text-rose-600 dark:text-rose-400" />}
            color="rose"
            onClick={() => onNavigateToOrders?.('LATE')}
            isClickable
          />
          <KPICard 
            title="Entregas Semana" 
            value={kpis.deliveriesThisWeek} 
            subtitle="Previstas para esta semana"
            icon={<Calendar size={16} className="text-amber-600 dark:text-amber-400" />}
            color="amber"
            onClick={() => onNavigateToOrders?.('WEEK_DELIVERIES')}
            isClickable
          />
          <KPICard 
            title="Conclusão Semana" 
            value={`${kpis.fulfillmentRateWeek.toFixed(0)}%`} 
            subtitle="Executadas esta semana"
            icon={<CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />}
            color="emerald"
            onClick={() => onNavigateToOrders?.('WEEK_COMPLETED')}
            isClickable
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Gráfico Horizontal de Carga por Sector */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
            <h3 className="font-black text-slate-700 dark:text-slate-200 text-xs uppercase tracking-widest mb-1">Carga por Sector (Em Falta)</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4">Total de peças que ainda faltam produzir em cada secção (Base: Quantidade Pedida).</p>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={sectorLoadData} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} 
                    width={80}
                  />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#f1f5f9' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value: number) => [value.toLocaleString('pt-PT'), 'Peças em Falta']}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 4, 4, 0]} 
                    barSize={24}
                    name="Peças em Falta"
                  >
                    {sectorLoadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Pizza de Estados */}
          <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
            <h3 className="font-black text-slate-700 dark:text-slate-200 text-xs uppercase tracking-widest mb-4">Distribuição por Estado</h3>
            <div className="h-[250px] w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={statusData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#f1f5f9' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{fontSize: '10px', fontWeight: 'bold', color: '#94a3b8'}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subtitle, icon, color, onClick, isClickable }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800'
  };

  return (
    <div 
      onClick={isClickable ? onClick : undefined}
      className={`p-4 md:p-6 rounded-2xl border ${colors[color]} shadow-sm transition-all hover:shadow-md ${isClickable ? 'cursor-pointer hover:scale-[1.02] active:scale-95' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">{icon}</div>
      </div>
      <div>
        <h2 className="text-2xl md:text-3xl font-black leading-none mb-1 dark:text-white">{typeof value === 'number' ? value.toLocaleString('pt-PT') : value}</h2>
        <p className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-90">{title}</p>
        {subtitle && <p className="text-[10px] opacity-70 mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};

export default Dashboard;
