import { ArchiveCategoryTagUseCase } from "../../application/catalog/ArchiveCategoryTagUseCase.js";
import { ArchiveCategoryUseCase } from "../../application/catalog/ArchiveCategoryUseCase.js";
import { CreateCategoryTagUseCase } from "../../application/catalog/CreateCategoryTagUseCase.js";
import { CreateCategoryUseCase } from "../../application/catalog/CreateCategoryUseCase.js";
import { UpdateCategoryTagUseCase } from "../../application/catalog/UpdateCategoryTagUseCase.js";
import { UpdateCategoryUseCase } from "../../application/catalog/UpdateCategoryUseCase.js";
import { LocalCategoryRepository } from "../catalog/LocalCategoryRepository.js";
import { LocalCategoryTagRepository } from "../catalog/LocalCategoryTagRepository.js";

export function createCatalogServices({
  readCategories,
  writeCategories,
  readTags,
  writeTags,
  createCategoryId,
  createTagId,
  clock,
} = {}) {
  const categoryRepository = new LocalCategoryRepository({
    readCategories,
    writeCategories,
    createId: createCategoryId,
  });
  const categoryTagRepository = new LocalCategoryTagRepository({
    readTags,
    writeTags,
    createId: createTagId,
  });

  return {
    categoryRepository,
    categoryTagRepository,
    createCategory: new CreateCategoryUseCase({ categoryRepository, clock }),
    updateCategory: new UpdateCategoryUseCase({ categoryRepository, clock }),
    archiveCategory: new ArchiveCategoryUseCase({ categoryRepository, clock }),
    createCategoryTag: new CreateCategoryTagUseCase({ categoryRepository, categoryTagRepository, clock }),
    updateCategoryTag: new UpdateCategoryTagUseCase({ categoryTagRepository, clock }),
    archiveCategoryTag: new ArchiveCategoryTagUseCase({ categoryTagRepository, clock }),
  };
}
