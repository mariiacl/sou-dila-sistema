// ============================================
// SOU DILA — Lógica do Dashboard
// ============================================

// -------- HELPERS --------
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
}

// -------- CARREGAR DADOS DO DASHBOARD --------
async function carregarDashboard() {
  // Define período: do dia 1 do mês atual até hoje
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const inicioISO = inicioMes.toISOString();

  // Busca vendas do mês
  const { data: vendas, error } = await sb
    .from('vendas')
    .select('total, custo_total, lucro_bruto, data_venda, status')
    .gte('data_venda', inicioISO);

  if (error) {
    console.error('Erro ao buscar vendas:', error);
    return;
  }

  const lista = vendas || [];

  // Calcula totais
  const faturamento = lista.reduce((s, v) => s + Number(v.total || 0), 0);
  const custos      = lista.reduce((s, v) => s + Number(v.custo_total || 0), 0);
  const lucro       = lista.reduce((s, v) => s + Number(v.lucro_bruto || 0), 0);
  const qtdVendas   = lista.length;

  // Atualiza cards (só se os elementos existirem na página)
  const cardFaturamento = document.getElementById('card-faturamento');
  const cardVendas      = document.getElementById('card-vendas');
  const cardCustos      = document.getElementById('card-custos');
  const cardLucro       = document.getElementById('card-lucro');

  if (cardFaturamento) cardFaturamento.textContent = formatarMoeda(faturamento);
  if (cardVendas)      cardVendas.textContent      = qtdVendas;
  if (cardCustos)      cardCustos.textContent      = formatarMoeda(custos);
  if (cardLucro)       cardLucro.textContent       = formatarMoeda(lucro);
}

// -------- INICIALIZAÇÃO --------
// Só carrega se estiver na página do dashboard
if (document.getElementById('card-faturamento')) {
  // Aguarda um tiquinho para garantir que a sessão já foi validada pelo auth.js
  setTimeout(carregarDashboard, 300);
}
