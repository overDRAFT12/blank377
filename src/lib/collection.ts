import type { CollectionOptions, Contract, PropertyPetition } from "./types";

/** Calendar months, clamped to the last day of the target month (not 120 days). */
export function refusalEligibilityDate(value: string): Date | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]), month = Number(match[2]) - 1, year = Number(match[3]);
  const start = new Date(year, month, day);
  if (start.getFullYear() !== year || start.getMonth() !== month || start.getDate() !== day) return null;
  const target = new Date(year, month + 5, 0);
  return new Date(target.getFullYear(), target.getMonth(), Math.min(day, target.getDate()));
}

export function refusalTiming(value: string, today = new Date()): "missing" | "invalid" | "early" | "eligible" {
  if (!value.trim()) return "missing";
  const eligible = refusalEligibilityDate(value);
  if (!eligible) return "invalid";
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return now < eligible ? "early" : "eligible";
}

export function collectionKinds(options: CollectionOptions): ("thirdParties" | "debtor")[] {
  return [...(options.thirdParties ? ["thirdParties" as const] : []), ...(options.debtor ? ["debtor" as const] : [])];
}

export function collectionDocumentCount(contracts: Contract[], options: CollectionOptions) {
  return contracts.length * collectionKinds(options).length;
}

export function civilianDocumentCount(contractCount: number, options: CollectionOptions, petition: PropertyPetition) {
  return contractCount * collectionKinds(options).length + (options.propertyPetition && petition.confirmed ? 1 : 0);
}

export function canGenerateCivilian(contractCount: number, options: CollectionOptions, petition: PropertyPetition) {
  if (options.propertyPetition && !petition.confirmed) return false;
  return civilianDocumentCount(contractCount, options, petition) > 0;
}