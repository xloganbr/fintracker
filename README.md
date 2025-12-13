# FinTracker - Gestão Financeira Pessoal

Sistema completo de gestão financeira pessoal desenvolvido com Next.js 14, TypeScript, Prisma e NextAuth.js.

## 🚀 Tecnologias

- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Componentes:** Shadcn/UI
- **Banco de Dados:** PostgreSQL 17
- **ORM:** Prisma
- **Autenticação:** NextAuth.js
- **Hash de Senhas:** Bcrypt

## 📋 Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL 17 instalado e rodando
- npm ou yarn

## 🔧 Instalação

### 1. Clone o repositório (ou navegue até o diretório do projeto)

```bash
cd fintracker
```

### 2. Instale as dependências

**IMPORTANTE:** Devido à política de execução do PowerShell, você precisará executar este comando no prompt de comando (CMD) ou ajustar a política de execução:

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
copy .env.example .env
```

Edite o arquivo `.env` e configure sua string de conexão do PostgreSQL:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/fintracker"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

**Dica:** Para gerar uma chave secreta segura, você pode usar:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Configure o banco de dados

Execute as migrações do Prisma para criar as tabelas:

```bash
npm run db:migrate
```

Quando solicitado, dê um nome para a migração (ex: "init").

### 5. Popule o banco com o usuário admin

Execute o script de seed para criar o usuário administrador padrão:

```bash
npm run db:seed
```

**Credenciais padrão do Admin:**
- Email: `admin@fintracker.com`
- Senha: `admin123`

⚠️ **IMPORTANTE:** Altere essas credenciais após o primeiro login!

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

## 📱 Funcionalidades

### MVP - Fase 1

- ✅ **Autenticação**
  - Login com email e senha
  - Sessão JWT
  - Proteção de rotas

- ✅ **Gerenciamento de Usuários (Admin)**
  - Listar todos os usuários
  - Criar novo usuário
  - Editar usuário existente
  - Excluir usuário
  - Sistema de roles (ADMIN/USER)

- ✅ **Interface Responsiva**
  - Design mobile-first
  - Tabelas em desktop
  - Cards em mobile
  - Menu lateral colapsável

## 🗂️ Estrutura do Projeto

```
fintracker/
├── app/
│   ├── admin/
│   │   ├── layout.tsx          # Layout do dashboard admin
│   │   └── users/
│   │       └── page.tsx        # Página de gerenciamento de usuários
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/  # Rotas do NextAuth
│   │   └── admin/
│   │       └── users/          # API de usuários
│   ├── login/
│   │   └── page.tsx            # Página de login
│   ├── globals.css             # Estilos globais
│   ├── layout.tsx              # Layout raiz
│   └── page.tsx                # Página inicial
├── components/
│   └── ui/                     # Componentes Shadcn/UI
├── lib/
│   ├── auth.ts                 # Configuração NextAuth
│   ├── prisma.ts               # Cliente Prisma
│   └── utils.ts                # Utilitários
├── prisma/
│   ├── schema.prisma           # Schema do banco
│   └── seed.ts                 # Script de seed
└── types/
    └── next-auth.d.ts          # Tipos TypeScript
```

## 🎨 Design

O sistema utiliza um esquema de cores profissional:
- **Primária:** Azul (#3B82F6)
- **Secundária:** Cinza
- **Background:** Branco/Cinza claro

## 🔒 Segurança

- Senhas hasheadas com bcrypt (10 rounds)
- Sessões JWT
- Proteção de rotas via middleware
- Validação de roles em todas as APIs admin
- Prevenção de auto-exclusão de admin

## 📝 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Cria build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa o linter
npm run db:migrate   # Executa migrações do Prisma
npm run db:push      # Push do schema sem criar migração
npm run db:seed      # Popula o banco com dados iniciais
npm run db:studio    # Abre Prisma Studio
```

## 🐛 Troubleshooting

### Erro de política de execução do PowerShell

Se você receber um erro sobre política de execução ao tentar rodar comandos npm, execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Ou use o Prompt de Comando (CMD) ao invés do PowerShell.

### Erro de conexão com o banco

Verifique se:
1. O PostgreSQL está rodando
2. As credenciais no `.env` estão corretas
3. O banco de dados `fintracker` foi criado

Para criar o banco manualmente:
```sql
CREATE DATABASE fintracker;
```

### Erro ao fazer login

Certifique-se de que:
1. O seed foi executado com sucesso
2. O `NEXTAUTH_SECRET` está configurado no `.env`
3. O `NEXTAUTH_URL` aponta para `http://localhost:3000`

## 🚧 Próximos Passos

- [ ] Dashboard com estatísticas
- [ ] Gerenciamento de transações
- [ ] Categorias de despesas
- [ ] Relatórios financeiros
- [ ] Gráficos e visualizações
- [ ] Exportação de dados

## 📄 Licença

Este projeto é privado e de uso pessoal.

## 👨‍💻 Desenvolvido com

- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Prisma
- NextAuth.js
