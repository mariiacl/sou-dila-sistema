// ============================================
// SOU DILA — Lógica da tela de Produtos
// ============================================

// -------- ELEMENTOS --------
const listaProdutos   = document.getElementById('lista-produtos');
const contador        = document.getElementById('contador-produtos');
const btnNovo         = document.getElementById('btn-novo-produto');
const modal           = document.getElementById('modal-produto');
const modalTitulo     = document.getElementById('modal-titulo');
const btnFecharModal  = document.getElementById('btn-fechar-modal');
const btnCancelar     = document.getElementById('btn-cancelar');
const formProduto     = document.getElementById('form-produto');
const btnSalvar       = document.getElementById('btn-salvar');
const msgProduto      = document.getElementById('msg-produto');

// Campos do formulário
const campoId         = document.getElementById('produto-id');
const campoNome       = document.getElementById('produto-nome');
const campoDescricao  = document.getElementById('produto-descricao');
const campoCategoria  = document.getElementById('produto-categoria');
const campoColecao    = document.getElementById('produto-colecao');
const campoImagem     = document.getElementById('produto-imagem');

// -------- ESTADO --------
let produtosCache   = [];
let categoriasCache = [];
let colecoesCache   = [];

// -------- HELPERS --------
function mostrarMsg(msg, tipo = 'erro') {
  msgProduto.textContent = msg;
  msgProduto.style.color = tipo === 'erro' ? 'var(--cor-erro)' : 'var(--cor-sucesso)';
}

function limparMsg() {
  msgProduto.textContent = '';
}

