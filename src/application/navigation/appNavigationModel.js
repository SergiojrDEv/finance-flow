export const APP_ROUTES = Object.freeze([
  Object.freeze({
    id: "visao-geral",
    hash: "#visao-geral",
    label: "Visao geral",
    mobileLabel: "Inicio",
    role: "home",
    mobilePrimary: true,
  }),
  Object.freeze({
    id: "carteira",
    hash: "#carteira",
    label: "Carteira",
    mobileLabel: "Carteira",
    role: "wallet",
    mobilePrimary: true,
  }),
  Object.freeze({
    id: "novo-lancamento",
    hash: "#novo-lancamento",
    label: "Lancamentos",
    mobileLabel: "Lancar",
    role: "compose-transaction",
    mobilePrimary: true,
  }),
  Object.freeze({
    id: "orcamentos",
    hash: "#orcamentos",
    label: "Orcamentos",
    mobileLabel: "Limites",
    role: "planning",
    mobilePrimary: false,
  }),
  Object.freeze({
    id: "metas",
    hash: "#metas",
    label: "Metas",
    mobileLabel: "Metas",
    role: "goals",
    mobilePrimary: true,
  }),
  Object.freeze({
    id: "relatorios",
    hash: "#relatorios",
    label: "Relatorios",
    mobileLabel: "Historico",
    role: "history",
    mobilePrimary: false,
  }),
  Object.freeze({
    id: "ajustes",
    hash: "#ajustes",
    label: "Ajustes",
    mobileLabel: "Ajustes",
    role: "settings",
    mobilePrimary: true,
  }),
]);

const FALLBACK_SECTION = "visao-geral";
const SECTION_ALIASES = Object.freeze({
  lancamentos: "novo-lancamento",
  "lancamentos-mes": "novo-lancamento",
});

export function getAppRouteIds() {
  return APP_ROUTES.map((route) => route.id);
}

export function resolveAppSection({ hash = "", savedSection = "", fallback = FALLBACK_SECTION } = {}) {
  const ids = new Set(getAppRouteIds());
  const rawSectionId = String(hash || "").replace(/^#/, "");
  const aliasedSectionId = SECTION_ALIASES[rawSectionId] || rawSectionId;
  const fallbackSectionId = ids.has(fallback) ? fallback : FALLBACK_SECTION;
  const sectionId = ids.has(aliasedSectionId)
    ? aliasedSectionId
    : ids.has(savedSection)
      ? savedSection
      : fallbackSectionId;

  return {
    rawSectionId,
    sectionId,
    shouldPersist: ids.has(sectionId),
    transactionView: rawSectionId === "lancamentos-mes" ? "month" : null,
  };
}

export function buildAppNavigationModel({ activeSection = FALLBACK_SECTION } = {}) {
  const activeId = getAppRouteIds().includes(activeSection) ? activeSection : FALLBACK_SECTION;
  const routes = APP_ROUTES.map((route) => ({
    ...route,
    active: route.id === activeId,
  }));

  return {
    activeSection: activeId,
    routes,
    mobileRoutes: routes.filter((route) => route.mobilePrimary),
    secondaryRoutes: routes.filter((route) => !route.mobilePrimary),
  };
}
