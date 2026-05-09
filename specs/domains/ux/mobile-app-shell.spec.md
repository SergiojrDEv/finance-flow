# Spec: Shell mobile de aplicativo

Status: concluido

## Objetivo

Dar ao Finance Flow uma experiencia mobile mais parecida com aplicativo financeiro, mantendo o desktop estavel e sem alterar regras financeiras, autenticacao, sincronizacao ou banco.

## Problema

A base visual ja ficou mais compacta, mas no celular ainda falta uma separacao mais clara entre cabecalho, acao principal e navegacao inferior. A experiencia deve parecer menos "site responsivo" e mais app instalado.

## Principios

- O topo mobile deve parecer uma barra de app.
- A navegacao inferior deve usar rotulos curtos e escaneaveis.
- O conteudo deve manter respiro suficiente acima da barra inferior.
- Mudancas desta fase devem ser CSS/HTML de baixo risco.
- Desktop nao deve receber impacto visual forte nesta fase.

## Criterios de aceite

- No mobile, o topo usa fundo escuro, texto claro e acoes compactas.
- No mobile, a navegacao inferior usa rotulos curtos por item.
- A barra inferior preserva seis destinos principais sem criar abas repetidas.
- No mobile, dashboard e lancamentos usam cards compactos para reduzir rolagem.
- Build e testes continuam passando.

## Fora de escopo neste corte

- Redesenho completo do dashboard.
- Drawer flutuante de acao rapida.
- Alteracao de rotas, auth, Supabase ou schema.
