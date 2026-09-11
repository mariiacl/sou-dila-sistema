// ============================================
// SOU DILA — Lógica da tela de Clientes
// ============================================

// -------- ELEMENTOS --------
const listaClientes   = document.getElementById('lista-clientes');
const contador        = document.getElementById('contador-clientes');
const btnNovo         = document.getElementById('btn-novo-cliente');
const campoBusca      = document.getElementById('busca-cliente');
const modal           = document.getElementById('modal-cliente');
const modalTitulo     = document.getElementById('modal-titulo');
const btnFecharModal  = document.getElementById('btn-fechar-modal');
const btnCancelar     = document.getElementById('btn-cancelar');
const formCliente     = document.getElementById('form-cliente');
const btnSalvar       = document.getElementById('btn-salvar');
const msgCliente      = document.getElementById('msg-cliente');

// Campos
const campoId         = document.getElementById('cliente-id');
const campoNome       = document.getElementById('cliente-nome');
const campoWhatsapp   = document.getElementById('cliente-whatsapp');
const campoInstagram  = document.getElementById('cliente-instagram');
const campoEmail      = document.getElementById('cliente-email');
const campoCidade     = document.getElementById('cliente-cidade');
const campoUf         = document.getElementById('cliente-uf');
const campoCep        = document.getElementById('cliente-cep');
const campoEndereco   = document.getElementById('cliente-endereco');
const campoObservacoes= document.getElementById('cliente-observacoes');

// -------- ESTADO --------
let clientesCache = [];
let filtroBusca   = '';

// -------- HELPERS --------
function mostrarMsg(msg, tipo = 'erro') {
  msgCliente.textContent = msg;
  msgCliente.style.color = tipo === 'erro' ? 'var(--cor-erro)' : 'var(--cor-sucesso)';
}

function limparMsg() {
  msgCliente.textContent = '';
}

