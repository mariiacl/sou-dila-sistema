// ============================================
// SOU DILA — Lógica da tela de Vendas
// Arquivo completo: listagem + modal de nova venda
// ============================================

// ============================================
// ELEMENTOS
// ============================================

// Listagem
const listaVendas       = document.getElementById('lista-vendas');
const contadorVendas    = document.getElementById('contador-vendas');
const resumoFaturamento = document.getElementById('resumo-faturamento');
const resumoQtd         = document.getElementById('resumo-qtd');
const resumoCustos      = document.getElementById('resumo-custos');
const resumoLucro       = document.getElementById('resumo-lucro');
const btnNovaVenda      = document.getElementById('btn-nova-venda');

// Modal
const modalVenda        = document.getElementById('modal-venda');
const modalVendaTitulo  = document.getElementById('modal-venda-titulo');
const btnFecharVenda    = document.getElementById('btn-fechar-venda');
const btnCancelarVenda  = document.getElementById('btn-cancelar-venda');
const formVenda         = document.getElementById('form-venda');
const btnFinalizarVenda = document.getElementById('btn-finalizar-venda');
const msgVenda          = document.getElementById('msg-venda');

// Campos do modal
const vendaCliente      = document.getElementById('venda-cliente');
const vendaFormaPgto    = document.getElementById('venda-forma-pagamento');
const vendaStatus       = document.getElementById('venda-status');
const vendaDesconto     = document.getElementById('venda-desconto');
const vendaFrete        = document.getElementById('venda-frete');
const vendaObs          = document.getElementById('venda-observacoes');

// Adicionar item
const addVariacao       = document.getElementById('add-variacao');
const addTamanho        = document.getElementById('add-tamanho');
const addQtd            = document.getElementById('add-qtd');
const addPreco          = document.getElementById('add-preco');
const btnAddItem        = document.getElementById('btn-add-item');
const itensVendaDiv     = document.getElementById('itens-venda');

// Views (totais)
const vendaSubtotalView = document.getElementById('venda-subtotal');
const vendaDescontoView = document.getElementById('venda-desconto-view');
const vendaFreteView    = document.getElementById('venda-frete-view');
const vendaTotalView    = document.getElementById('venda-total-view');

// ============================================
// ESTADO
// ============================================
let vendasCache        = [];
let clientesCache      = [];
let formasPgtoCache    = [];
let produtosCache      = [];    // { id, nome }
let estampasCache      = [];    // { id, nome, preco_venda, custo }
let variacoesCache     = [];    // { id, produto_id, estampa_id, tamanho, sku }
let estoquesCache      = [];    // { variacao_id, quantidade }

let itensVendaAtual    = [];    // itens adicionados no modal

// ============================================
// HELPERS
// ============================================
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

function mostrarMsgVenda(msg, tipo = 'erro') {
  if (!msgVenda) return;
  msgVenda.textContent = msg;
  msgVenda.style.color = tipo === 'erro' ? 'var(--cor-erro)' : 'var(--cor-sucesso)';
}

function limparMsgVenda() {
  if (msgVenda) msgVenda.textContent = '';
}

// ============================================
// LISTAGEM
// ============================================
async function carregarClientesVendas() {
  const { data } = await sb.from('clientes').select('id, nome').order('nome');
  clientesCache = data || [];
}

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
  contadorVendas.textContent = `${vendasCache.length} venda${vendasCache.length === 1 ? '' : 's'}`;

  calcularResumoMes();

  if (vendasCache.length === 0) {
    listaVendas.innerHTML = '<p class="vazio">Nenhuma venda registrada ainda. Clique em "+ Nova Venda" para começar.</p>';
    return;
  }

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
    const cliente = v.cliente_id ? clientesCache.find(c => c.id === v.cliente_id) : null;
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
        <span class="venda-linha-status status-${status}">${nomeStatus(status)}</span>
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

  tabela.querySelectorAll('.ver-venda').forEach(btn => {
    btn.addEventListener('click', () => verVenda(Number(btn.dataset.id)));
  });
  tabela.querySelectorAll('.excluir-venda').forEach(btn => {
    btn.addEventListener('click', () => excluirVenda(Number(btn.dataset.id)));
  });
}

function calcularResumoMes() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

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

// ============================================
// AÇÕES PLACEHOLDER (detalhes / exclusão)
// ============================================
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

// ============================================
// MODAL DE NOVA VENDA
// ============================================

