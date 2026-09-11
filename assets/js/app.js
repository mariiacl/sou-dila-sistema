// ============================================
// SOU DILA — Lógica do Sistema
// ============================================

// -------- CONFIGURAÇÃO DO SUPABASE --------
const SUPABASE_URL = 'https://godmhdwhskxwijlrwqja.supabase.co';

// ⚠️ COLE AQUI SUA ANON KEY (a chave longa começando com "eyJ...")
// Pega em: Supabase → Settings → API → anon public
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZG1oZHdoc2t4d2lqbHJ3cWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzA1MzksImV4cCI6MjEwNDYwNjUzOX0.shyjbygr--ne8FYX4Xfkw_ketU-w-v4-ki0gYU4tsok';

// -------- INICIALIZAÇÃO --------
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------- ELEMENTOS DA TELA --------
const telaLogin = document.getElementById('tela-login');
const telaDashboard = document.getElementById('tela-dashboard');
const formLogin = document.getElementById('form-login');
const btnEntrar = document.getElementById('btn-entrar');
const msgLogin = document.getElementById('msg-login');
const btnSair = document.getElementById('btn-sair');
const usuarioEmail = document.getElementById('usuario-email');

// -------- HELPERS --------
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
}

function mostrarErro(msg) {
  msgLogin.textContent = msg;
}

function limparErro() {
  msgLogin.textContent = '';
}

// -------- LOGIN --------
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  limparErro();
  btnEntrar.disabled = true;
  btnEntrar.textContent = 'Entrando...';

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  const { data, error } = await sb.auth.signInWithPassword({
    email: email,
    password: senha
  });

  btnEntrar.disabled = false;
  btnEntrar.textContent = 'Entrar';

  if (error) {
    mostrarErro('E-mail ou senha incorretos.');
    console.error(error);
    return;
  }

  // Login OK
  entrarNoDashboard(data.user);
});

// -------- LOGOUT --------
btnSair.addEventListener('click', async () => {
  await sb.auth.signOut();
  telaDashboard.classList.add('escondido');
  telaLogin.classList.remove('escondido');
  formLogin.reset();
});

// -------- ENTRAR NO DASHBOARD --------
async function entrarNoDashboard(user) {
  telaLogin.classList.add('escondido');
  telaDashboard.classList.remove('escondido');
  usuarioEmail.textContent = user.email;

  await carregarDashboard();
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

  // Atualiza cards
  document.getElementById('card-faturamento').textContent = formatarMoeda(faturamento);
  document.getElementById('card-vendas').textContent = qtdVendas;
  document.getElementById('card-custos').textContent = formatarMoeda(custos);
  document.getElementById('card-lucro').textContent = formatarMoeda(lucro);
}

// -------- VERIFICA SESSÃO AO ABRIR --------
(async () => {
  const { data: { session } } = await sb.auth.getSession();

  if (session) {
    entrarNoDashboard(session.user);
  }
})();
