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
- Lancamentos V2 devem ser planejados em uma camada pura antes de chamar o Supabase.
- Lancamentos locais com id devem gerar upsert em `transactions_v2`.
- Lancamentos remotos que nao existem mais localmente so podem ser removidos depois que os upserts atuais forem planejados.
- Contas, categorias, etiquetas, cartoes, orcamentos e metas devem ser mapeados para linhas V2 por funcoes puras antes das chamadas Supabase.
- O mapeamento entre catalogo e settings deve preservar valor acumulado, cor e estado arquivado das metas.
- Se houver alteracao local ainda nao confirmada na nuvem, o pull silencioso do Supabase nao pode sobrescrever o cache local.
- Se uma sincronizacao for solicitada enquanto outra estiver em andamento, a nova tentativa deve ficar pendente e rodar ao final da atual.

## Criterios de aceite

- Ao editar uma meta e atualizar a pagina, nome, categoria, alvo, cor e acumulado permanecem.
- Ao alterar uma regra semanal ou mensal, o valor permanece depois de atualizar a pagina.
- Se a escrita de uma meta ou regra falhar, o sync nao deve ter feito uma limpeza destrutiva antes.
- Investimentos associados a uma categoria de meta continuam visiveis apos sincronizacao.
- Receita criada localmente continua visivel apos refresh, mesmo que a sincronizacao anterior ainda nao tenha terminado.
- O mapeamento de receita, despesa e investimento para `transactions_v2` preserva tipo, status, valor, datas, categoria, subcategoria, conta e forma de pagamento.
- O mapeamento de catalogo para V2 preserva limites mensais, cores, periodos de orcamento, valores atuais de metas e vinculos com categorias.

## Fora de escopo

- Migrar auth/bootstrap para arquitetura nova.
- Trocar o runtime do app para TypeScript.
- Implementar fila offline completa de sincronizacao.
