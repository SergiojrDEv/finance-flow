import { BankConnectionRepository } from "../../application/openfinance/ports/BankConnectionRepository.js";

function serializeConnection(connection) {
  return typeof connection.toJSON === "function" ? connection.toJSON() : { ...connection };
}

export class LocalBankConnectionRepository extends BankConnectionRepository {
  constructor({ readConnections, writeConnections, createId = () => crypto.randomUUID() } = {}) {
    super();

    if (typeof readConnections !== "function") throw new Error("readConnections e obrigatorio.");
    if (typeof writeConnections !== "function") throw new Error("writeConnections e obrigatorio.");

    this.readConnections = readConnections;
    this.writeConnections = writeConnections;
    this.createId = createId;
  }

  async save(connection) {
    const saved = {
      ...serializeConnection(connection),
      id: connection.id || this.createId(connection),
    };
    const current = this.readConnections();
    const existingIndex = current.findIndex((item) => item.id === saved.id);
    const next = existingIndex >= 0 ? [...current] : [...current, saved];
    if (existingIndex >= 0) next[existingIndex] = saved;
    this.writeConnections(next);
    return saved;
  }

  async findById(id) {
    return this.readConnections().find((connection) => connection.id === id) || null;
  }

  async listByUser(userId) {
    return this.readConnections().filter((connection) => connection.userId === userId);
  }

  async deleteById(id) {
    const before = this.readConnections();
    const next = before.filter((connection) => connection.id !== id);
    this.writeConnections(next);
    return before.length !== next.length;
  }
}
