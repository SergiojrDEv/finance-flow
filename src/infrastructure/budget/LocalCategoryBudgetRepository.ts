import { CategoryBudgetRepository } from "../../application/budget/ports/CategoryBudgetRepository.js";
import type { CategoryBudgetEntity } from "../../application/shared/applicationTypes.js";

type BudgetPeriodKind = "weekly" | "monthly";

type BudgetRow = {
  id: string | null;
  categorySlug: string;
  periodKind: BudgetPeriodKind;
  amount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type SerializableBudget = CategoryBudgetEntity & {
  toJSON?: () => CategoryBudgetEntity;
};

type LocalCategoryBudgetRepositoryDeps = {
  readBudgets?: () => BudgetRow[];
  writeBudgets?: (budgets: BudgetRow[]) => void;
  createId?: (categorySlug: string, periodKind: BudgetPeriodKind) => string;
};

function serializeBudget(budget: SerializableBudget): CategoryBudgetEntity {
  return typeof budget.toJSON === "function" ? budget.toJSON() : { ...budget };
}

function rowId(categorySlug: string, periodKind: BudgetPeriodKind): string {
  return `${categorySlug}:${periodKind}`;
}

export class LocalCategoryBudgetRepository extends CategoryBudgetRepository {
  private readonly readBudgets: () => BudgetRow[];
  private readonly writeBudgets: (budgets: BudgetRow[]) => void;
  private readonly createId: (categorySlug: string, periodKind: BudgetPeriodKind) => string;

  constructor({ readBudgets, writeBudgets, createId = rowId }: LocalCategoryBudgetRepositoryDeps = {}) {
    super();

    if (typeof readBudgets !== "function") {
      throw new Error("readBudgets e obrigatorio.");
    }

    if (typeof writeBudgets !== "function") {
      throw new Error("writeBudgets e obrigatorio.");
    }

    this.readBudgets = readBudgets;
    this.writeBudgets = writeBudgets;
    this.createId = createId;
  }

  toAggregate(categorySlug: string): CategoryBudgetEntity | null {
    const rows = this.readBudgets().filter((item) => item.categorySlug === categorySlug);
    if (!rows.length) return null;

    const weekly = rows.find((item) => item.periodKind === "weekly");
    const monthly = rows.find((item) => item.periodKind === "monthly");
    const first = monthly || weekly;

    return {
      id: first?.id || categorySlug,
      categorySlug,
      weeklyLimit: Number(weekly?.amount || 0),
      monthlyLimit: Number(monthly?.amount || 0),
      createdAt: first?.createdAt || null,
      updatedAt: first?.updatedAt || null,
    };
  }

  toRows(budget: SerializableBudget): BudgetRow[] {
    const saved = serializeBudget(budget);
    return [
      {
        id: this.createId(saved.categorySlug, "weekly"),
        categorySlug: saved.categorySlug,
        periodKind: "weekly",
        amount: Number(saved.weeklyLimit || 0),
        createdAt: saved.createdAt || null,
        updatedAt: saved.updatedAt || null,
      },
      {
        id: this.createId(saved.categorySlug, "monthly"),
        categorySlug: saved.categorySlug,
        periodKind: "monthly",
        amount: Number(saved.monthlyLimit || 0),
        createdAt: saved.createdAt || null,
        updatedAt: saved.updatedAt || null,
      },
    ];
  }

  async save(budget: CategoryBudgetEntity): Promise<CategoryBudgetEntity | null> {
    const rows = this.toRows(budget);
    const otherRows = this.readBudgets().filter((item) => item.categorySlug !== rows[0]?.categorySlug);
    this.writeBudgets([...otherRows, ...rows]);
    return this.toAggregate(rows[0]?.categorySlug || "");
  }

  async findByCategorySlug(categorySlug: string): Promise<CategoryBudgetEntity | null> {
    return this.toAggregate(categorySlug);
  }

  async update(_id: string, budget: CategoryBudgetEntity): Promise<CategoryBudgetEntity | null> {
    return this.save(budget);
  }

  async list(): Promise<CategoryBudgetEntity[]> {
    const categorySlugs = [...new Set(this.readBudgets().map((item) => item.categorySlug).filter(Boolean))];
    return categorySlugs.map((categorySlug) => this.toAggregate(categorySlug)).filter(Boolean) as CategoryBudgetEntity[];
  }
}
