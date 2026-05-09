import { OpenFinanceProvider } from "../../application/openfinance/ports/OpenFinanceProvider.js";

export const MOCK_INSTITUTIONS = [
  { id: "nubank", name: "Nubank", color: "#8a05be", mark: "N" },
  { id: "itau", name: "Itau Unibanco", color: "#ec7000", mark: "I" },
  { id: "inter", name: "Banco Inter", color: "#ff6b00", mark: "B" },
  { id: "bradesco", name: "Bradesco", color: "#cc092f", mark: "B" },
  { id: "bb", name: "Banco do Brasil", color: "#f8df00", mark: "B" },
  { id: "caixa", name: "Caixa Economica", color: "#0072bc", mark: "C" },
  { id: "xp", name: "XP Investimentos", color: "#111111", mark: "X" },
];

function institutionById(id) {
  return MOCK_INSTITUTIONS.find((institution) => institution.id === id) || MOCK_INSTITUTIONS[0];
}

export class MockOpenFinanceProvider extends OpenFinanceProvider {
  async connectInstitution({ institutionId = "nubank" } = {}) {
    const institution = institutionById(institutionId);
    return {
      provider: "mock",
      institutionId: institution.id,
      institutionName: institution.name,
      status: "connected",
      lastSyncAt: new Date().toISOString(),
    };
  }

  async fetchTransactions(connection) {
    const prefix = String(connection.institutionId || "mock");
    return [
      {
        externalId: `${prefix}-ifood`,
        description: "iFood Delivery",
        type: "expense",
        amount: 47.8,
        date: "2026-05-08",
      },
      {
        externalId: `${prefix}-uber`,
        description: "Uber",
        type: "expense",
        amount: 23.4,
        date: "2026-05-08",
      },
      {
        externalId: `${prefix}-salario`,
        description: "Salario empresa",
        type: "income",
        amount: 4500,
        date: "2026-05-05",
      },
    ];
  }
}
