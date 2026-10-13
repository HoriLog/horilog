export interface DevolutionReason {
  code: number;
  description: string;
  responsibility: 'Logística' | 'Vendas' | 'Mercado' | 'Risco';
}

export const devolutionReasons: DevolutionReason[] = [
  { code: 11, description: 'Risco Externo', responsibility: 'Risco' },
  { code: 23, description: 'Pedidos Duplicados', responsibility: 'Vendas' },
  { code: 50, description: 'Carga Errada Armazém', responsibility: 'Logística' },
  { code: 53, description: 'Produto Próximo Vencimento Comercial', responsibility: 'Logística' },
  { code: 55, description: 'Qualidade do Produto', responsibility: 'Logística' },
  { code: 60, description: 'Preço Errado', responsibility: 'Vendas' },
  { code: 61, description: 'Prazo Errado', responsibility: 'Vendas' },
  { code: 62, description: 'Forma de Pagamento Errada', responsibility: 'Vendas' },
  { code: 63, description: 'Produto / Qtde. Errada', responsibility: 'Vendas' },
  { code: 64, description: 'Sem Vasilhame', responsibility: 'Vendas' },
  { code: 65, description: 'Não Fez Pedido', responsibility: 'Vendas' },
  { code: 68, description: 'Troca (Sem Selo / Qtde. Errada)', responsibility: 'Vendas' },
  { code: 70, description: 'Cliente Cancelou', responsibility: 'Mercado' },
  { code: 71, description: 'Sem Dinheiro / Cheque', responsibility: 'Mercado' },
  { code: 72, description: 'PDV Fechado (Horário Comercial)', responsibility: 'Mercado' },
  { code: 74, description: 'Local de Armazenagem Inadequado', responsibility: 'Mercado' },
  { code: 80, description: 'Caminhão Quebrado / Acidente', responsibility: 'Logística' },
  { code: 81, description: 'Produto Danificado / Falta', responsibility: 'Logística' },
  { code: 82, description: 'Endereço Não Encontrado', responsibility: 'Logística' },
  { code: 83, description: 'Proprietário Ausente', responsibility: 'Mercado' },
  { code: 85, description: 'Difícil Acesso', responsibility: 'Logística' },
  { code: 86, description: 'Horário de Entrega', responsibility: 'Logística' },
  { code: 87, description: 'Tempo Insuficiente', responsibility: 'Logística' },
  { code: 89, description: 'PDV Fechado Após Horário', responsibility: 'Logística' },
  { code: 92, description: 'Caminhão Assaltado', responsibility: 'Logística' },
  { code: 93, description: 'Devolução de Comodato', responsibility: 'Vendas' },
];