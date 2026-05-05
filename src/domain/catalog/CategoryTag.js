import { validateCategoryTagDraft } from "../../application/catalog/validateCategoryTagDraft.js";

function normalizeText(value) {
  return String(value || "").trim();
}

export class CategoryTag {
  constructor(props) {
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

  static create(draft) {
    const normalized = {
      ...draft,
      kind: normalizeText(draft.kind),
      categorySlug: normalizeText(draft.categorySlug),
      slug: normalizeText(draft.slug),
      name: normalizeText(draft.name),
      color: normalizeText(draft.color || "#667085"),
      isArchived: Boolean(draft.isArchived),
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
      value: new CategoryTag(normalized),
    };
  }

  toJSON() {
    return { ...this };
  }
}
