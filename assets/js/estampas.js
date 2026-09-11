// ============================================
// SOU DILA — Lógica da tela de Estampas
// ============================================

// -------- ELEMENTOS --------
const listaEstampas   = document.getElementById('lista-estampas');
const contador        = document.getElementById('contador-estampas');
const btnNova         = document.getElementById('btn-nova-estampa');
const modal           = document.getElementById('modal-estampa');
const modalTitulo     = document.getElementById('modal-titulo');
const btnFecharModal  = document.getElementById('btn-fechar-modal');
const btnCancelar     = document.getElementById('btn-cancelar');
const formEstampa     = document.getElementById('form-estampa');
const btnSalvar       = document.getElementById('btn-salvar');
const msgEstampa      = document.getElementById('msg-estampa');

// Campos
const campoId         = document.getElementById('estampa-id');
const campoNome       = document.getElementById('estampa-nome');
const campoDescricao  = document.getElementById('estampa-descricao');
const campoCusto      = document.getElementById('estampa-custo');
const campoPreco      = document.getElementById('estampa-preco');
const campoColecao    = document.getElementById('estampa-colecao');
const campoImagem     = document.getElementById('estampa-imagem');

// -------- ESTADO --------
let estampasCache  = [];
let colecoesCache  = [];

// -------- HELPERS --------
function mostrarMsg(msg, tipo = 'erro') {
  msgEstampa.textContent = msg;
  msgEstampa.style.color = tipo === 'erro' ? 'var(--cor-erro)' : 'var(--cor-sucesso)';
}

function limparMsg() {
  msgEstampa.textContent = '';
}

function escaparHtml(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
}

// -------- CARREGAR COLEÇÕES (para o dropdown) --------
async function carregarColecoes() {
  const { data } = await sb.from('colecoes').select('id, nome').order('nome');
  colecoesCache = data || [];
  campoColecao.innerHTML = '<option value="">— Selecione —</option>' +
    colecoesCache.map(c => `<option value="${c.id}">${escaparHtml(c.nome)}</option>`).join('');
}

