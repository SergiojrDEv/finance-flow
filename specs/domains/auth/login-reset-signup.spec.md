# Spec: Login, Cadastro e Recuperacao de Senha

## Objetivo

Garantir que login, cadastro e recuperacao de senha tenham fluxos separados e previsiveis.

## Regras

- Criar conta nao deve parecer recuperacao de senha.
- Recuperar senha deve levar o usuario a definir nova senha quando o provedor permitir.
- Link expirado deve mostrar mensagem clara.
- Erros de autenticacao devem ser exibidos sem quebrar a tela.
- Refresh da pagina nao deve apagar sessao valida sem necessidade.

## Criterios de aceite

- Botao entrar executa login.
- Botao criar conta executa cadastro.
- Botao esqueci a senha executa recuperacao.
- Cada fluxo tem mensagem propria de sucesso e erro.
- A tela nao fica branca quando Supabase retorna erro.