function escaparHtml(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatarWhatsapp(numero) {
  if (!numero) return '';
  const nums = numero.replace(/\D/g, '');
  if (nums.length === 11) {
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`;
  }
  if (nums.length === 10) {
    return `(${nums.slice(0,2)}) ${nums.slice(2,6)}-${nums.slice(6)}`;
  }
  return numero;
}

function linkWhatsapp(numero) {
  if (!numero) return '';
  const nums = numero.replace(/\D/g, '');
  if (!nums) return '';
  const comPais = nums.startsWith('55') ? nums : `55${nums}`;
  return `https://wa.me/${comPais}`;
}

// -------- CARREGAR CLIENTES --------
async function carregarClientes() {
  listaClientes.innerHTML = '<p class="vazio">Carregando...</p>';

  const { data, error } = await sb
    .from('clientes')
    .select('id, nome, whatsapp, instagram, email, cidade, uf, cep, endereco, observacoes, created_at')
    .order('nome', { ascending: true });

  if (error) {
    console.error(error);
    listaClientes.innerHTML = '<p class="vazio">Erro ao carregar clientes.</p>';
    return;
  }

  clientesCache = data || [];
  renderizarLista();
}

// -------- RENDERIZAR LISTA --------
function renderizarLista() {
  let lista = clientesCache;

  // Filtro de busca
  if (filtroBusca) {
    const busca = filtroBusca.toLowerCase();
    lista = lista.filter(c =>
      (c.nome && c.nome.toLowerCase().includes(busca)) ||
      (c.whatsapp && c.whatsapp.toLowerCase().includes(busca)) ||
      (c.cidade && c.cidade.toLowerCase().includes(busca)) ||
      (c.instagram && c.instagram.toLowerCase().includes(busca))
    );
  }

  // Atualiza contador
  contador.textContent = `${lista.length} cliente${lista.length === 1 ? '' : 's'}`;

  if (lista.length === 0) {
    listaClientes.innerHTML = filtroBusca
      ? '<p class="vazio">Nenhum cliente encontrado para essa busca.</p>'
      : '<p class="vazio">Nenhum cliente cadastrado ainda. Clique em "+ Novo Cliente" para começar.</p>';
    return;
  }

  // Monta tabela
  const tabela = document.createElement('table');
  tabela.className = 'lista-clientes-tabela';

  tabela.innerHTML = `
    <thead>
      <tr>
        <th>Nome</th>
        <th>Contato</th>
        <th class="col-cidade">Cidade/UF</th>
        <th class="col-total">Instagram</th>
        <th style="text-align:right;">Ações</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = tabela.querySelector('tbody');

  lista.forEach(c => {
    const tr = document.createElement('tr');

    const whatsLink = c.whatsapp
      ? `<a href="${linkWhatsapp(c.whatsapp)}" target="_blank">${escaparHtml(formatarWhatsapp(c.whatsapp))}</a>`
      : '<span style="color:#aaa;">—</span>';

    const cidadeUf = [c.cidade, c.uf].filter(Boolean).join('/') || '—';
    const instagram = c.instagram
      ? `@${escaparHtml(c.instagram.replace('@', ''))}`
      : '—';

    tr.innerHTML = `
      <td>
        <span class="cliente-nome">${escaparHtml(c.nome)}</span>
      </td>
      <td>
        <div class="cliente-contato">📱 ${whatsLink}</div>
      </td>
      <td class="col-cidade">${escaparHtml(cidadeUf)}</td>
      <td class="col-total">${instagram}</td>
      <td>
        <div class="tabela-acoes">
          <button class="btn-icone editar" data-id="${c.id}" title="Editar">✏️</button>
          <button class="btn-icone excluir" data-id="${c.id}" title="Excluir">🗑️</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  listaClientes.innerHTML = '';
  listaClientes.appendChild(tabela);

  // Eventos
  tabela.querySelectorAll('.editar').forEach(btn => {
    btn.addEventListener('click', () => abrirEdicao(Number(btn.dataset.id)));
  });
  tabela.querySelectorAll('.excluir').forEach(btn => {
    btn.addEventListener('click', () => excluirCliente(Number(btn.dataset.id)));
  });
}

// -------- ABRIR MODAL NOVO --------
function abrirNovo() {
  modalTitulo.textContent = 'Novo Cliente';
  formCliente.reset();
  campoId.value = '';
  limparMsg();
  modal.classList.add('aberto');
  campoNome.focus();
}

// -------- ABRIR MODAL EDIÇÃO --------
function abrirEdicao(id) {
  const c = clientesCache.find(x => x.id === id);
  if (!c) return;

  modalTitulo.textContent = 'Editar Cliente';
  campoId.value = c.id;
  campoNome.value = c.nome || '';
  campoWhatsapp.value = c.whatsapp || '';
  campoInstagram.value = c.instagram || '';
  campoEmail.value = c.email || '';
  campoCidade.value = c.cidade || '';
  campoUf.value = c.uf || '';
  campoCep.value = c.cep || '';
  campoEndereco.value = c.endereco || '';
  campoObservacoes.value = c.observacoes || '';
  limparMsg();
  modal.classList.add('aberto');
  campoNome.focus();
}

// -------- FECHAR MODAL --------
function fecharModal() {
  modal.classList.remove('aberto');
  limparMsg();
}

// -------- SALVAR CLIENTE --------
async function salvarCliente(e) {
  e.preventDefault();
  limparMsg();
  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  const id = campoId.value;
  const dados = {
    nome:        campoNome.value.trim(),
    whatsapp:    campoWhatsapp.value.trim() || null,
    instagram:   campoInstagram.value.trim().replace('@', '') || null,
    email:       campoEmail.value.trim() || null,
    cidade:      campoCidade.value.trim() || null,
    uf:          campoUf.value.trim().toUpperCase() || null,
    cep:         campoCep.value.trim() || null,
    endereco:    campoEndereco.value.trim() || null,
    observacoes: campoObservacoes.value.trim() || null,
  };

  if (!dados.nome) {
    mostrarMsg('O nome do cliente é obrigatório.');
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar Cliente';
    return;
  }

  let error;
  if (id) {
    ({ error } = await sb.from('clientes').update(dados).eq('id', Number(id)));
  } else {
    ({ error } = await sb.from('clientes').insert([dados]));
  }

  btnSalvar.disabled = false;
  btnSalvar.textContent = 'Salvar Cliente';

  if (error) {
    console.error(error);
    mostrarMsg('Erro ao salvar. Tente novamente.');
    return;
  }

  fecharModal();
  await carregarClientes();
}

// -------- EXCLUIR CLIENTE --------
async function excluirCliente(id) {
  const c = clientesCache.find(x => x.id === id);
  if (!c) return;

  if (!confirm(`Excluir o cliente "${c.nome}"?`)) return;

  const { error } = await sb.from('clientes').delete().eq('id', id);
  if (error) {
    console.error(error);
    alert('Erro ao excluir cliente. Ele pode ter vendas vinculadas.');
    return;
  }

  await carregarClientes();
}

// -------- EVENTOS --------
if (btnNovo)        btnNovo.addEventListener('click', abrirNovo);
if (btnFecharModal) btnFecharModal.addEventListener('click', fecharModal);
if (btnCancelar)    btnCancelar.addEventListener('click', fecharModal);
if (formCliente)    formCliente.addEventListener('submit', salvarCliente);

// Busca em tempo real
if (campoBusca) {
  campoBusca.addEventListener('input', (e) => {
    filtroBusca = e.target.value.trim();
    renderizarLista();
  });
}

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

// Máscara básica de UF (2 caracteres maiúsculos)
if (campoUf) {
  campoUf.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().slice(0, 2);
  });
}

// -------- INICIALIZAÇÃO --------
(async () => {
  setTimeout(async () => {
    if (!listaClientes) return;
    await carregarClientes();
  }, 300);
})();
