
import { Sector } from './types';
import { 
  Waves, 
  Layers, 
  Droplets, 
  Scissors, 
  Package, 
  Truck 
} from 'lucide-react';

export const SECTORS: (Sector & { icon: any })[] = [
  { id: 'tecelagem', name: 'Tecelagem', orderIndex: 0, icon: Waves },
  { id: 'felpo_cru', name: 'Felpo Cru', orderIndex: 1, icon: Layers },
  { id: 'tinturaria', name: 'Tinturaria', orderIndex: 2, icon: Droplets },
  { id: 'confeccao', name: 'Confecção', orderIndex: 3, icon: Scissors },
  { id: 'embalagem', name: 'Embalagem/Acabamento', orderIndex: 4, icon: Package },
  { id: 'expedicao', name: 'Stock/Expedição', orderIndex: 5, icon: Truck },
];

export const STATUS_COLORS = {
  COMPLETED: 'bg-emerald-500',
  IN_PROGRESS: 'bg-orange-500',
  LATE: 'bg-rose-500',
  NOT_STARTED: 'bg-gray-300',
};

export const SECTOR_COLUMNS: Record<string, string[]> = {
  tecelagem: ['qtyRequested'],
  felpo_cru: ['felpoCruQty'],
  tinturaria: ['tinturariaQty'],
  confeccao: ['confRoupoesQty', 'confFelposQty'],
  embalagem: ['embAcabQty'],
  expedicao: ['stockCxQty'],
};

export const STOP_REASONS_HIERARCHY = [
  {
    category: 'Produção',
    reasons: [
      '1 - aprovação de cor / estampado / urdissagem / desenho',
      '2 - aprovação modelo de confeção',
      '3 - especificação de acessórios',
      '4 - aprovação de acessórios',
      '5 - revisão de quantidades / modelo (anula e substitui)',
      '6 - erros na introdução da encomenda',
      '7 - outro'
    ]
  },
  {
    category: 'Planeamento',
    reasons: [
      '1 - erro de especificação',
      '2 - carga de planeamento',
      '3 - outro'
    ]
  },
  {
    category: 'Prod. Tecido',
    reasons: [
      '1 - atraso de fio (produção interna)',
      '2 - atraso de tecelagem',
      '3 - atraso de acabamentos (tingimento e/ou acabamentos)',
      '4 - atraso por reposição total ou parcial (tecelagem)',
      '5 - atraso por reposição total ou parcial (acabamentos)',
      '6 - trabalho adicional não previsto por não conformidade (revista obrigatória, corte manual, inspeção a 100%, outros)',
      '7 - outro'
    ]
  },
  {
    category: 'Corte / Confeção',
    reasons: [
      '1 - erros de corte',
      '2 - erros de confeção',
      '3 - capacidade de confeção',
      '4 - outro'
    ]
  },
  {
    category: 'Compras',
    reasons: [
      '1 - atraso de fio',
      '2 - atraso de tela',
      '3 - atraso de tecido',
      '4 - atraso de acessórios',
      '5 - outro'
    ]
  },
  {
    category: 'Qualidade',
    reasons: [
      '1 - não conformidade do produto',
      '2 - testes externos',
      '3 - aprovação cliente',
      '4 - outro'
    ]
  },
  {
    category: 'Desenvolvimento',
    reasons: [
      '1 - alteração de especificação (desenho / urdissagem)',
      '2 - outro'
    ]
  }
];

export const STOP_REASONS = STOP_REASONS_HIERARCHY.flatMap(cat => cat.reasons);
