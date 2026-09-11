// ============================================
// SOU DILA — Gerenciador de Tamanhos (Variações)
// ============================================

// -------- ELEMENTOS --------
const modalTamanhos     = document.getElementById('modal-tamanhos');
const tamanhosTitulo    = document.getElementById('tamanhos-titulo');
const btnFecharTamanhos = document.getElementById('btn-fechar-tamanhos');
const contadorTamanhos  = document.getElementById('contador-tamanhos');
const listaTamanhos     = document.getElementById('lista-tamanhos');
const btnNovoTamanho    = document.getElementById('btn-novo-tamanho');

const formWrap          = document.getElementById('form-tamanho-wrap');
const formTamanho       = document.getElementById('form-tamanho');
const formTamanhoTitulo = document.getElementById('form-tamanho-titulo');
const btnCancelarTam    = document.getElementById('btn-cancelar-tamanho');
const btnSalvarTam      = document.getElementById('btn-salvar-tamanho');
const msgTamanho        = document.getElementById('msg-tamanho');

const campoTamId        = document.getElementById('tamanho-id');
const campoEstampa      = document.getElementById('tamanho-estampa');
const campoTamanho      = document.getElementById('tamanho-tamanho');
const campoSku          = document.getElementById('tamanho-sku');
const campoEstoque      = document.getElementById('tamanho-estoque');
const campoEstoqueMin   = document.getElementById('tamanho-estoque-minimo');

// -------- ESTADO --------
let produtoAtualId      = null;
let produtoAtualNome    = '';
let variacoesCache      = [];
let estampasCache       = [];

// -------- HELPERS --------
function mostrarMsgTam(msg, tipo = 'erro') {
  msgTamanho.textContent = msg;
  msgTamanho.style.color = tipo === 'erro' ? 'var(--cor-erro)' : 'var(--cor-sucesso)';
}

function limparMsgTam() {
  msgTamanho.textContent = '';
}

