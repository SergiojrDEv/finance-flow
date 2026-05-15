import {
  buildAppNavigationModel,
  getAppRouteIds,
  type AppNavigationModel,
} from "./appNavigationModel.js";

export type AppScreenActionIntent =
  | "compose-transaction"
  | "compose-investment"
  | "connect-bank"
  | "export-data"
  | "manage-account"
  | "manage-category"
  | "manage-goal"
  | "manage-tag"
  | "review-budget"
  | "review-history"
  | "review-month";

export type AppScreenAction = {
  readonly label: string;
  readonly href: string;
  readonly intent: AppScreenActionIntent;
};

export type AppScreenModel = {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly primaryAction: AppScreenAction;
  readonly secondaryActions: readonly AppScreenAction[];
};

export type AppShellModel = {
  readonly activeSection: string;
  readonly navigation: AppNavigationModel;
  readonly screen: AppScreenModel;
};

export type FrameworkShellView = {
  readonly activeSection: string;
  readonly header: {
    readonly eyebrow: string;
    readonly title: string;
    readonly description: string;
  };
  readonly actions: {
    readonly primary: AppScreenAction;
    readonly secondary: readonly AppScreenAction[];
  };
  readonly navigation: readonly {
    readonly id: string;
    readonly href: string;
    readonly label: string;
    readonly mobileLabel: string;
    readonly role: string;
    readonly active: boolean;
    readonly mobilePrimary: boolean;
  }[];
};

export const APP_SCREEN_COPY: Readonly<Record<string, Omit<AppScreenModel, "id">>> = Object.freeze({
  "visao-geral": Object.freeze({
    eyebrow: "Painel financeiro",
    title: "Organize seu dinheiro com clareza",
    description: "Veja disponibilidade, receitas, despesas e proximos passos do mes em uma tela compacta.",
    primaryAction: Object.freeze({ label: "Lancar movimento", href: "#novo-lancamento", intent: "compose-transaction" }),
    secondaryActions: Object.freeze([
      Object.freeze({ label: "Ver limites", href: "#orcamentos", intent: "review-budget" }),
      Object.freeze({ label: "Ver historico", href: "#relatorios", intent: "review-history" }),
    ]),
  }),
  carteira: Object.freeze({
    eyebrow: "Carteira",
    title: "Contas, cartoes e bancos em um lugar",
    description: "Acompanhe saldos locais e simule conexoes Open Finance antes de ligar um provider real.",
    primaryAction: Object.freeze({ label: "Conectar banco", href: "#carteira", intent: "connect-bank" }),
    secondaryActions: Object.freeze([
      Object.freeze({ label: "Adicionar conta", href: "#ajustes", intent: "manage-account" }),
    ]),
  }),
  "novo-lancamento": Object.freeze({
    eyebrow: "Lancamentos",
    title: "Cadastre um movimento",
    description: "Escolha receita, despesa ou investimento e registre apenas os campos que fazem sentido para esse tipo.",
    primaryAction: Object.freeze({ label: "Novo lancamento", href: "#novo-lancamento", intent: "compose-transaction" }),
    secondaryActions: Object.freeze([
      Object.freeze({ label: "Ver mes", href: "#lancamentos-mes", intent: "review-month" }),
    ]),
  }),
  orcamentos: Object.freeze({
    eyebrow: "Limites",
    title: "Combine regras semanais e mensais",
    description: "Defina quanto quer gastar por categoria e acompanhe sinais de estouro sem perder o fechamento do mes.",
    primaryAction: Object.freeze({ label: "Ajustar categorias", href: "#ajustes", intent: "manage-category" }),
    secondaryActions: Object.freeze([]),
  }),
  metas: Object.freeze({
    eyebrow: "Planejamento",
    title: "Transforme aportes em objetivos visiveis",
    description: "Crie metas e acompanhe o progresso sem misturar seus aportes com despesas comuns.",
    primaryAction: Object.freeze({ label: "Lancar aporte", href: "#novo-lancamento", intent: "compose-investment" }),
    secondaryActions: Object.freeze([
      Object.freeze({ label: "Criar meta", href: "#metas", intent: "manage-goal" }),
    ]),
  }),
  relatorios: Object.freeze({
    eyebrow: "Historico diario",
    title: "Tudo o que entrou e saiu por dia",
    description: "Use o historico como linha do tempo para conferir receitas, despesas e investimentos do mes selecionado.",
    primaryAction: Object.freeze({ label: "Exportar dados", href: "#relatorios", intent: "export-data" }),
    secondaryActions: Object.freeze([
      Object.freeze({ label: "Criar lancamento", href: "#novo-lancamento", intent: "compose-transaction" }),
    ]),
  }),
  ajustes: Object.freeze({
    eyebrow: "Organizacao",
    title: "Personalize seu plano financeiro",
    description: "Edite categorias, etiquetas, contas, cartoes e metas para o app refletir sua rotina real.",
    primaryAction: Object.freeze({ label: "Criar categoria", href: "#ajustes", intent: "manage-category" }),
    secondaryActions: Object.freeze([
      Object.freeze({ label: "Criar etiqueta", href: "#ajustes", intent: "manage-tag" }),
    ]),
  }),
});

export function getAppScreenModel(sectionId = "visao-geral"): AppScreenModel {
  const ids = getAppRouteIds();
  const id = ids.includes(sectionId) ? sectionId : "visao-geral";

  return {
    id,
    ...APP_SCREEN_COPY[id],
  };
}

export function buildAppShellModel({
  activeSection = "visao-geral",
}: { readonly activeSection?: string } = {}): AppShellModel {
  const navigation = buildAppNavigationModel({ activeSection });
  const screen = getAppScreenModel(navigation.activeSection);

  return {
    activeSection: navigation.activeSection,
    navigation,
    screen,
  };
}

export function buildFrameworkShellView({
  activeSection = "visao-geral",
}: { readonly activeSection?: string } = {}): FrameworkShellView {
  const shell = buildAppShellModel({ activeSection });

  return {
    activeSection: shell.activeSection,
    header: {
      eyebrow: shell.screen.eyebrow,
      title: shell.screen.title,
      description: shell.screen.description,
    },
    actions: {
      primary: shell.screen.primaryAction,
      secondary: shell.screen.secondaryActions,
    },
    navigation: shell.navigation.routes.map((route) => ({
      id: route.id,
      href: route.hash,
      label: route.label,
      mobileLabel: route.mobileLabel,
      role: route.role,
      active: route.active,
      mobilePrimary: route.mobilePrimary,
    })),
  };
}
