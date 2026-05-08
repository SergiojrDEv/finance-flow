# ADR 0004: Configuracao Supabase por ambiente

## Status

Aceita.

## Contexto

O app publicado no Cloudflare Worker serve `/api/config`. Manter configuracao fixa no bundle nao e o desenho ideal para um app financeiro, mesmo quando a chave e publishable/anon e nao `service_role`.

## Decisao

Endpoints de configuracao devem ler `SUPABASE_URL` e `SUPABASE_ANON_KEY` do ambiente e falhar com erro 500 quando a configuracao nao existir.

O frontend nao deve manter fallback fixo de Supabase no bundle quando o Worker possuir endpoint de config ativo.

## Implementacao incremental

O Worker do Cloudflare passa a expor `/api/config` lendo `SUPABASE_URL` e `SUPABASE_ANON_KEY` do ambiente.

O frontend tenta `/api/config` antes de endpoints legados e pode receber configuracao explicita por `window.FINANCE_FLOW_SUPABASE` em ambiente controlado, mas nao carrega fallback fixo no bundle.

## Proximo passo

Manter `SUPABASE_URL` e `SUPABASE_ANON_KEY` configuradas no Cloudflare Worker publicado e validar `/api/config` apos cada mudanca de ambiente.
