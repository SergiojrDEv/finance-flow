# Spec: Design System e experiencia de aplicativo

## Objetivo

Preparar o Finance Flow para evoluir visualmente como um aplicativo financeiro simples, compacto e didatico, sem perder a identidade atual nem quebrar os fluxos ja estabilizados.

## Problema

O produto ja possui boa cobertura de regras e dados, mas a experiencia visual ainda pode parecer repetitiva ou tecnica demais para usuarios leigos. Antes de redesenhar telas, o app precisa de uma base visual consistente para cores, raios, espacamentos, botoes, paineis, cards e estados.

## Principios

- O painel principal deve ser escaneavel e direto.
- Receita, despesa, investimento, metas e ajustes devem ter hierarquia visual propria.
- Formularios devem parecer fluxos de app, nao planilhas.
- Cards devem ser compactos, com raio discreto e boa densidade.
- Acoes destrutivas devem continuar visualmente claras.
- Mudancas de design nao devem alterar regras financeiras, login, sync ou armazenamento.

## Tokens iniciais

- Cores semanticas: fundo, superficie, texto, mutado, borda, sucesso/receita, erro/despesa, investimento, saldo e destaque.
- Raios:
  - `--radius-xs`: detalhes pequenos.
  - `--radius-sm`: chips e controles pequenos.
  - `--radius-md`: paineis, cards, campos e botoes.
  - `--radius-pill`: pills e chips circulares.
- Espacamentos:
  - `--space-1` a `--space-7`, para reduzir valores soltos e facilitar compactacao futura.

## Criterios de aceite

- `src/styles.css` possui tokens semanticos de design em `:root`.
- Cards e paineis principais usam raio de ate 8px.
- Pills/chips podem continuar com raio circular.
- Nao ha `letter-spacing` negativo.
- Build e testes continuam passando.

## Fora de escopo neste corte

- Redesenho completo do dashboard.
- Navegacao mobile nova.
- Alteracao de HTML estrutural das telas.
- Mudanca de regras de negocio.
