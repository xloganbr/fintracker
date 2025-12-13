# FinTracker - Guia Rápido de Instalação

## ⚡ Início Rápido

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar banco de dados

Crie o arquivo `.env` na raiz do projeto:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/fintracker"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Criar banco de dados

No PostgreSQL:
```sql
CREATE DATABASE fintracker;
```

### 4. Executar migrações
```bash
npm run db:migrate
```

### 5. Popular com dados iniciais
```bash
npm run db:seed
```

### 6. Iniciar servidor
```bash
npm run dev
```

### 7. Acessar aplicação

Abra [http://localhost:3000](http://localhost:3000)

**Login:**
- Email: `admin@fintracker.com`
- Senha: `admin123`

## 🔧 Comandos Úteis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run db:migrate   # Migrações
npm run db:seed      # Seed
npm run db:studio    # Prisma Studio
```

## ⚠️ Problemas Comuns

**PowerShell bloqueado?**
Use o CMD ou execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Erro de conexão?**
Verifique se o PostgreSQL está rodando e as credenciais no `.env` estão corretas.

Para mais detalhes, consulte o [README.md](README.md)
