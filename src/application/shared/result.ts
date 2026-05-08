type Metadata = Record<string, unknown>;
type ErrorMap = Record<string, string>;

export type OkResult<TValue, TMetadata extends Metadata = Metadata> = {
  ok: true;
  value: TValue;
} & TMetadata;

export type FailResult<TMetadata extends Metadata = Metadata> = {
  ok: false;
  errors: ErrorMap;
} & TMetadata;

export function ok<TValue, TMetadata extends Metadata = Metadata>(
  value: TValue,
  metadata = {} as TMetadata,
): OkResult<TValue, TMetadata> {
  return {
    ok: true,
    value,
    ...metadata,
  };
}

export function fail<TMetadata extends Metadata = Metadata>(
  errors: ErrorMap,
  metadata = {} as TMetadata,
): FailResult<TMetadata> {
  return {
    ok: false,
    errors,
    ...metadata,
  };
}

export function firstErrorMessage(
  errors: ErrorMap | null | undefined,
  fallback = "Nao foi possivel concluir a operacao.",
): string {
  if (!errors || typeof errors !== "object") return fallback;
  return Object.values(errors).find(Boolean) || fallback;
}
