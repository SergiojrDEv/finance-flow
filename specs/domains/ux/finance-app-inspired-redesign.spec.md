# Spec: Redesign inspirado em app financeiro

Status: em evolucao

## Objetivo

Aplicar uma linguagem visual mais proxima de aplicativos financeiros mobile, usando referencias de UI kits de financas como inspiracao, sem perder a identidade do Finance Flow.

## Principios

- Preservar azul escuro, amarelo da marca e cards limpos.
- Priorizar leitura de app no mobile.
- Reduzir sensacao de dashboard tecnico no primeiro contato.
- Manter login, Supabase, banco e regras financeiras fora do escopo.

## Criterios de aceite

- A visao geral deve ter um card principal de disponibilidade financeira.
- A home deve oferecer atalhos rapidos para receita, despesa, investimento e metas.
- Atalhos rapidos de receita, despesa e investimento devem abrir o lancamento no tipo correto.
- Cards de resumo devem ganhar icones textuais discretos e melhor hierarquia.
- Orcamentos e metas devem mostrar status/progresso em cards mais visuais, sem poluir a tela.
- O mobile deve parecer mais app e menos site responsivo.
- Build e testes devem continuar passando.

## Nova rodada app-first

Esta rodada evolui a fase anterior sem migrar o runtime para React, Angular ou outro framework. A referencia visual passa a ser usada como direcao de produto, mantendo o app atual em JavaScript modular ate que as regras estejam suficientemente isoladas.

### Fase 1 - Casca de app segura

- Home mais compacta, com hero de carteira e cards de resumo menos pesados.
- Atalhos de acao com leitura de app, sem duplicar fluxos.
- Navegacao mobile com o lancamento como acao principal.
- Nenhuma alteracao em autenticacao, Supabase, sync, schema ou regras financeiras.

### Fase 2 - Telas por intencao

- Receita deve ter formulario simples e sem campos de pagamento, vencimento ou recorrencia.
- Despesa deve concentrar pagamento, vencimento, parcelamento e recorrencia.
- Investimento deve focar aporte, destino, meta e origem.
- Metas devem parecer acompanhamento de objetivo, nao lancamento comum.

### Fase 3 - Leitura didatica para usuario leigo

- Incluir estados vazios e textos curtos que expliquem o proximo passo.
- Reduzir paineis repetitivos e mostrar detalhes sob demanda.
- Priorizar linguagem de aplicativo no mobile.

### Fase 4 - Preparacao para framework futuro

- Manter dominio, casos de uso, mapeadores e testes independentes da UI.
- Evitar conectar a nova arquitetura no bootstrap ou auth antes da hora.
- Permitir migracao futura para React, Angular ou app nativo sem reescrever regra financeira.

## Fora de escopo neste corte

- Alterar fluxo de autenticacao.
- Alterar schema ou sincronizacao.
- Copiar telas ou assets de terceiros.

## Evidencias

- Home com card principal de disponibilidade financeira.
- Atalhos rapidos de receita, despesa e investimento conectados ao formulario no tipo correto.
- Cards de resumo, orcamentos e metas com hierarquia visual mais proxima de app.
- Barra inferior e topo mobile preparados para leitura de aplicativo.
- Guardrails automaticos cobrindo CSS, HTML e comportamento dos atalhos.
- Iteracao app-first iniciada com casca visual mobile mais compacta e acao de lancamento destacada na barra inferior.
