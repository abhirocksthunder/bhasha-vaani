// Backed by apps/api/app/catalog_generator.py.
export interface CatalogCandidate {
  title: string;
  prompt: string;
  phrase: string;
  nativeScript: string;
  meaning: string;
}

export function catalogCandidateFromJson(json: Record<string, unknown>): CatalogCandidate {
  return {
    title: (json.title as string | undefined) ?? '',
    prompt: (json.prompt as string | undefined) ?? '',
    phrase: (json.phrase as string | undefined) ?? '',
    nativeScript: (json.native_script as string | undefined) ?? '',
    meaning: (json.meaning as string | undefined) ?? '',
  };
}

export function catalogCandidateToJson(candidate: CatalogCandidate): Record<string, unknown> {
  return {
    title: candidate.title,
    prompt: candidate.prompt,
    phrase: candidate.phrase,
    native_script: candidate.nativeScript,
    meaning: candidate.meaning,
  };
}

export interface GenerateCandidatesResult {
  languageCode: string;
  languageName: string;
  model: string;
  candidates: CatalogCandidate[];
  diagnostics: string[];
}

export interface ApproveResult {
  added: number;
  total: number;
  skipped: number;
}
