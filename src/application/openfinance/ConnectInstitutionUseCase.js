import { BankConnection } from "../../domain/openfinance/BankConnection.js";
import { fail, ok } from "../shared/result.js";

export class ConnectInstitutionUseCase {
  constructor({ connectionRepository, provider, clock = () => new Date() } = {}) {
    if (!connectionRepository || typeof connectionRepository.save !== "function") {
      throw new Error("connectionRepository.save e obrigatorio.");
    }
    if (!provider || typeof provider.connectInstitution !== "function") {
      throw new Error("provider.connectInstitution e obrigatorio.");
    }

    this.connectionRepository = connectionRepository;
    this.provider = provider;
    this.clock = clock;
  }

  async execute(draft = {}) {
    const providerConnection = await this.provider.connectInstitution(draft);
    const now = this.clock().toISOString();
    const creation = BankConnection.create({
      ...draft,
      ...providerConnection,
      provider: providerConnection.provider || draft.provider,
      institutionId: providerConnection.institutionId || draft.institutionId,
      institutionName: providerConnection.institutionName || draft.institutionName,
      createdAt: draft.createdAt || now,
      updatedAt: draft.updatedAt || now,
    });

    if (!creation.ok) return fail(creation.errors);

    return ok(await this.connectionRepository.save(creation.value));
  }
}
