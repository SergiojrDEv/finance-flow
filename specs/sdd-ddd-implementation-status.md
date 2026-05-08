# Status da trilha SDD/DDD/TypeScript

## Objetivo

Evoluir o Finance Flow sem repetir o erro de acoplar arquitetura nova diretamente no boot, login e renderizacao principal.

## Concluido

- Especificacoes por dominio criadas em `specs/domains`.
- ADRs para SDD/DDD, shadow mode, TypeScript gradual e configuracao Supabase.
- Camadas `domain`, `application`, `infrastructure` e `composition` criadas.
- Casos de uso de criacao, criacao em serie, edicao e exclusao de lancamentos.
- Contrato padrao de resultado da camada de aplicacao iniciado em `src/application/shared/result.js` e aplicado aos casos de uso de lancamentos, catalogo, orcamento, metas e autenticacao.
- Selector puro para listagem de lancamentos do mes, com filtro, busca, ordenacao e compatibilidade com dados antigos.
- Builder puro para serie de lancamentos, parcelas e recorrencia, consumido pela UI.
- Camada `src/application` verificada sem dependencia direta de DOM, `localStorage`, Supabase ou `src/core`.
- Casos de uso de categorias, etiquetas e orcamentos.
- Runtime de categorias e etiquetas conectado aos casos de uso de criacao, edicao e arquivamento.
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
- Primeiras contrapartes tipadas de ports de aplicacao criadas em TypeScript sem impacto no runtime.
- Build estatico preparado para transpilar `.ts` para `.js` quando TypeScript estiver instalado.
- Primeiro helper de aplicacao usado em runtime recebeu contraparte TypeScript para validar o caminho de migracao.
- Regras de formulario de lancamento receberam contraparte TypeScript com tipos explicitos, mantendo o runtime atual em JavaScript.
- Resumo financeiro do dashboard recebeu contraparte TypeScript com contrato tipado para totais, contagens, taxas e saude financeira.
- Ranking de maiores despesas por categoria recebeu contraparte TypeScript tipada para linhas e entradas do dashboard.
- Serie de fluxo dos ultimos meses recebeu contraparte TypeScript tipada para pontos de grafico e entradas mensais.
- Historico diario recebeu contraparte TypeScript tipada para grupos, itens e totais por dia.
- Resumo de lancamentos do mes recebeu contraparte TypeScript tipada para status, pagamentos e totais.
- Visao de orcamento por categoria recebeu contraparte TypeScript tipada para regras, uso semanal/mensal e status.
- Insights do dashboard receberam contraparte TypeScript tipada para alertas de vencimento, orcamento e investimento.
- CI de qualidade criado para testes e typecheck.
- Guardrail automatico de arquitetura criado para impedir que `src/application` dependa de DOM, Supabase, `localStorage`, UI ou infraestrutura.
- Guardrail automatico de contrato criado para impedir retornos manuais `{ ok: ... }` fora de `src/application/shared/result.js`.
- Hardening inicial:
  - sanitizacao de cores em CSS inline;
  - Worker Cloudflare com endpoint `/api/config` para config Supabase por ambiente;
  - carregamento de config Supabase extraido para infraestrutura testavel;
  - frontend tentando `/api/config` antes de fallback temporario.
- Mapeamento legacy de transacoes Supabase extraido para infraestrutura testavel.
- Sync legacy de transacoes/settings Supabase extraido para repositorio de infraestrutura testavel.
- Persistencia de perfil do usuario Supabase extraida para repositorio de infraestrutura testavel.
- Verificacao de schema Supabase V2 extraida para repositorio de infraestrutura testavel.
- Hidratacao de snapshot Supabase V2 extraida para helper de infraestrutura testavel.
- Hidratacao de snapshot Supabase legacy extraida para helper de infraestrutura testavel.
- Decisoes de ciclo de sincronizacao com a nuvem extraidas para modulo puro de aplicacao.
- Montagem de payload legacy de sincronizacao extraida para helper de infraestrutura testavel.
- Montagem de payload V2 de catalogo/transacoes extraida para helper de infraestrutura testavel.
- Orquestracao de envio para nuvem extraida para servico de infraestrutura testavel.
- Orquestracao de leitura da nuvem extraida para servico de infraestrutura testavel.
- Adaptadores legacy obsoletos removidos da fachada Supabase.
- Aplicacao de resultado de leitura da nuvem no estado extraida para helper de aplicacao testavel.
- Aplicacao de inicio/conclusao de sincronizacao extraida para helper de aplicacao testavel.
- Texto de status da nuvem extraido para helper de aplicacao testavel.
- Decisao de disponibilidade de usuario/nuvem extraida para helper de aplicacao testavel.
- Parser de tipo do hash de autenticacao extraido para helper de aplicacao testavel.
- Decisao de estado inicial por hash de autenticacao extraida para helper de aplicacao testavel.
- Decisao de estado de sessao de autenticacao extraida para helper de aplicacao testavel.
- Decisao de disponibilidade inicial da conexao com a nuvem extraida para helper de aplicacao testavel.
- Decisao de prontidao da conexao com a nuvem extraida para helper de aplicacao testavel.
- Decisao de inicio de leitura da nuvem extraida para helper de aplicacao testavel.
- Decisao de conclusao de leitura da nuvem extraida para helper de aplicacao testavel.
- Decisao de tratamento de erro da nuvem extraida para helper de aplicacao testavel.
- Decisao de efeitos apos envio para nuvem extraida para helper de aplicacao testavel.

## Ainda falta

- Confirmar variaveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` no Cloudflare Worker publicado e remover `SUPABASE_FALLBACK_CONFIG` do bundle.
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
- o guardrail automatico de fronteira da camada `src/application` continuar passando;
- o guardrail automatico de contrato de resultado continuar passando;
- houver plano aprovado para remover fallback Supabase do bundle.
