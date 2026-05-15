# Finance Flow Mobile Handoff

## Status

A trilha web app-like esta concluida em 100% ate a Fase 21. O projeto web atual segue como fonte de comportamento validado, contratos de dominio e referencia visual antes da migracao mobile real.

## Base mobile

- Pasta alvo: `finance-flow-mobile_3/finance-flow-mobile`
- Stack encontrada: Expo, React Native, Expo Router, TypeScript, Zustand, Supabase e `lucide-react-native`.
- Telas existentes: inicio, carteira, orcamentos, metas, ajustes, lancamento e auth.

## O que reaproveitar do web

- Contratos puros de `src/application` e entidades de `src/domain`.
- Linguagem de app validada nas fases 1 a 21.
- Fluxos por intencao: lancar, revisar, acompanhar, organizar e conectar.
- Guardrails de testes antes de conectar qualquer fluxo critico.

## O que nao migrar automaticamente

- Auth e bootstrap sem uma fase propria de estabilizacao.
- Sync Supabase sem validar variaveis, schema V2 e persistencia local.
- Provider Open Finance real antes de manter o mock local confiavel.
- Layout web como copia direta; o mobile deve reinterpretar os padroes em componentes nativos.

## Sequencia recomendada

1. Validar que o app Expo sobe localmente.
2. Corrigir encoding, assets e rotas se necessario.
3. Criar tokens visuais mobile equivalentes ao web.
4. Alinhar home, carteira e lancamento ao fluxo app-like validado.
5. Conectar use cases de dominio por tela, mantendo shadow/guardrails.
6. So depois revisar auth, recuperacao de senha e sync V2.

## Pronto para iniciar

A proxima trilha deve ser aberta explicitamente como mobile React Native/Expo. A partir dela, as mudancas deixam de ser apenas web app-like e passam a alterar `finance-flow-mobile_3/finance-flow-mobile`.
