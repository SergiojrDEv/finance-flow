import { recordShadowDiagnostic } from "../diagnostics/shadowDiagnostics.js";
import { compareCatalogSnapshot } from "./compareCatalogSnapshot.js";

type CatalogShadowServices = {
  categoryRepository: { list: () => Promise<unknown[]> };
  categoryTagRepository: { list: () => Promise<unknown[]> };
};

export async function runCatalogShadow({
  enabled,
  catalog,
  catalogServices,
  recordDiagnostic = recordShadowDiagnostic,
}: {
  enabled?: boolean;
  catalog?: Record<string, unknown>;
  catalogServices?: CatalogShadowServices;
  recordDiagnostic?: (event: Record<string, unknown>) => unknown;
} = {}) {
  if (!enabled) {
    return {
      ran: false,
      diffs: {},
    };
  }

  try {
    const modernCatalog = {
      categories: await catalogServices?.categoryRepository.list(),
      tags: await catalogServices?.categoryTagRepository.list(),
    };
    const result = compareCatalogSnapshot({
      legacyCatalog: catalog,
      modernCatalog,
    });

    if (!result.matched) {
      recordDiagnostic({
        scope: "catalog",
        details: { diffs: result.diffs },
      });
    }

    return {
      ran: true,
      ...result,
    };
  } catch (error) {
    recordDiagnostic({
      scope: "catalog",
      level: "error",
      details: { error },
    });

    return {
      ran: true,
      matched: false,
      diffs: {},
      error,
    };
  }
}