function escaparHtmlTam(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function gerarSkuPadrao(nomeProduto, nomeEstampa, tamanho) {
  // Pega primeiras 3 letras de cada
  const p = (nomeProduto || 'PROD').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  const e = (nomeEstampa || 'EST').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  const t = (tamanho || '').toUpperCase();
  return `${p}-${e}-${t}`;
}

// -------- ABRIR MODAL --------
async function abrirModalTamanhos(idProduto, nomeProduto) {
  produtoAtualId   = idProduto;
  produtoAtualNome = nomeProduto;

  tamanhosTitulo.textContent = `${nomeProduto} — Tamanhos`;
  listaTamanhos.innerHTML = '<p class="vazio">Carregando...</p>';
  formWrap.classList.add('escondido');
  limparMsgTam();

  modalTamanhos.classList.add('aberto');

  await carregarEstampasDropdown();
  await carregarVariacoes();
}

// -------- CARREGAR ESTAMPAS (dropdown) --------
async function carregarEstampasDropdown() {
  const { data } = await sb.from('estampas').select('id, nome').order('nome');
  estampasCache = data || [];

  campoEstampa.innerHTML = '<option value="">— Selecione —</option>' +
    estampasCache.map(e => `<option value="${e.id}">${escaparHtmlTam(e.nome)}</option>`).join('');
}

// -------- CARREGAR VARIAÇÕES (do produto atual) --------
async function carregarVariacoes() {
  if (!produtoAtualId) return;

  // Busca variações do produto
  const { data: variacoes, error } = await sb
    .from('variacoes_produto')
    .select('id, tamanho, sku, estampa_id, ativo, created_at')
    .eq('produto_id', produtoAtualId)
    .order('tamanho');

  if (error) {
    console.error(error);
    listaTamanhos.innerHTML = '<p class="vazio">Erro ao carregar tamanhos.</p>';
    return;
  }

  variacoesCache = variacoes || [];

  // Busca estoques das variações
  const idsVariacoes = variacoesCache.map(v => v.id);
  let estoquesMap = {};

  if (idsVariacoes.length > 0) {
    const { data: estoques } = await sb
      .from('estoque')
      .select('variacao_id, quantidade, estoque_minimo')
      .in('variacao_id', idsVariacoes);

    (estoques || []).forEach(e => {
      estoquesMap[e.variacao_id] = e;
    });
  }

  // Contador
  contadorTamanhos.textContent = `${variacoesCache.length} tamanho${variacoesCache.length === 1 ? '' : 's'}`;

  // Lista vazia
  if (variacoesCache.length === 0) {
    listaTamanhos.innerHTML = '<p class="vazio">Nenhum tamanho cadastrado. Clique em "+ Adicionar Tamanho" para começar.</p>';
    return;
  }

  // Monta tabela
  const tabela = document.createElement('table');
  tabela.className = 'lista-clientes-tabela'; // reaproveita o estilo

  tabela.innerHTML = `
    <thead>
      <tr>
        <th>Tamanho</th>
        <th>Estampa</th>
        <th>SKU</th>
        <th>Estoque</th>
        <th style="text-align:right;">Ações</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = tabela.querySelector('tbody');

  variacoesCache.forEach(v => {
    const est = estampasCache.find(e => e.id === v.estampa_id);
    const estNome = est ? est.nome : '—';
    const estq = estoquesMap[v.id];
    const qtd = estq ? estq.quantidade : 0;
    const qtdMin = estq ? estq.estoque_minimo : 0;

    // Alerta visual se estoque baixo
    const classeEstoque = qtd === 0
      ? 'estoque-zero'
      : (qtd <= qtdMin ? 'estoque-baixo' : '');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escaparHtmlTam(v.tamanho)}</strong></td>
      <td>${escaparHtmlTam(estNome)}</td>
      <td><code>${escaparHtmlTam(v.sku || '—')}</code></td>
      <td>
        <span class="badge-estoque ${classeEstoque}">
          ${qtd} un.
        </span>
      </td>
      <td>
        <div class="tabela-acoes">
          <button class="btn-icone editar-tam" data-id="${v.id}" title="Editar">✏️</button>
          <button class="btn-icone excluir-tam" data-id="${v.id}" title="Excluir">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  listaTamanhos.innerHTML = '';
  listaTamanhos.appendChild(tabela);

  // Eventos
  tabela.querySelectorAll('.editar-tam').forEach(btn => {
    btn.addEventListener('click', () => abrirFormEdicao(Number(btn.dataset.id)));
  });
  tabela.querySelectorAll('.excluir-tam').forEach(btn => {
    btn.addEventListener('click', () => excluirTamanho(Number(btn.dataset.id)));
  });
}

// -------- ABRIR FORM NOVO --------
function abrirFormNovo() {
  formTamanhoTitulo.textContent = 'Novo Tamanho';
  formTamanho.reset();
  campoTamId.value = '';
  campoEstoque.value = '0';
  campoEstoqueMin.value = '0';
  limparMsgTam();
  formWrap.classList.remove('escondido');
  campoEstampa.focus();
}

// -------- ABRIR FORM EDIÇÃO --------
async function abrirFormEdicao(idVariacao) {
  const v = variacoesCache.find(x => x.id === idVariacao);
  if (!v) return;

  formTamanhoTitulo.textContent = 'Editar Tamanho';
  campoTamId.value = v.id;
  campoEstampa.value = v.estampa_id || '';
  campoTamanho.value = v.tamanho || '';
  campoSku.value = v.sku || '';

  // Busca estoque atual
  const { data: estoque } = await sb
    .from('estoque')
    .select('quantidade, estoque_minimo')
    .eq('variacao_id', idVariacao)
    .single();

  campoEstoque.value = estoque ? estoque.quantidade : 0;
  campoEstoqueMin.value = estoque ? estoque.estoque_minimo : 0;

  limparMsgTam();
  formWrap.classList.remove('escondido');
  campoEstampa.focus();
}

// -------- FECHAR FORM --------
function fecharFormTamanho() {
  formWrap.classList.add('escondido');
  limparMsgTam();
}

// -------- SALVAR TAMANHO --------
async function salvarTamanho(e) {
  e.preventDefault();
  limparMsgTam();

  const id            = campoTamId.value;
  const estampaId     = campoEstampa.value ? Number(campoEstampa.value) : null;
  const tamanho       = campoTamanho.value;
  const skuDigitado   = campoSku.value.trim();
  const qtd           = Number(campoEstoque.value) || 0;
  const qtdMin        = Number(campoEstoqueMin.value) || 0;

  // Validações
  if (!estampaId) {
    mostrarMsgTam('Selecione uma estampa.');
    return;
  }
  if (!tamanho) {
    mostrarMsgTam('Selecione um tamanho.');
    return;
  }

  btnSalvarTam.disabled = true;
  btnSalvarTam.textContent = 'Salvando...';

  // Define SKU
  let sku = skuDigitado;
  if (!sku) {
    const est = estampasCache.find(e => e.id === estampaId);
    sku = gerarSkuPadrao(produtoAtualNome, est?.nome, tamanho);
  }

  let variacaoId = id ? Number(id) : null;

  // ---- Se é EDIÇÃO ----
  if (id) {
    const { error } = await sb
      .from('variacoes_produto')
      .update({ tamanho, sku, estampa_id: estampaId })
      .eq('id', Number(id));

    if (error) {
      console.error(error);
      mostrarMsgTam('Erro ao salvar variação. SKU pode estar em uso.');
      btnSalvarTam.disabled = false;
      btnSalvarTam.textContent = 'Salvar Tamanho';
      return;
    }

    // Atualiza estoque
    const { error: errEstq } = await sb
      .from('estoque')
      .update({ quantidade: qtd, estoque_minimo: qtdMin, updated_at: new Date().toISOString() })
      .eq('variacao_id', Number(id));

    if (errEstq) {
      console.error(errEstq);
      mostrarMsgTam('Variação salva, mas houve erro no estoque.');
    }

  // ---- Se é NOVO ----
  } else {
    const { data: novaVar, error } = await sb
      .from('variacoes_produto')
      .insert([{
        produto_id: produtoAtualId,
        estampa_id: estampaId,
        tamanho,
        sku,
        custo_unitario: 0,   // agora o custo fica na estampa
        preco_venda: 0,      // agora o preço fica na estampa
        ativo: true
      }])
      .select()
      .single();

    if (error) {
      console.error(error);
      mostrarMsgTam('Erro ao criar variação. SKU pode estar em uso.');
      btnSalvarTam.disabled = false;
      btnSalvarTam.textContent = 'Salvar Tamanho';
      return;
    }

    variacaoId = novaVar.id;

    // Cria estoque
    const { error: errEstq } = await sb
      .from('estoque')
      .insert([{
        variacao_id: variacaoId,
        quantidade: qtd,
        estoque_minimo: qtdMin
      }]);

    if (errEstq) {
      console.error(errEstq);
      mostrarMsgTam('Variação criada, mas erro ao criar estoque.');
    }
  }

  btnSalvarTam.disabled = false;
  btnSalvarTam.textContent = 'Salvar Tamanho';

  fecharFormTamanho();
  await carregarVariacoes();
}

// -------- EXCLUIR TAMANHO --------
async function excluirTamanho(idVariacao) {
  const v = variacoesCache.find(x => x.id === idVariacao);
  if (!v) return;

  const est = estampasCache.find(e => e.id === v.estampa_id);
  const nome = est ? `${est.nome} ${v.tamanho}` : v.tamanho;

  if (!confirm(`Excluir a variação "${nome}"?\n\nO estoque dela também será removido.`)) return;

  // Apaga estoque primeiro (por causa da FK)
  await sb.from('estoque').delete().eq('variacao_id', idVariacao);

  // Apaga variação
  const { error } = await sb.from('variacoes_produto').delete().eq('id', idVariacao);
  if (error) {
    console.error(error);
    alert('Erro ao excluir. A variação pode estar em alguma venda.');
    return;
  }

  await carregarVariacoes();
}

// -------- FECHAR MODAL PRINCIPAL --------
function fecharModalTamanhos() {
  modalTamanhos.classList.remove('aberto');
  formWrap.classList.add('escondido');
  produtoAtualId = null;
  produtoAtualNome = '';
  limparMsgTam();
}

// -------- EVENTOS --------
if (btnFecharTamanhos) btnFecharTamanhos.addEventListener('click', fecharModalTamanhos);
if (btnNovoTamanho)    btnNovoTamanho.addEventListener('click', abrirFormNovo);
if (btnCancelarTam)    btnCancelarTam.addEventListener('click', fecharFormTamanho);
if (formTamanho)       formTamanho.addEventListener('submit', salvarTamanho);

if (modalTamanhos) {
  modalTamanhos.addEventListener('click', (e) => {
    if (e.target === modalTamanhos) fecharModalTamanhos();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalTamanhos && modalTamanhos.classList.contains('aberto')) {
    if (!formWrap.classList.contains('escondido')) {
      fecharFormTamanho();
    } else {
      fecharModalTamanhos();
    }
  }
});
