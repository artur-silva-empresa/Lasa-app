import { StoppageReason } from '../types';

export const INITIAL_STOPPAGE_REASONS: StoppageReason[] = [
  // PRODUÇÃO
  { id: 'prod-1', type: 'PRODUÇÃO', reason: 'aprovação de cor / estampado / urdido / desenho' },
  { id: 'prod-2', type: 'PRODUÇÃO', reason: 'aprovação modelo de confeção' },
  { id: 'prod-3', type: 'PRODUÇÃO', reason: 'especificação de acessórios' },
  { id: 'prod-4', type: 'PRODUÇÃO', reason: 'aprovação de acessórios' },
  { id: 'prod-5', type: 'PRODUÇÃO', reason: 'revisão de quantidades / modelos (anula e substitui)' },
  { id: 'prod-6', type: 'PRODUÇÃO', reason: 'erros na Introdução da encomenda' },

  // PLANEAMENTO
  { id: 'plan-1', type: 'PLANEAMENTO', reason: 'erro de especificação' },
  { id: 'plan-2', type: 'PLANEAMENTO', reason: 'carga de planeamento' },

  // PROD. TECIDO
  { id: 'tec-1', type: 'PROD. TECIDO', reason: 'atraso de fio (produção interna)' },
  { id: 'tec-2', type: 'PROD. TECIDO', reason: 'atraso de tecelagem' },
  { id: 'tec-3', type: 'PROD. TECIDO', reason: 'atraso de acabamentos (tingimento e/ou acabamentos)' },
  { id: 'tec-4', type: 'PROD. TECIDO', reason: 'atraso por reposição total ou parcial (acabamentos)' },
  { id: 'tec-5', type: 'PROD. TECIDO', reason: 'atraso por reposição total ou parcial (tecelagem)' },
  { id: 'tec-6', type: 'PROD. TECIDO', reason: 'trabalho adicional não previsto por não conformidade (revista obrigatória, corte manual, inspeção a 100%)' },

  // CORTE/CONFEÇÃO
  { id: 'conf-1', type: 'CORTE/CONFEÇÃO', reason: 'erros de corte' },
  { id: 'conf-2', type: 'CORTE/CONFEÇÃO', reason: 'erros de confeção' },
  { id: 'conf-3', type: 'CORTE/CONFEÇÃO', reason: 'capacidade de confeção' },

  // COMPRAS
  { id: 'comp-1', type: 'COMPRAS', reason: 'atraso de fio' },
  { id: 'comp-2', type: 'COMPRAS', reason: 'atraso de tela' },
  { id: 'comp-3', type: 'COMPRAS', reason: 'atraso de tecido' },
  { id: 'comp-4', type: 'COMPRAS', reason: 'atraso de acessórios' },

  // QUALIDADE
  { id: 'qual-1', type: 'QUALIDADE', reason: 'não conformidade do produto' },
  { id: 'qual-2', type: 'QUALIDADE', reason: 'testes externos' },

  // DESENVOLVIMENTO
  { id: 'dev-1', type: 'DESENVOLVIMENTO', reason: 'alteração de especificação (desenho/urdido)' },
];