// ---- Carrega dados para o modal ----
async function carregarDadosModal() {
  // Clientes
  vendaCliente.innerHTML = '<option value="">— Venda avulsa (sem cliente) —</option>' +
    clientesCache.map(c => `<option value="${c.id}">${escaparHtmlVenda(c.nome)}</option>`).join('');

  // Formas de pagamento
  const { data: formas } = await sb.from('formas_pagamento').select('id, nome, taxa').order('nome');
  formasPgtoCache = formas || [];
  vendaFormaPgto.innerHTML = '<option value="">— Selecione —</option>' +
    formasPgtoCache.map(f => `<option value="${f.id}">${escaparHtmlVenda(f.nome)}</option>`).join('');

  // Produtos
  const { data: produtos } = await sb.from('produtos').select('id, nome').eq('ativo', true).order('nome');
  produtosCache = produtos || [];

  // Estampas
  const { data: estampas } = await sb.from('estampas').select('id, nome, preco_venda, custo').eq('ativo', true).order('nome');
  estampasCache = estampas || [];

  // Variações
  const { data: variacoes } = await sb.from('variacoes_produto').select('id, produto_id, estampa_id, tamanho, sku').eq('ativo', true);
  variacoesCache = variacoes || [];

  // Estoques
  const { data: estoques } = await sb.from('estoque').select('variacao_id, quantidade');
  estoquesCache = estoques || [];

  // Popula dropdown de "produto/estampa"
  popularDropdownVariacoes();
}

// ---- Popula dropdown de produtos/estampas ----
function popularDropdownVariacoes() {
  // Agrupa por produto + estampa (que têm variações)
  const combinacoes = {};

  variacoesCache.forEach(v => {
    const produto = produtosCache.find(p => p.id === v.produto_id);
    const estampa = estampasCache.find(e => e.id === v.estampa_id);
    if (!produto || !estampa) return;

    const chave = `${v.produto_id}_${v.estampa_id}`;
    if (!combinacoes[chave]) {
      combinacoes[chave] = {
        produto_id: v.produto_id,
        estampa_id: v.estampa_id,
        produto_nome: produto.nome,
        estampa_nome: estampa.nome,
        preco: Number(estampa.preco_venda || 0),
        custo: Number(estampa.custo || 0)
      };
    }
  });

  const lista = Object.values(combinacoes).sort((a, b) =>
    a.produto_nome.localeCompare(b.produto_nome) || a.estampa_nome.localeCompare(b.estampa_nome)
  );

  addVariacao.innerHTML = '<option value="">— Selecione —</option>' +
    lista.map(c => {
      const label = `${c.produto_nome} — ${c.estampa_nome}`;
      return `<option value="${c.produto_id}_${c.estampa_id}">${escaparHtmlVenda(label)}</option>`;
    }).join('');
}

// ---- Quando escolhe variação, popula tamanhos ----
addVariacao.addEventListener('change', () => {
  const valor = addVariacao.value;
  addPreco.value = '';

  if (!valor) {
    addTamanho.innerHTML = '<option value="">— Escolha o produto —</option>';
    addTamanho.disabled = true;
    return;
  }

  const [produtoId, estampaId] = valor.split('_').map(Number);

  // Filtra variações dessa combinação
  const variacoes = variacoesCache.filter(v =>
    v.produto_id === produtoId && v.estampa_id === estampaId
  );

  // Busca estoque de cada
  const comEstoque = variacoes.map(v => {
    const estq = estoquesCache.find(e => e.variacao_id === v.id);
    return {
      ...v,
      estoque: estq ? estq.quantidade : 0
    };
  }).filter(v => v.estoque > 0); // só mostra com estoque

  if (comEstoque.length === 0) {
    addTamanho.innerHTML = '<option value="">— Sem estoque disponível —</option>';
    addTamanho.disabled = true;
    return;
  }

  addTamanho.innerHTML = '<option value="">— Selecione —</option>' +
    comEstoque.map(v =>
      `<option value="${v.id}">${escaparHtmlVenda(v.tamanho)} (${v.estoque} disp.)</option>`
    ).join('');
  addTamanho.disabled = false;

  // Preenche preço da estampa
  const estampa = estampasCache.find(e => e.id === estampaId);
  if (estampa) {
    addPreco.value = formatarMoedaVenda(estampa.preco_venda);
  }
});

