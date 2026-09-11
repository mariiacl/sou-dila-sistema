// ============================================
// SOU DILA — Autenticação (login, logout, sessão)
// ============================================

// -------- ELEMENTOS (podem ou não existir na página) --------
const formLogin   = document.getElementById('form-login');
const btnEntrar   = document.getElementById('btn-entrar');
const msgLogin    = document.getElementById('msg-login');
const btnSair     = document.getElementById('btn-sair');
const usuarioEmail = document.getElementById('usuario-email');

// -------- HELPERS --------
function mostrarErro(msg) {
  if (msgLogin) msgLogin.textContent = msg;
}

function limparErro() {
  if (msgLogin) msgLogin.textContent = '';
}

// -------- LOGIN (só na index.html) --------
if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparErro();

    if (btnEntrar) {
      btnEntrar.disabled = true;
      btnEntrar.textContent = 'Entrando...';
    }

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    const { data, error } = await sb.auth.signInWithPassword({
      email: email,
      password: senha
    });

    if (btnEntrar) {
      btnEntrar.disabled = false;
      btnEntrar.textContent = 'Entrar';
    }

    if (error) {
      mostrarErro('E-mail ou senha incorretos.');
      console.error(error);
      return;
    }

    // Login OK → redireciona para o dashboard
    window.location.href = 'dashboard.html';
  });
}

// -------- LOGOUT (só nas telas internas) --------
if (btnSair) {
  btnSair.addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.href = 'index.html';
  });
}

// -------- PROTEÇÃO DE PÁGINA --------
// Se a página NÃO for a index.html, exige login
async function protegerPagina() {
  const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';

  // Páginas que NÃO precisam de login
  const paginasPublicas = ['index.html', ''];

  // Se for página pública → verifica se já está logado e redireciona
  if (paginasPublicas.includes(paginaAtual)) {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      window.location.href = 'dashboard.html';
    }
    return;
  }

  // Se for página interna → exige login
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  // Preenche o e-mail do usuário no topo (se o elemento existir)
  if (usuarioEmail) {
    usuarioEmail.textContent = session.user.email;
  }
}

// Executa a proteção ao carregar
protegerPagina();
