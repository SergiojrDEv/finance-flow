# Status da trilha SDD/DDD/TypeScript

## Objetivo

Evoluir o Finance Flow sem repetir o erro de acoplar arquitetura nova diretamente no boot, login e renderizacao principal.

## Concluido

- Especificacoes por dominio criadas em `specs/domains`.
- ADRs para SDD/DDD, shadow mode, TypeScript gradual e configuracao Supabase.
- Camadas `domain`, `application`, `infrastructure` e `composition` criadas.
- Casos de uso de criacao, criacao em serie, edicao e exclusao de lancamentos.
- Selector puro para listagem de lancamentos do mes, com filtro, busca, ordenacao e compatibilidade com dados antigos.
- Builder puro para serie de lancamentos, parcelas e recorrencia, consumido pela UI.
- Camada `src/application` verificada sem dependencia direta de DOM, `localStorage`, Supabase ou `src/core`.
- Casos de uso de categorias, etiquetas e orcamentos.
- Runtime de regras de orcamento conectado ao caso de uso e repositorio local.
- Runtime de metas conectado a casos de uso de criacao, edicao e arquivamento.
- Shadow mode para criacao de lancamentos e catalogo.
- Sync V2 separado em:
  - mapeadores puros;
  - planners puros;
  - portas de aplicacao;
  - repositorios Supabase de infraestrutura;
  - composition root.
- Validacao de autenticacao extraida para aplicacao.
- TypeScript preparado em modo gradual para camadas DDD.
- CI de qualidade criado para testes e typecheck.
- Hardening inicial:
  - sanitizacao de cores em CSS inline;
  - endpoints de config sem fallback hardcoded quando forem ativados.

## Ainda falta

- Ativar endpoint `/api/config` no Cloudflare Worker e remover `SUPABASE_FALLBACK_CONFIG` do bundle.
- Migrar edicao/exclusao de lancamentos da UI para os casos de uso, com shadow mode ou comparacao.
  - Feito: edicao e exclusao da UI passam por `UpdateTransactionUseCase` e `DeleteTransactionUseCase`.
- Migrar dashboard inteiro para selectors/application services puros.
  - Parcialmente feito: resumo financeiro, maiores despesas, alertas/insights, fluxo mensal, destaques, historico diario e orcamentos ja estao fora da UI.
- Criar testes de integracao de auth com mocks do Supabase.
  - Feito: `AuthSessionService` cobre login, cadastro, recuperacao e troca de senha com cliente mockavel.
- Converter arquivos da camada DDD para `.ts` por modulo.
- Separar backend real apenas quando os contratos estiverem maduros.
- Decidir backend futuro:
  - Go e uma boa escolha para API financeira transacional;
  - Node/Fastify ou NestJS pode acelerar se o frontend continuar JS/TS;
  - a decisao deve vir depois dos contratos de dominio e API.

## Criterio de conclusao da trilha atual

A trilha SDD/DDD/TypeScript inicial sera considerada completa quando:

- todas as linhas principais da matriz de rastreabilidade estiverem ao menos em `Validacao inicial`;
- sync, auth, dashboard, catalogo, orcamento e lancamentos tiverem regra principal fora da UI;
- CI rodar testes e typecheck;
- nenhuma parte nova depender diretamente de DOM, Supabase ou localStorage dentro de `src/domain` e `src/application`;
- houver plano aprovado para remover fallback Supabase do bundle.
