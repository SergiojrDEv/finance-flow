# Finance Flow — App Mobile

Migração do projeto web Finance Flow para React Native com Expo.

## Stack (100% gratuita)

| Camada | Tecnologia |
|--------|-----------|
| Mobile | Expo + React Native |
| Navegação | Expo Router |
| UI | StyleSheet nativo + Lucide icons |
| Gráficos | Victory Native |
| Estado | Zustand + AsyncStorage |
| Auth | Supabase Auth + SecureStore |
| Banco | Supabase (PostgreSQL) |
| Deploy | Expo Go (dev) / EAS Build (prod) |

## Estrutura de pastas

```
finance-flow-mobile/
├── app/
│   ├── _layout.tsx          # Root layout + auth guard
│   ├── (auth)/
│   │   └── login.tsx        # Login / cadastro / recuperação
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab bar (5 tabs)
│   │   ├── index.tsx        # Visão geral (dashboard)
│   │   ├── carteira.tsx     # Extrato de transações
│   │   ├── orcamentos.tsx   # Limites por categoria
│   │   ├── metas.tsx        # Metas de poupança
│   │   └── ajustes.tsx      # Configurações e conta
│   └── modal/
│       └── lancamento.tsx   # Modal de novo lançamento
├── components/
│   └── ui/
│       ├── index.tsx        # Componentes base (brl, CatIcon, etc.)
│       └── TransactionRow.tsx
├── hooks/
│   └── useSupabaseSync.ts   # Sincronização Supabase
├── infrastructure/
│   └── storage/
│       └── AsyncStorageAdapter.ts  # Substitui localStorage
├── lib/
│   └── supabase.ts          # Cliente Supabase
├── src/                     # ← COPIADO DO PROJETO WEB (sem alteração)
│   ├── application/         # Use cases, build functions
│   ├── domain/              # Entidades puras
│   ├── dashboard/           # Presenters
│   └── core/                # state.js, utils.js
├── stores/
│   ├── useAppStore.ts       # Zustand (transações, metas, settings)
│   └── useAuthStore.ts      # Zustand (sessão Supabase)
└── types/
    └── index.ts             # Tipos TypeScript
```

## Configuração inicial

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

Edite `.env` com suas chaves do Supabase:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3. Executar o schema no Supabase
No painel do Supabase → SQL Editor, cole e execute o arquivo `docs/supabase-schema-v2.sql` do projeto web original.

### 4. Copiar o src/ do projeto web
Copie as pastas `src/application/`, `src/domain/`, `src/dashboard/` e `src/core/` do projeto web para `src/` deste projeto.

### 5. Rodar o app
```bash
npx expo start
```

- Escaneie o QR code com o app **Expo Go** no celular
- Pressione `i` para iOS Simulator
- Pressione `a` para Android Emulator

## Telas disponíveis

| Tela | Seção web equivalente | Funcionalidade |
|------|----------------------|----------------|
| Dashboard | `#visao-geral` | Saldo, saúde financeira, orçamentos, alertas |
| Carteira | `#carteira` | Extrato com filtros e busca |
| Orçamentos | `#orcamentos` | Limites semanais/mensais por categoria |
| Metas | `#metas` | Poupança e investimento com progresso |
| Ajustes | `#ajustes` | Conta, categorias, preferências |
| Modal lançamento | `#novo-lancamento` | Despesa, receita e investimento |

## Lógica de negócio reutilizada sem alteração

As seguintes funções do projeto web são importadas diretamente:

- `buildFinancialSummary()` — cálculo de totais e saúde financeira
- `buildBudgetOverview()` — status de orçamentos por categoria  
- `buildDashboardInsights()` — alertas e insights automáticos
- `buildCashflowSeries()` — série temporal para gráficos
- `buildCategoryBreakdown()` — distribuição por categoria
- `buildSmartDashboardView()` — copy inteligente do dashboard
- Todos os use cases de `application/goals/` e `application/budget/`

## Próximos passos

- [ ] Adicionar Victory Native charts (gráfico de área no dashboard)
- [ ] Tela de relatórios com buildCashflowSeries
- [ ] Open Banking via Pluggy (sandbox gratuito)
- [ ] Push notifications com Expo Notifications
- [ ] Build para produção com EAS Build (gratuito)
