import assert from "node:assert/strict";
import test from "node:test";
import { CategoryTag } from "../../../src/domain/catalog/CategoryTag.js";
import { LocalCategoryTagRepository } from "../../../src/infrastructure/catalog/LocalCategoryTagRepository.js";

function createStore(initial = []) {
  let rows = [...initial];
  return {
    readTags: () => rows,
    writeTags: (nextRows) => {
      rows = nextRows;
    },
  };
}

test("salva etiqueta local", async () => {
  const store = createStore();
  const repository = new LocalCategoryTagRepository({ ...store, createId: () => "tag-local-1" });
  const tag = CategoryTag.create({
    kind: "expense",
    categorySlug: "alimentacao",
    slug: "restaurante",
    name: "Restaurante",
    color: "#c43d4b",
  }).value;

  const saved = await repository.save(tag);

  assert.equal(saved.id, "tag-local-1");
  assert.equal(store.readTags().length, 1);
});

test("busca e atualiza etiqueta local", async () => {
  const store = createStore([{ id: "tag-1", kind: "expense", categorySlug: "alimentacao", slug: "restaurante", name: "Restaurante" }]);
  const repository = new LocalCategoryTagRepository({ ...store });

  assert.equal((await repository.findByKindCategoryAndSlug("expense", "alimentacao", "restaurante")).id, "tag-1");

  const updated = await repository.update("tag-1", { id: "tag-1", kind: "expense", categorySlug: "alimentacao", slug: "restaurante", name: "Restaurantes" });

  assert.equal(updated.name, "Restaurantes");
  assert.equal(store.readTags()[0].name, "Restaurantes");
});

test("exige funcoes de leitura e escrita de etiquetas", () => {
  assert.throws(
    () => new LocalCategoryTagRepository({ readTags: () => [] }),
    /writeTags e obrigatorio/
  );
});
