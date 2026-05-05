# Especificacao: Sincronizacao Segura com a Nuvem

## Objetivo

Garantir que alteracoes de metas, regras de orcamento, categorias e lancamentos nao desaparecam apos atualizar a pagina ou apos uma falha parcial do Supabase.

## Problema

Em um app financeiro, a sincronizacao nao pode apagar dados remotos antes de confirmar que a nova versao dos mesmos dados foi gravada. Se a escrita falhar no meio do caminho, o usuario ve metas, regras ou investimentos sumirem no proximo carregamento.

## Regras

- Regras de orcamento devem ser atualizadas por categoria e periodo quando ja existirem.
- Novas regras de orcamento devem ser inseridas sem apagar previamente as existentes.
- Regras antigas so podem ser removidas depois que as regras atuais forem salvas com sucesso.
- Metas existentes devem ser atualizadas por id remoto quando houver id valido.
- Metas sem id remoto devem ser conciliadas por nome e categoria de investimento.
- Metas antigas devem ser arquivadas, nao apagadas fisicamente, depois que as metas atuais forem salvas com sucesso.
- O mapeamento entre catalogo e settings deve preservar valor acumulado, cor e estado arquivado das metas.

## Criterios de aceite

- Ao editar uma meta e atualizar a pagina, nome, categoria, alvo, cor e acumulado permanecem.
- Ao alterar uma regra semanal ou mensal, o valor permanece depois de atualizar a pagina.
- Se a escrita de uma meta ou regra falhar, o sync nao deve ter feito uma limpeza destrutiva antes.
- Investimentos associados a uma categoria de meta continuam visiveis apos sincronizacao.

## Fora de escopo

- Migrar auth/bootstrap para arquitetura nova.
- Trocar o runtime do app para TypeScript.
- Implementar fila offline completa de sincronizacao.
