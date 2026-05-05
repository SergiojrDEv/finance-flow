import assert from "node:assert/strict";
import test from "node:test";
import { Category } from "../../../src/domain/catalog/Category.js";
import { LocalCategoryRepository } from "../../../src/infrastructure/catalog/LocalCategoryRepository.js";

function createStore(initial = []) {
  let rows = [...initial];
  return {
    readCategories: () => rows,
    writeCategories: (nextRows) => {
      rows = nextRows;
    },
  };
}

test("salva categoria local", async () => {
  const store = createStore();
  const repository = new LocalCategoryRepository({ ...store, createId: () => "cat-local-1" });
  const category = Category.create({
    kind: "expense",
    slug: "pets",
    name: "Pets",
    color: "#0b7285",
    monthlyLimit: 200,
  }).value;

  const saved = await repository.save(category);

  assert.equal(saved.id, "cat-local-1");
  assert.equal(store.readCategories().length, 1);
});

test("busca e atualiza categoria local", async () => {
  const store = createStore([{ id: "cat-1", kind: "expense", slug: "pets", name: "Pets", color: "#667085", monthlyLimit: 100 }]);
  const repository = new LocalCategoryRepository({ ...store });

  assert.equal((await repository.findByKindAndSlug("expense", "pets")).id, "cat-1");

  const updated = await repository.update("cat-1", { id: "cat-1", kind: "expense", slug: "pets", name: "Animais" });

  assert.equal(updated.name, "Animais");
  assert.equal(store.readCategories()[0].name, "Animais");
});

test("exige funcoes de leitura e escrita de categorias", () => {
  assert.throws(
    () => new LocalCategoryRepository({ readCategories: () => [] }),
    /writeCategories e obrigatorio/
  );
});