// ---- Adicionar item ----
btnAddItem.addEventListener('click', () => {
  const valorVar = addVariacao.value;
  const variacaoId = Number(addTamanho.value);
  const qtd = Number(addQtd.value) || 0;

  if (!valorVar) {
    alert('Escolha um produto/estampa.');
    return;
  }
  if (!variacaoId) {
    alert('Escolha um tamanho.');
    return;
  }
  if (qtd < 1) {
    alert('Quantidade deve ser pelo menos 1.');
    return;
  }

  const variacao = variacoesCache.find(v => v.id === variacaoId);
  if (!variacao) return;

  const estampa = estampasCache.find(e => e.id === variacao.estampa_id);
  const produto = produtosCache.find(p => p.id === variacao.produto_id);
  if (!estampa || !produto) return;

  const estq = estoquesCache.find(e => e.variacao_id === variacaoId);
  const estoqueDisp = estq ? estq.quantidade : 0;

  // Verifica se já tem esse item na lista
  const itemExistente = itensVendaAtual.find(i => i.variacao_id === variacaoId);

  // Verifica estoque (considerando o que já tem na lista)
  const qtdJaAdicionada = itemExistente ? itemExistente.quantidade : 0;
  if (qtd + qtdJaAdicionada > estoqueDisp) {
    alert(`Estoque insuficiente. Disponível: ${estoqueDisp} un. (já na venda: ${qtdJaAdicionada})`);
    return;
  }

  if (itemExistente) {
    itemExistente.quantidade += qtd;
  } else {
    itensVendaAtual.push({
      variacao_id: variacaoId,
      produto_id: variacao.produto_id,
      estampa_id: variacao.estampa_id,
      produto_nome: produto.nome,
      estampa_nome: estampa.nome,
      tamanho: variacao.tamanho,
      sku: variacao.sku,
      quantidade: qtd,
      valor_unitario: Number(estampa.preco_venda || 0),
      custo_unitario: Number(estampa.custo || 0)
    });
  }

  // Limpa campos
  addVariacao.value = '';
  addTamanho.innerHTML = '<option value="">— Escolha o produto —</option>';
  addTamanho.disabled = true;
  addQtd.value = 1;
  addPreco.value = '';

  renderizarItensVenda();
});

// ---- Renderizar itens ----
function renderizarItensVenda() {
  if (itensVendaAtual.length === 0) {
    itensVendaDiv.innerHTML = '<div class="itens-vazio">Nenhum item adicionado ainda.</div>';
    atualizarTotais();
    return;
  }

  itensVendaDiv.innerHTML = itensVendaAtual.map((item, idx) => `
    <div class="item-venda">
      <div class="item-venda-info">
        <strong>${escaparHtmlVenda(item.produto_nome)} — ${escaparHtmlVenda(item.estampa_nome)}</strong>
        <span>Tamanho: ${escaparHtmlVenda(item.tamanho)} · SKU: ${escaparHtmlVenda(item.sku || '—')} · Unit: ${formatarMoedaVenda(item.valor_unitario)}</span>
      </div>
      <div class="item-venda-qtd">${item.quantidade}×</div>
      <div class="item-venda-valor">${formatarMoedaVenda(item.quantidade * item.valor_unitario)}</div>
      <button type="button" class="btn-icone remover-item" data-idx="${idx}" title="Remover">✕</button>
    </div>
  `).join('');

  itensVendaDiv.querySelectorAll('.remover-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      itensVendaAtual.splice(idx, 1);
      renderizarItensVenda();
    });
  });

  atualizarTotais();
}

// ---- Atualizar totais ----
function atualizarTotais() {
  const subtotal = itensVendaAtual.reduce((s, i) => s + (i.quantidade * i.valor_unitario), 0);
  const desconto = Number(vendaDesconto.value) || 0;
  const frete    = Number(vendaFrete.value) || 0;
  const total    = subtotal - desconto + frete;

  vendaSubtotalView.textContent = formatarMoedaVenda(subtotal);
  vendaDescontoView.textContent = '− ' + formatarMoedaVenda(desconto);
  vendaFreteView.textContent    = '+ ' + formatarMoedaVenda(frete);
  vendaTotalView.textContent    = formatarMoedaVenda(total);
}

vendaDesconto.addEventListener('input', atualizarTotais);
vendaFrete.addEventListener('input', atualizarTotais);

// ---- Abrir modal ----
async function abrirModalVenda() {
  itensVendaAtual = [];
  formVenda.reset();
  itensVendaDiv.innerHTML = '<div class="itens-vazio">Nenhum item adicionado ainda.</div>';
  addTamanho.innerHTML = '<option value="">— Escolha o produto —</option>';
  addTamanho.disabled = true;
  addPreco.value = '';
  limparMsgVenda();
  modalVendaTitulo.textContent = 'Nova Venda';
  atualizarTotais();

  modalVenda.classList.add('aberto');

  await carregarDadosModal();
}

// ---- Fechar modal ----
function fecharModalVenda() {
  modalVenda.classList.remove('aberto');
  itensVendaAtual = [];
  limparMsgVenda();
}

