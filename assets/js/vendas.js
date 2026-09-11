// ============================================
// SOU DILA — Lógica da tela de Vendas
// Parte 1: Listagem e resumo do mês
// ============================================

// -------- ELEMENTOS --------
const listaVendas      = document.getElementById('lista-vendas');
const contadorVendas   = document.getElementById('contador-vendas');
const resumoFaturamento= document.getElementById('resumo-faturamento');
const resumoQtd        = document.getElementById('resumo-qtd');
const resumoCustos     = document.getElementById('resumo-custos');
const resumoLucro      = document.getElementById('resumo-lucro');
const btnNovaVenda     = document.getElementById('btn-nova-venda');

// -------- ESTADO --------
let vendasCache = [];
let clientesCache = [];

// -------- HELPERS --------
function formatarMoedaVenda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
}

function escaparHtmlVenda(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatarDataVenda(dataISO) {
  if (!dataISO) return '—';
  const d = new Date(dataISO);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function nomeStatus(status) {
  const mapa = {
    'orcamento': 'Orçamento',
    'pedido':    'Pedido',
    'pago':      'Pago',
    'producao':  'Em produção',
    'enviado':   'Enviado',
    'entregue':  'Entregue',
    'cancelado': 'Cancelado'
  };
  return mapa[status] || status || '—';
}

// -------- CARREGAR CLIENTES (para mostrar nome) --------
async function carregarClientesVendas() {
  const { data } = await sb.from('clientes').select('id, nome');
  clientesCache = data || [];
}

// -------- CARREGAR VENDAS --------
async function carregarVendas() {
  listaVendas.innerHTML = '<p class="vazio">Carregando...</p>';

  const { data, error } = await sb
    .from('vendas')
    .select('id, numero, cliente_id, data_venda, total, custo_total, lucro_bruto, status, observacoes, created_at')
    .order('data_venda', { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    listaVendas.innerHTML = '<p class="vazio">Erro ao carregar vendas.</p>';
    return;
  }

  vendasCache = data || [];

  // Atualiza contador
  contadorVendas.textContent = `${vendasCache.length} venda${vendasCache.length === 1 ? '' : 's'}`;

  // Calcula resumo do mês
  calcularResumoMes();

  // Se vazio, mostra mensagem
  if (vendasCache.length === 0) {
    listaVendas.innerHTML = '<p class="vazio">Nenhuma venda registrada ainda. Clique em "+ Nova Venda" para começar.</p>';
    return;
  }

  // Monta tabela
  const tabela = document.createElement('table');
  tabela.className = 'lista-clientes-tabela tabela-vendas';

  tabela.innerHTML = `
    <thead>
      <tr>
        <th class="col-numero">Nº</th>
        <th class="col-data">Data</th>
        <th>Cliente</th>
        <th class="col-status">Status</th>
        <th class="col-total">Total</th>
        <th class="col-acoes">Ações</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = tabela.querySelector('tbody');

  vendasCache.forEach(v => {
    const cliente = v.cliente_id
      ? clientesCache.find(c => c.id === v.cliente_id)
      : null;

    const nomeCliente = cliente
      ? `<span class="venda-cliente">${escaparHtmlVenda(cliente.nome)}</span>`
      : `<span class="venda-cliente avulso">Venda avulsa</span>`;

    const status = v.status || 'orcamento';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-numero">
        <span class="venda-numero">${escaparHtmlVenda(v.numero || '—')}</span>
      </td>
      <td class="col-data">
        <span class="venda-data">${formatarDataVenda(v.data_venda)}</span>
      </td>
      <td>${nomeCliente}</td>
      <td class="col-status">
        <span class="venda-linha-status status-${status}">
          ${nomeStatus(status)}
        </span>
      </td>
      <td class="col-total">
        <span class="venda-total">${formatarMoedaVenda(v.total)}</span>
      </td>
      <td class="col-acoes">
        <div class="tabela-acoes">
          <button class="btn-icone ver-venda" data-id="${v.id}" title="Ver detalhes">👁️</button>
          <button class="btn-icone excluir-venda" data-id="${v.id}" title="Excluir">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  listaVendas.innerHTML = '';
  listaVendas.appendChild(tabela);

  // Eventos
  tabela.querySelectorAll('.ver-venda').forEach(btn => {
    btn.addEventListener('click', () => verVenda(Number(btn.dataset.id)));
  });
  tabela.querySelectorAll('.excluir-venda').forEach(btn => {
    btn.addEventListener('click', () => excluirVenda(Number(btn.dataset.id)));
  });
}

// -------- RESUMO DO MÊS --------
function calcularResumoMes() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  // Filtra vendas do mês
  const vendasMes = vendasCache.filter(v => {
    const data = new Date(v.data_venda);
    return data >= inicioMes;
  });

  const faturamento = vendasMes.reduce((s, v) => s + Number(v.total || 0), 0);
  const custos      = vendasMes.reduce((s, v) => s + Number(v.custo_total || 0), 0);
  const lucro       = vendasMes.reduce((s, v) => s + Number(v.lucro_bruto || 0), 0);
  const qtd         = vendasMes.length;

  if (resumoFaturamento) resumoFaturamento.textContent = formatarMoedaVenda(faturamento);
  if (resumoQtd)         resumoQtd.textContent         = qtd;
  if (resumoCustos)      resumoCustos.textContent      = formatarMoedaVenda(custos);
  if (resumoLucro)       resumoLucro.textContent       = formatarMoedaVenda(lucro);
}

// -------- AÇÕES PLACEHOLDER (implementadas no Bloco F) --------
function verVenda(id) {
  const v = vendasCache.find(x => x.id === id);
  if (!v) return;
  alert(`Em breve: detalhes da venda ${v.numero || '#' + v.id}`);
}

async function excluirVenda(id) {
  const v = vendasCache.find(x => x.id === id);
  if (!v) return;
  if (!confirm(`Excluir a venda ${v.numero || '#' + v.id}?`)) return;
  alert('Em breve: excluir venda');
}

// -------- INICIALIZAÇÃO --------
(async () => {
  setTimeout(async () => {
    if (!listaVendas) return;
    await carregarClientesVendas();
    await carregarVendas();
  }, 300);
})();
