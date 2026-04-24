import { buildCatalogFromSettings } from "../../application/catalog/buildCatalogFromSettings.js";
import { buildCatalogFromV2 } from "../../application/catalog/buildCatalogFromV2.js";
import { buildSettingsFromCatalog } from "../../application/catalog/buildSettingsFromCatalog.js";

export function createCatalogSnapshotAdapter() {
  function fromSettings(settings, existingCatalog) {
    return buildCatalogFromSettings(settings, existingCatalog);
  }

  function fromV2(payload) {
    return buildCatalogFromV2(payload);
  }

  function toLegacySettings(catalog) {
    return buildSettingsFromCatalog(catalog);
  }

  return {
    fromSettings,
    fromV2,
    toLegacySettings,
  };
}
