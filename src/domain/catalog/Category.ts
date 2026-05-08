import { validateCategoryDraft } from "../../application/catalog/validateCategoryDraft.js";
import type { CategoryDraft, CategoryEntity, TransactionKind, ValidationErrors } from "../../application/shared/applicationTypes.js";

function normalizeText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeLimit(kind: TransactionKind | string, value: unknown): number | null {
  if (kind !== "expense") return null;
  return Number(value || 0);
}

export class Category implements CategoryEntity {
  id: string | null;
  kind: TransactionKind;
  slug: string;
  name: string;
  color: string;
  monthlyLimit: number | null;
  isArchived: boolean;
  createdAt: string | null;
  updatedAt: string | null;

  constructor(props: CategoryEntity) {
    this.id = props.id || null;
    this.kind = props.kind;
    this.slug = props.slug;
    this.name = props.name;
    this.color = props.color || "#667085";
    this.monthlyLimit = normalizeLimit(props.kind, props.monthlyLimit);
    this.isArchived = Boolean(props.isArchived);
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;

    Object.freeze(this);
  }

  static create(draft: CategoryDraft): { ok: true; value: Category } | { ok: false; errors: ValidationErrors } {
    const kind = normalizeText(draft.kind) as TransactionKind;
    const normalized = {
      ...draft,
      id: draft.id || null,
      kind,
      slug: normalizeText(draft.slug),
      name: normalizeText(draft.name),
      color: normalizeText(draft.color || "#667085"),
      monthlyLimit: kind === "expense" ? Number(draft.monthlyLimit || 0) : null,
      isArchived: Boolean(draft.isArchived),
      createdAt: draft.createdAt || null,
      updatedAt: draft.updatedAt || null,
    };

    const validation = validateCategoryDraft(normalized);
    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors,
      };
    }

    return {
      ok: true,
      value: new Category(normalized as CategoryEntity),
    };
  }

  toJSON(): CategoryEntity {
    return { ...this };
  }
}
