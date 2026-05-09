# Spec: Fluxos guiados de aplicativo

## Objetivo

Tornar o Finance Flow mais facil para usuarios leigos, com textos de apoio, estados vazios acionaveis e telas com intencao clara, sem alterar regras financeiras, autenticacao, sincronizacao ou modelo de dados.

## Problema

O app ja possui estrutura funcional e base visual consistente, mas algumas areas ainda podem parecer tecnicas quando nao ha dados. Estados vazios simples como "nenhum lancamento" nao explicam o proximo passo e deixam o usuario sem orientacao.

## Principios

- Cada tela deve indicar o que o usuario pode fazer agora.
- Estados vazios devem explicar o motivo e sugerir um proximo passo.
- Textos devem ser curtos, diretos e em linguagem de app.
- A evolucao deve acontecer por cortes pequenos, com teste automatico.
- Nao tocar em login, boot, Supabase ou schema neste ciclo inicial.

## Criterios de aceite

- Dashboard, maiores despesas, alertas e historico diario possuem estados vazios com titulo e apoio.
- Os estados vazios usam um helper/template compartilhado para evitar textos soltos.
- O CSS possui suporte visual simples para titulo e texto de estado vazio.
- Build e testes continuam passando.

## Fora de escopo neste corte

- Alterar navegacao principal.
- Criar onboarding completo.
- Alterar estrutura do banco.
- Mudar calculos financeiros.
