-- =============================================================
-- Migração: tabelas relacionais → user_data (formato mobile)
-- Execute este script no SQL Editor do Supabase
-- =============================================================

INSERT INTO user_data (
  user_id,
  transactions,
  goals,
  recurring_transactions,
  settings,
  has_onboarded,
  updated_at
)
SELECT
  u.id AS user_id,

  -- ── TRANSACTIONS ─────────────────────────────────────────────
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id',            t.id::text,
        'type',          CASE t.type
                           WHEN 'receita'    THEN 'income'
                           WHEN 'despesa'    THEN 'expense'
                           WHEN 'income'     THEN 'income'
                           WHEN 'expense'    THEN 'expense'
                           WHEN 'investment' THEN 'investment'
                           ELSE 'expense'
                         END,
        'amount',        ABS(COALESCE(t.val, 0)),
        'category',      COALESCE(t.cat, t.subcat, 'outros'),
        'description',   COALESCE(t.descricao, ''),
        'date',          COALESCE(t.date, to_char(CURRENT_DATE, 'YYYY-MM-DD')),
        'account',       COALESCE(t.account, 'Conta corrente'),
        'paymentMethod', COALESCE(t.payment_method, 'pix'),
        'status',        CASE t.status
                           WHEN 'paid'    THEN 'confirmed'
                           WHEN 'pending' THEN 'pending'
                           ELSE 'confirmed'
                         END,
        'notes',         t.notes,
        'createdAt',     COALESCE(t.created_at::text, now()::text)
      )
      ORDER BY t.created_at DESC
    )
    FROM transactions t
    WHERE t.user_id = u.id
      AND t.val IS NOT NULL
      AND t.val > 0
  ), '[]'::jsonb),

  -- ── GOALS ────────────────────────────────────────────────────
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id',            g.id::text,
        'name',          g.name,
        'key',           COALESCE(
                           (SELECT c.slug FROM categories c
                            WHERE c.id = g.linked_category_id LIMIT 1),
                           'renda-fixa'
                         ),
        'target',        g.target_amount,
        'currentAmount', g.current_amount,
        'color',         g.color,
        'isArchived',    g.is_archived
      )
    )
    FROM goals g
    WHERE g.user_id = u.id
  ), '[]'::jsonb),

  -- ── RECURRING TRANSACTIONS ────────────────────────────────────
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id',            r.id::text,
        'type',          r.transaction_kind,
        'amount',        r.amount,
        'category',      COALESCE(
                           (SELECT c.slug FROM categories c
                            WHERE c.id = r.category_id LIMIT 1),
                           'outros'
                         ),
        'description',   r.title,
        'dayOfMonth',    EXTRACT(day FROM r.starts_on)::int,
        'isActive',      (r.status = 'active'),
        'createdAt',     r.created_at::text,
        'paymentMethod', r.payment_method,
        'account',       COALESCE(
                           (SELECT a.name FROM accounts a
                            WHERE a.id = r.account_id LIMIT 1),
                           'Conta corrente'
                         )
      )
    )
    FROM recurring_rules r
    WHERE r.user_id = u.id
  ), '[]'::jsonb),

  -- ── SETTINGS (contas do usuário) ──────────────────────────────
  jsonb_build_object(
    'accounts', COALESCE((
      SELECT jsonb_agg(a.name ORDER BY a.created_at)
      FROM accounts a
      WHERE a.user_id = u.id AND a.is_archived = false
    ), '["Carteira","Conta corrente","Corretora"]'::jsonb),
    'creditCards', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id',         cc.id::text,
          'name',       cc.name,
          'closingDay', cc.closing_day,
          'dueDay',     cc.due_day
        )
      ), '[]'::jsonb)
      FROM credit_cards cc
      WHERE cc.user_id = u.id AND cc.is_archived = false
    ),
    'categories', '{}'::jsonb,
    'subcategories', '{}'::jsonb,
    'goals', '[]'::jsonb,
    'budgetRules', '{}'::jsonb
  ),

  true,  -- has_onboarded
  now()

FROM auth.users u
WHERE EXISTS (
  SELECT 1 FROM transactions t     WHERE t.user_id = u.id AND t.val > 0
  UNION ALL
  SELECT 1 FROM goals g            WHERE g.user_id = u.id
  UNION ALL
  SELECT 1 FROM recurring_rules r  WHERE r.user_id = u.id
)

ON CONFLICT (user_id) DO UPDATE SET
  transactions           = EXCLUDED.transactions,
  goals                  = EXCLUDED.goals,
  recurring_transactions = EXCLUDED.recurring_transactions,
  settings               = EXCLUDED.settings,
  has_onboarded          = true,
  updated_at             = now();

-- ── Verificar resultado ──────────────────────────────────────────
SELECT
  user_id,
  jsonb_array_length(transactions)           AS transacoes,
  jsonb_array_length(goals)                  AS metas,
  jsonb_array_length(recurring_transactions) AS recorrentes,
  has_onboarded,
  updated_at
FROM user_data;