function escaparHtml(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// -------- CARREGAR CATEGORIAS E COLEÇÕES --------
async function carregarListas() {
  // Categorias
  const { data: cats } = await sb.from('categorias').select('id, nome').order('nome');
  categoriasCache = cats || [];
  campoCategoria.innerHTML = '<option value="">— Selecione —</option>' +
    categoriasCache.map(c => `<option value="${c.id}">${escaparHtml(c.nome)}</option>`).join('');

  // Coleções
  const { data: cols } = await sb.from('colecoes').select('id, nome').order('nome');
  colecoesCache = cols || [];
  campoColecao.innerHTML = '<option value="">— Selecione —</option>' +
    colecoesCache.map(c => `<option value="${c.id}">${escaparHtml(c.nome)}</option>`).join('');
}

// -------- CARREGAR PRODUTOS --------
async function carregarProdutos() {
  listaProdutos.innerHTML = '<p class="vazio">Carregando...</p>';

  const { data, error } = await sb
    .from('produtos')
    .select('id, nome, descricao, imagem_url, ativo, categoria_id, colecao_id, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    listaProdutos.innerHTML = '<p class="vazio">Erro ao carregar produtos.</p>';
    return;
  }

  produtosCache = data || [];
  contador.textContent = `${produtosCache.length} produto${produtosCache.length === 1 ? '' : 's'}`;

  if (produtosCache.length === 0) {
    listaProdutos.innerHTML = '<p class="vazio">Nenhum produto cadastrado ainda. Clique em "+ Novo Produto" para começar.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'lista-produtos-grid';

  produtosCache.forEach(p => {
    const catNome = categoriasCache.find(c => c.id === p.categoria_id)?.nome;
    const colNome = colecoesCache.find(c => c.id === p.colecao_id)?.nome;

    const card = document.createElement('div');
    card.className = 'produto-card';
    card.innerHTML = `
      <div class="foto">
        ${p.imagem_url
          ? `<img src="${escaparHtml(p.imagem_url)}" alt="${escaparHtml(p.nome)}">`
          : '👕'}
      </div>
      <div class="info">
        <h4>${escaparHtml(p.nome)}</h4>
        <div class="tags">
          ${catNome ? `<span class="tag categoria">${escaparHtml(catNome)}</span>` : ''}
          ${colNome ? `<span class="tag colecao">${escaparHtml(colNome)}</span>` : ''}
        </div>
      </div>
      <div class="acoes">
        <button class="btn-icone editar" data-id="${p.id}" title="Editar">✏️</button>
        <button class="btn-icone excluir" data-id="${p.id}" title="Excluir">🗑️</button>
      </div>
    `;
    grid.appendChild(card);
  });

  listaProdutos.innerHTML = '';
  listaProdutos.appendChild(grid);

  // Eventos dos botões
  grid.querySelectorAll('.editar').forEach(btn => {
    btn.addEventListener('click', () => abrirEdicao(Number(btn.dataset.id)));
  });
  grid.querySelectorAll('.excluir').forEach(btn => {
    btn.addEventListener('click', () => excluirProduto(Number(btn.dataset.id)));
  });
}

// -------- ABRIR MODAL NOVO --------
function abrirNovo() {
  modalTitulo.textContent = 'Novo Produto';
  formProduto.reset();
  campoId.value = '';
  limparMsg();
  modal.classList.add('aberto');
  campoNome.focus();
}

// -------- ABRIR MODAL EDIÇÃO --------
function abrirEdicao(id) {
  const p = produtosCache.find(x => x.id === id);
  if (!p) return;

  modalTitulo.textContent = 'Editar Produto';
  campoId.value = p.id;
  campoNome.value = p.nome || '';
  campoDescricao.value = p.descricao || '';
  campoCategoria.value = p.categoria_id || '';
  campoColecao.value = p.colecao_id || '';
  campoImagem.value = p.imagem_url || '';
  limparMsg();
  modal.classList.add('aberto');
  campoNome.focus();
}

// -------- FECHAR MODAL --------
function fecharModal() {
  modal.classList.remove('aberto');
  limparMsg();
}

// -------- SALVAR PRODUTO --------
async function salvarProduto(e) {
  e.preventDefault();
  limparMsg();
  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  const id = campoId.value;
  const dados = {
    nome:        campoNome.value.trim(),
    descricao:   campoDescricao.value.trim() || null,
    categoria_id: campoCategoria.value ? Number(campoCategoria.value) : null,
    colecao_id:   campoColecao.value ? Number(campoColecao.value) : null,
    imagem_url:   campoImagem.value.trim() || null,
  };

  if (!dados.nome) {
    mostrarMsg('O nome do produto é obrigatório.');
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar Produto';
    return;
  }

  let error;
  if (id) {
    ({ error } = await sb.from('produtos').update(dados).eq('id', Number(id)));
  } else {
    ({ error } = await sb.from('produtos').insert([dados]));
  }

  btnSalvar.disabled = false;
  btnSalvar.textContent = 'Salvar Produto';

  if (error) {
    console.error(error);
    mostrarMsg('Erro ao salvar. Tente novamente.');
    return;
  }

  fecharModal();
  await carregarProdutos();
}

// -------- EXCLUIR PRODUTO --------
async function excluirProduto(id) {
  const p = produtosCache.find(x => x.id === id);
  if (!p) return;

  if (!confirm(`Excluir o produto "${p.nome}"?`)) return;

  const { error } = await sb.from('produtos').delete().eq('id', id);
  if (error) {
    console.error(error);
    alert('Erro ao excluir produto.');
    return;
  }

  await carregarProdutos();
}

// -------- EVENTOS --------
if (btnNovo)        btnNovo.addEventListener('click', abrirNovo);
if (btnFecharModal) btnFecharModal.addEventListener('click', fecharModal);
if (btnCancelar)    btnCancelar.addEventListener('click', fecharModal);
if (formProduto)    formProduto.addEventListener('submit', salvarProduto);

// Fecha modal clicando fora
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
  });
}

// Fecha modal com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('aberto')) fecharModal();
});

// -------- INICIALIZAÇÃO --------
(async () => {
  // Aguarda a sessão ser validada pelo auth.js
  setTimeout(async () => {
    if (!listaProdutos) return;
    await carregarListas();
    await carregarProdutos();
  }, 300);
})();
