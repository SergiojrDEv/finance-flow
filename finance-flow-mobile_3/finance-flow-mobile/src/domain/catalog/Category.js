import { validateCategoryDraft } from "../../application/catalog/validateCategoryDraft.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeLimit(kind, value) {
  if (kind !== "expense") return null;
  return Number(value || 0);
}

export class Category {
  constructor(props) {
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

  static create(draft) {
    const normalized = {
      ...draft,
      kind: normalizeText(draft.kind),
      slug: normalizeText(draft.slug),
      name: normalizeText(draft.name),
      color: normalizeText(draft.color || "#667085"),
      monthlyLimit: draft.kind === "expense" ? Number(draft.monthlyLimit || 0) : null,
      isArchived: Boolean(draft.isArchived),
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
      value: new Category(normalized),
    };
  }

  toJSON() {
    return { ...this };
  }
}
