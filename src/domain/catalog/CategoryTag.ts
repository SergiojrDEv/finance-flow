import { validateCategoryTagDraft } from "../../application/catalog/validateCategoryTagDraft.js";
import type { CategoryTagDraft, CategoryTagEntity, TransactionKind, ValidationErrors } from "../../application/shared/applicationTypes.js";

function normalizeText(value: unknown): string {
  return String(value || "").trim();
}

export class CategoryTag implements CategoryTagEntity {
  id: string | null;
  kind: TransactionKind;
  categorySlug: string;
  slug: string;
  name: string;
  color: string;
  isArchived: boolean;
  createdAt: string | null;
  updatedAt: string | null;

  constructor(props: CategoryTagEntity) {
    this.id = props.id || null;
    this.kind = props.kind;
    this.categorySlug = props.categorySlug;
    this.slug = props.slug;
    this.name = props.name;
    this.color = props.color || "#667085";
    this.isArchived = Boolean(props.isArchived);
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;

    Object.freeze(this);
  }

  static create(draft: CategoryTagDraft): { ok: true; value: CategoryTag } | { ok: false; errors: ValidationErrors } {
    const normalized = {
      ...draft,
      id: draft.id || null,
      kind: normalizeText(draft.kind) as TransactionKind,
      categorySlug: normalizeText(draft.categorySlug),
      slug: normalizeText(draft.slug),
      name: normalizeText(draft.name),
      color: normalizeText(draft.color || "#667085"),
      isArchived: Boolean(draft.isArchived),
      createdAt: draft.createdAt || null,
      updatedAt: draft.updatedAt || null,
    };

    const validation = validateCategoryTagDraft(normalized);
    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors,
      };
    }

    return {
      ok: true,
      value: new CategoryTag(normalized as CategoryTagEntity),
    };
  }

  toJSON(): CategoryTagEntity {
    return { ...this };
  }
}