// -------- CARREGAR ESTAMPAS --------
async function carregarEstampas() {
  listaEstampas.innerHTML = '<p class="vazio">Carregando...</p>';

  const { data, error } = await sb
    .from('estampas')
    .select('id, nome, descricao, custo, preco_venda, imagem_url, colecao_id, ativo, created_at')
    .order('nome', { ascending: true });

  if (error) {
    console.error(error);
    listaEstampas.innerHTML = '<p class="vazio">Erro ao carregar estampas.</p>';
    return;
  }

  estampasCache = data || [];
  contador.textContent = `${estampasCache.length} estampa${estampasCache.length === 1 ? '' : 's'}`;

  if (estampasCache.length === 0) {
    listaEstampas.innerHTML = '<p class="vazio">Nenhuma estampa cadastrada ainda. Clique em "+ Nova Estampa" para começar.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'lista-produtos-grid'; // reaproveita o grid existente

  estampasCache.forEach(e => {
    const colNome = colecoesCache.find(c => c.id === e.colecao_id)?.nome;
    const margem = (Number(e.preco_venda || 0) - Number(e.custo || 0));

    const card = document.createElement('div');
    card.className = 'produto-card';
    card.innerHTML = `
      <div class="foto">
        ${e.imagem_url
          ? `<img src="${escaparHtml(e.imagem_url)}" alt="${escaparHtml(e.nome)}">`
          : '🎨'}
      </div>
      <div class="info">
        <h4>${escaparHtml(e.nome)}</h4>
        <div class="tags">
          ${colNome ? `<span class="tag colecao">${escaparHtml(colNome)}</span>` : ''}
        </div>
        <div class="precos">
          <span class="preco-venda">${formatarMoeda(e.preco_venda)}</span>
          <span class="preco-custo">custo: ${formatarMoeda(e.custo)}</span>
        </div>
      </div>
      <div class="acoes">
        <button class="btn-icone editar" data-id="${e.id}" title="Editar">✏️</button>
        <button class="btn-icone excluir" data-id="${e.id}" title="Excluir">🗑️</button>
      </div>
    `;
    grid.appendChild(card);
  });

  listaEstampas.innerHTML = '';
  listaEstampas.appendChild(grid);

  grid.querySelectorAll('.editar').forEach(btn => {
    btn.addEventListener('click', () => abrirEdicao(Number(btn.dataset.id)));
  });
  grid.querySelectorAll('.excluir').forEach(btn => {
    btn.addEventListener('click', () => excluirEstampa(Number(btn.dataset.id)));
  });
}

// -------- ABRIR NOVO --------
function abrirNovo() {
  modalTitulo.textContent = 'Nova Estampa';
  formEstampa.reset();
  campoId.value = '';
  limparMsg();
  modal.classList.add('aberto');
  campoNome.focus();
}

// -------- ABRIR EDIÇÃO --------
function abrirEdicao(id) {
  const e = estampasCache.find(x => x.id === id);
  if (!e) return;

  modalTitulo.textContent = 'Editar Estampa';
  campoId.value = e.id;
  campoNome.value = e.nome || '';
  campoDescricao.value = e.descricao || '';
  campoCusto.value = e.custo || '';
  campoPreco.value = e.preco_venda || '';
  campoColecao.value = e.colecao_id || '';
  campoImagem.value = e.imagem_url || '';
  limparMsg();
  modal.classList.add('aberto');
  campoNome.focus();
}

// -------- FECHAR MODAL --------
function fecharModal() {
  modal.classList.remove('aberto');
  limparMsg();
}

// -------- SALVAR --------
async function salvarEstampa(ev) {
  ev.preventDefault();
  limparMsg();
  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  const id = campoId.value;
  const dados = {
    nome:        campoNome.value.trim(),
    descricao:   campoDescricao.value.trim() || null,
    custo:       Number(campoCusto.value) || 0,
    preco_venda: Number(campoPreco.value) || 0,
    colecao_id:  campoColecao.value ? Number(campoColecao.value) : null,
    imagem_url:  campoImagem.value.trim() || null,
  };

  if (!dados.nome) {
    mostrarMsg('O nome da estampa é obrigatório.');
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar Estampa';
    return;
  }

  if (dados.custo < 0 || dados.preco_venda < 0) {
    mostrarMsg('Custo e preço não podem ser negativos.');
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar Estampa';
    return;
  }

  if (dados.preco_venda < dados.custo) {
    mostrarMsg('Atenção: o preço de venda é menor que o custo. Confirma?', 'erro');
    // Aviso, mas permite salvar (você pode ter motivo)
  }

  let error;
  if (id) {
    ({ error } = await sb.from('estampas').update(dados).eq('id', Number(id)));
  } else {
    ({ error } = await sb.from('estampas').insert([dados]));
  }

  btnSalvar.disabled = false;
  btnSalvar.textContent = 'Salvar Estampa';

  if (error) {
    console.error(error);
    mostrarMsg('Erro ao salvar. Verifique os dados.');
    return;
  }

  fecharModal();
  await carregarEstampas();
}

// -------- EXCLUIR --------
async function excluirEstampa(id) {
  const e = estampasCache.find(x => x.id === id);
  if (!e) return;

  if (!confirm(`Excluir a estampa "${e.nome}"?\n\nAtenção: se ela estiver sendo usada em alguma variação de produto, a exclusão pode falhar.`)) return;

  const { error } = await sb.from('estampas').delete().eq('id', id);
  if (error) {
    console.error(error);
    alert('Erro ao excluir. A estampa pode estar vinculada a alguma variação de produto.');
    return;
  }

  await carregarEstampas();
}

// -------- EVENTOS --------
if (btnNova)        btnNova.addEventListener('click', abrirNovo);
if (btnFecharModal) btnFecharModal.addEventListener('click', fecharModal);
if (btnCancelar)    btnCancelar.addEventListener('click', fecharModal);
if (formEstampa)    formEstampa.addEventListener('submit', salvarEstampa);

if (modal) {
  modal.addEventListener('click', (ev) => {
    if (ev.target === modal) fecharModal();
  });
}

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && modal.classList.contains('aberto')) fecharModal();
});

// -------- INICIALIZAÇÃO --------
(async () => {
  setTimeout(async () => {
    if (!listaEstampas) return;
    await carregarColecoes();
    await carregarEstampas();
  }, 300);
})();
