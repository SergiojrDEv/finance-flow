import { validateGoalDraft } from "../../application/goals/validateGoalDraft.js";
import type { GoalDraft, GoalEntity, ValidationErrors } from "../../application/shared/applicationTypes.js";

type GoalCreateResult =
  | { ok: true; value: Goal }
  | { ok: false; errors: ValidationErrors };

function normalizeText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeAmount(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
}

export class Goal implements GoalEntity {
  readonly id: string | null;
  readonly name: string;
  readonly key: string;
  readonly target: number;
  readonly currentAmount: number;
  readonly color: string;
  readonly isArchived: boolean;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;

  constructor(props: GoalEntity) {
    this.id = props.id || null;
    this.name = props.name;
    this.key = props.key;
    this.target = props.target;
    this.currentAmount = props.currentAmount;
    this.color = props.color;
    this.isArchived = Boolean(props.isArchived);
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;

    Object.freeze(this);
  }

  static create(draft: GoalDraft = {}): GoalCreateResult {
    const normalized: GoalEntity = {
      ...draft,
      id: draft.id || null,
      name: normalizeText(draft.name),
      key: normalizeText(draft.key),
      target: normalizeAmount(draft.target),
      currentAmount: normalizeAmount(draft.currentAmount),
      color: draft.color || "#635bff",
      isArchived: Boolean(draft.isArchived),
      createdAt: draft.createdAt || null,
      updatedAt: draft.updatedAt || null,
    };

    const validation = validateGoalDraft(normalized);
    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors,
      };
    }

    return {
      ok: true,
      value: new Goal(normalized),
    };
  }

  toJSON(): GoalEntity {
    return { ...this };
  }
}
