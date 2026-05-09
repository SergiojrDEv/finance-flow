const experiences = {
  income: {
    heroTitle: "Registre uma entrada de forma simples",
    heroCopy: "Use esta tela para cadastrar salarios, freelas, bonus e outras entradas sem carregar campos que so fazem sentido para despesas.",
    formTitle: "Nova receita",
    formCopy: "Informe a origem da entrada, a conta de destino e o valor recebido.",
    submitLabel: "Salvar receita",
    modalTitle: "Editar receita",
    modalCopy: "Atualize os dados principais desta entrada.",
  },
  investment: {
    heroTitle: "Registre um investimento com foco no aporte",
    heroCopy: "Aqui voce registra aportes e movimentacoes de investimento de forma direta, sem campos de pagamento ou repeticao desnecessarios.",
    formTitle: "Novo investimento",
    formCopy: "Informe a categoria de investimento, a conta de origem e o valor aplicado.",
    submitLabel: "Salvar investimento",
    modalTitle: "Editar investimento",
    modalCopy: "Atualize os dados principais deste aporte.",
  },
  expense: {
    heroTitle: "Cadastre uma despesa em uma tela dedicada",
    heroCopy: "Use esta area para registrar despesas com pagamento, parcelas, recorrencia e os detalhes que ajudam no controle do mes.",
    formTitle: "Nova despesa",
    formCopy: "Preencha os dados da despesa, incluindo vencimento, forma de pagamento e repeticao quando precisar.",
    submitLabel: "Salvar despesa",
    modalTitle: "Editar despesa",
    modalCopy: "Ajuste pagamento, vencimento e demais dados desta despesa.",
  },
};

export function getTypeExperience(type) {
  return experiences[type] || experiences.expense;
}
