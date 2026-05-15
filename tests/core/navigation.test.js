import assert from "node:assert/strict";
import test from "node:test";
import {
  createNavigationModule,
  LAST_SECTION_KEY,
  VALID_SECTIONS,
} from "../../src/core/navigation.js";

function makeClassList() {
  return {
    toggles: [],
    toggle(name, active) {
      this.toggles.push([name, active]);
    },
  };
}

function makeDocument() {
  const sections = ["visao-geral", "novo-lancamento", "metas"].map((id) => ({
    id,
    classList: makeClassList(),
  }));
  const navItems = ["visao-geral", "novo-lancamento", "metas"].map((id) => ({
    dataset: { section: id },
    classList: makeClassList(),
  }));
  const elements = new Map([
    ["#app-screen-eyebrow", { textContent: "" }],
    ["#app-screen-title", { textContent: "" }],
    ["#app-screen-description", { textContent: "" }],
    ["#app-screen-primary-action", {
      textContent: "",
      dataset: {},
      attributes: {},
      classList: { add() {}, remove() {} },
      setAttribute(name, value) { this.attributes[name] = value; },
      removeAttribute(name) { delete this.attributes[name]; },
    }],
    ["#app-screen-secondary-action", {
      textContent: "",
      dataset: {},
      attributes: {},
      classList: { add() {}, remove() {} },
      setAttribute(name, value) { this.attributes[name] = value; },
      removeAttribute(name) { delete this.attributes[name]; },
    }],
  ]);

  return {
    body: { dataset: {} },
    sections,
    navItems,
    elements,
    querySelector(selector) {
      return this.elements.get(selector) || null;
    },
    querySelectorAll(selector) {
      if (selector === ".section") return this.sections;
      if (selector === ".nav-item") return this.navItems;
      if (selector === "[data-transaction-view]") return [];
      return [];
    },
  };
}

function makeStorage(initial = {}) {
  const values = { ...initial };
  return {
    getItem(key) {
      return values[key] || "";
    },
    setItem(key, value) {
      values[key] = value;
    },
    values,
  };
}

test("VALID_SECTIONS vem do contrato puro de navegacao", () => {
  assert.equal(VALID_SECTIONS.has("visao-geral"), true);
  assert.equal(VALID_SECTIONS.has("carteira"), true);
  assert.equal(VALID_SECTIONS.has("relatorios"), true);
});

test("setSectionFromHash aplica alias legado de lancamentos do mes", () => {
  const documentRef = makeDocument();
  const storage = makeStorage();
  const state = {};
  const nav = createNavigationModule({
    state,
    documentRef,
    locationRef: { hash: "#lancamentos-mes" },
    storage,
  });

  nav.setSectionFromHash();

  assert.equal(documentRef.body.dataset.section, "novo-lancamento");
  assert.equal(documentRef.body.dataset.transactionView, "month");
  assert.equal(state.transactionView, "month");
  assert.equal(storage.values[LAST_SECTION_KEY], "novo-lancamento");
});

test("setSectionFromHash usa secao salva quando hash esta vazio", () => {
  const documentRef = makeDocument();
  const storage = makeStorage({ [LAST_SECTION_KEY]: "metas" });
  const nav = createNavigationModule({
    state: {},
    documentRef,
    locationRef: { hash: "" },
    storage,
  });

  nav.setSectionFromHash();

  assert.equal(documentRef.body.dataset.section, "metas");
  assert.equal(documentRef.navItems.find((item) => item.dataset.section === "metas").classList.toggles.at(-1)[1], true);
  assert.equal(documentRef.elements.get("#app-screen-title").textContent, "Transforme aportes em objetivos visiveis");
  assert.equal(documentRef.elements.get("#app-screen-primary-action").dataset.screenActionIntent, "compose-investment");
});
