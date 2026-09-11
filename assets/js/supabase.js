// ============================================
// SOU DILA — Configuração do Supabase
// Arquivo compartilhado entre todas as telas
// ============================================

const SUPABASE_URL = 'https://godmhdwhskxwijlrwqja.supabase.co';

// ⚠️ COLE AQUI SUA ANON KEY (a chave longa começando com "eyJ...")
// Pega em: Supabase → Settings → API → anon public
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZG1oZHdoc2t4d2lqbHJ3cWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzA1MzksImV4cCI6MjEwNDYwNjUzOX0.shyjbygr--ne8FYX4Xfkw_ketU-w-v4-ki0gYU4tsok';

// Cria o cliente Supabase (usado por todos os arquivos)
const { createClient } = window.supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
