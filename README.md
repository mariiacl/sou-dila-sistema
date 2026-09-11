# Sou Dila — Sistema de Gestão

Sistema interno de controle de vendas, estoque e finanças da **Sou Dila** (T-Shirts).

---

## 🌐 Acesso

Após ativar o GitHub Pages, o sistema fica disponível em:

**https://mariiacl.github.io/sou-dila-sistema/**

Substitua `SEU-USUARIO` pelo seu nome de usuário do GitHub.

---

## 🛠 Tecnologias

- **HTML + CSS + JavaScript** (puro, sem frameworks)
- **Supabase** (banco de dados + autenticação)
- **GitHub Pages** (hospedagem)

---

## 📁 Estrutura do projeto

## ✅ Funcionalidades

### V1 — Concluída
- [x] Login com e-mail e senha
- [x] Dashboard com faturamento, vendas, custos e lucro do mês
- [x] Logout
- [x] Segurança via RLS (Row Level Security)

### V2 — Em desenvolvimento
- [ ] Cadastro de clientes
- [ ] Cadastro de produtos e variações
- [ ] Registro de vendas
- [ ] Controle de estoque
- [ ] Contas a pagar/receber
- [ ] Relatórios
- [ ] Catálogo de estampas

---

## 🔒 Segurança

- Autenticação via **Supabase Auth**
- **RLS ativo** em todas as 15 tabelas
- Apenas usuários autenticados acessam os dados
- Chave `anon` pública (protegida por RLS)
- Nenhuma credencial sensível no código

---

## 📋 Banco de Dados

**15 tabelas:**

| Grupo | Tabelas |
|---|---|
| **Catálogo** | `categorias`, `colecoes`, `produtos`, `estampas`, `variacoes_produto` |
| **Vendas** | `vendas`, `itens_venda`, `formas_pagamento` |
| **Pessoas** | `clientes`, `usuarios` |
| **Estoque** | `estoque` |
| **Financeiro** | `entradas`, `saidas`, `contas_pagar`, `contas_receber` |

---

## 🚀 Como usar

1. Acesse a URL do sistema
2. Faça login com o e-mail e senha cadastrados no Supabase Auth
3. O dashboard mostrará automaticamente os dados do mês atual

---

## 📌 Observações

- Repositório público — **não** incluir credenciais sensíveis
- Sistema de uso interno da Sou Dila
- Backup do banco: painel do Supabase → Database → Backups

---

**Sou Dila © 2026** — Sistema interno
