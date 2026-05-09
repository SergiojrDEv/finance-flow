# Spec: Redesign inspirado em app financeiro

Status: pronto

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
