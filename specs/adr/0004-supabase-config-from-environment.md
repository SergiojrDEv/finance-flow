# ADR 0004: Configuracao Supabase por ambiente

## Status

Aceita.

## Contexto

O app publicado no Cloudflare Worker ainda nao serve `/api/config`; por isso o bundle do frontend mantem um fallback publico de Supabase para nao quebrar login. A chave atual e uma publishable/anon key, nao uma `service_role`, mas manter configuracao fixa no bundle nao e o desenho ideal para um app financeiro.

## Decisao

Endpoints de configuracao devem ler `SUPABASE_URL` e `SUPABASE_ANON_KEY` do ambiente e falhar com erro 500 quando a configuracao nao existir.

O fallback no frontend so pode permanecer enquanto o Worker atual nao tiver endpoint de config ativo.

## Implementacao incremental

O Worker do Cloudflare passa a expor `/api/config` lendo `SUPABASE_URL` e `SUPABASE_ANON_KEY` do ambiente.

O frontend tenta `/api/config` antes de endpoints legados e continua com fallback temporario enquanto as variaveis do Worker nao forem confirmadas no ambiente publicado.

## Proximo passo

Confirmar que as variaveis existem no deploy Cloudflare publicado. Depois disso, remover `SUPABASE_FALLBACK_CONFIG` do bundle.