// ---- Finalizar venda ----
async function finalizarVenda(e) {
  e.preventDefault();
  limparMsgVenda();

  if (itensVendaAtual.length === 0) {
    mostrarMsgVenda('Adicione pelo menos um item.');
    return;
  }

  const desconto = Number(vendaDesconto.value) || 0;
  const frete    = Number(vendaFrete.value) || 0;

  const subtotal   = itensVendaAtual.reduce((s, i) => s + (i.quantidade * i.valor_unitario), 0);
  const custoTotal = itensVendaAtual.reduce((s, i) => s + (i.quantidade * i.custo_unitario), 0);
  const total      = subtotal - desconto + frete;
  const lucroBruto = total - custoTotal;

  // Gera número da venda
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const hora = String(agora.getHours()).padStart(2, '0');
  const min = String(agora.getMinutes()).padStart(2, '0');
  const seg = String(agora.getSeconds()).padStart(2, '0');
  const numero = `VND-${ano}${mes}${dia}-${hora}${min}${seg}`;

  btnFinalizarVenda.disabled = true;
  btnFinalizarVenda.textContent = 'Salvando...';

  // 1. Insere a venda
  const { data: novaVenda, error: errVenda } = await sb
    .from('vendas')
    .insert([{
      numero,
      cliente_id: vendaCliente.value ? Number(vendaCliente.value) : null,
      forma_pagamento_id: vendaFormaPgto.value ? Number(vendaFormaPgto.value) : null,
      data_venda: new Date().toISOString(),
      subtotal,
      desconto,
      frete,
      total,
      custo_total: custoTotal,
      lucro_bruto: lucroBruto,
      status: vendaStatus.value || 'pago',
      observacoes: vendaObs.value.trim() || null
    }])
    .select()
    .single();

  if (errVenda) {
    console.error(errVenda);
    mostrarMsgVenda('Erro ao salvar a venda.');
    btnFinalizarVenda.disabled = false;
    btnFinalizarVenda.textContent = 'Finalizar Venda';
    return;
  }

  // 2. Insere os itens
  const itensParaInserir = itensVendaAtual.map(i => ({
    venda_id: novaVenda.id,
    variacao_id: i.variacao_id,
    quantidade: i.quantidade,
    valor_unitario: i.valor_unitario,
    custo_unitario: i.custo_unitario,
    subtotal: i.quantidade * i.valor_unitario,
    lucro_bruto_item: i.quantidade * (i.valor_unitario - i.custo_unitario)
  }));

  const { error: errItens } = await sb.from('itens_venda').insert(itensParaInserir);

  if (errItens) {
    console.error(errItens);
    mostrarMsgVenda('Venda salva, mas houve erro nos itens.');
  }

  // 3. Baixa no estoque
  for (const item of itensVendaAtual) {
    const estq = estoquesCache.find(e => e.variacao_id === item.variacao_id);
    if (!estq) continue;

    const novaQtd = Math.max(0, estq.quantidade - item.quantidade);

    await sb
      .from('estoque')
      .update({ quantidade: novaQtd, updated_at: new Date().toISOString() })
      .eq('variacao_id', item.variacao_id);
  }

  btnFinalizarVenda.disabled = false;
  btnFinalizarVenda.textContent = 'Finalizar Venda';

  fecharModalVenda();

  // Recarrega a lista
  await carregarVendas();
  // Recarrega dados de estoque no cache
  const { data: estoquesAtualizados } = await sb.from('estoque').select('variacao_id, quantidade');
  estoquesCache = estoquesAtualizados || [];

  alert(`Venda ${numero} registrada com sucesso! 🎉`);
}

// ============================================
// EVENTOS
// ============================================
if (btnNovaVenda)      btnNovaVenda.addEventListener('click', abrirModalVenda);
if (btnFecharVenda)    btnFecharVenda.addEventListener('click', fecharModalVenda);
if (btnCancelarVenda)  btnCancelarVenda.addEventListener('click', fecharModalVenda);
if (formVenda)         formVenda.addEventListener('submit', finalizarVenda);

if (modalVenda) {
  modalVenda.addEventListener('click', (e) => {
    if (e.target === modalVenda) fecharModalVenda();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalVenda && modalVenda.classList.contains('aberto')) {
    fecharModalVenda();
  }
});

// ============================================
// INICIALIZAÇÃO
// ============================================
(async () => {
  setTimeout(async () => {
    if (!listaVendas) return;
    await carregarClientesVendas();
    await carregarVendas();
  }, 300);
})();
