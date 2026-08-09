import { useEffect, useState } from 'react';
import { GlossyPanel } from '../../ui/GlossyPanel';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { StatusBadge } from '../../ui/StatusBadge';
import { EmptyStatePanel } from '../../ui/StatePanels';
import { AutoAwesomeIcon, CheckCircleIcon, CheckIcon, LibraryIcon, RefreshIcon } from '../../ui/icons';
import type { LanguagePack } from '../languages/types';
import type { OllamaRepository } from '../lessons/ollamaRepository';
import { ollamaModelLabel, type OllamaModel } from '../lessons/types';
import { CatalogGenerationException, type CatalogRepository } from './catalogRepository';
import type { CatalogCandidate } from './types';

// Human-in-the-loop catalog growth: generate candidate starter-catalog
// phrases with a local Ollama model, let the user review/edit/deselect
// each one, and only write the ones they approve. See
// apps/api/app/catalog_generator.py for the backend split between
// "generate" (writes nothing) and "approve" (writes only what's sent).
interface CatalogBuilderScreenProps {
  languages: LanguagePack[];
  selectedLanguage: LanguagePack | null;
  ollamaRepository: OllamaRepository;
  catalogRepository: CatalogRepository;
}

interface CandidateRow extends CatalogCandidate {
  approved: boolean;
}

export function CatalogBuilderScreen({
  languages,
  selectedLanguage,
  ollamaRepository,
  catalogRepository,
}: CatalogBuilderScreenProps) {
  const [languageCode, setLanguageCode] = useState(selectedLanguage?.code ?? languages[0]?.code ?? 'kn');
  const [count, setCount] = useState(10);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);

  useEffect(() => {
    void loadOllamaModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOllamaModels() {
    setLoadingModels(true);
    try {
      const models = await ollamaRepository.fetchModels();
      setOllamaModels(models);
      setSelectedModel((current) => current ?? models[0]?.name ?? null);
    } catch {
      setOllamaModels([]);
    } finally {
      setLoadingModels(false);
    }
  }

  async function generate() {
    if (!selectedModel) {
      setStatusMessage('Pick an Ollama model first.');
      setStatusIsError(true);
      return;
    }
    setGenerating(true);
    setStatusMessage(null);
    setStatusIsError(false);
    try {
      const result = await catalogRepository.generateCandidates({ languageCode, model: selectedModel, count });
      setCandidates(result.candidates.map((candidate) => ({ ...candidate, approved: true })));
      setStatusMessage(
        result.candidates.length === 0
          ? 'No usable candidates came back (all were duplicates or malformed). Try again or a different model.'
          : `Got ${result.candidates.length} candidate(s) for ${result.languageName}. Review below before adding.`,
      );
      setStatusIsError(result.candidates.length === 0);
    } catch (error) {
      setCandidates([]);
      setStatusMessage(
        error instanceof CatalogGenerationException
          ? `Could not generate candidates: ${error.message}`
          : `Could not reach the backend: ${error instanceof Error ? error.message : String(error)}`,
      );
      setStatusIsError(true);
    } finally {
      setGenerating(false);
    }
  }

  async function approveSelected() {
    const approved = candidates.filter((candidate) => candidate.approved);
    if (approved.length === 0) {
      setStatusMessage('No candidates are selected -- check at least one before adding.');
      setStatusIsError(true);
      return;
    }
    setApproving(true);
    setStatusMessage(null);
    setStatusIsError(false);
    try {
      const result = await catalogRepository.approveCandidates({ languageCode, approved });
      setStatusMessage(
        `Added ${result.added} phrase(s) to the catalog (catalog now has ${result.total} total)` +
          (result.skipped > 0 ? `; ${result.skipped} were skipped as duplicates.` : '.'),
      );
      setStatusIsError(false);
      // Remove the ones that were submitted so the list only shows what's
      // still pending a decision, instead of re-showing already-written
      // phrases as if they were still awaiting approval.
      setCandidates((current) => current.filter((candidate) => !candidate.approved));
    } catch (error) {
      setStatusMessage(
        error instanceof CatalogGenerationException
          ? `Could not add phrases: ${error.message}`
          : `Could not reach the backend: ${error instanceof Error ? error.message : String(error)}`,
      );
      setStatusIsError(true);
    } finally {
      setApproving(false);
    }
  }

  function updateCandidate(index: number, field: keyof CatalogCandidate, value: string) {
    setCandidates((current) =>
      current.map((candidate, i) => (i === index ? { ...candidate, [field]: value } : candidate)),
    );
  }

  function toggleApproved(index: number) {
    setCandidates((current) =>
      current.map((candidate, i) => (i === index ? { ...candidate, approved: !candidate.approved } : candidate)),
    );
  }

  const approvedCount = candidates.filter((candidate) => candidate.approved).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ScreenHeader
        eyebrow="Curriculum"
        title="Catalog builder"
        subtitle="Generate candidate phrases with a local model, review and edit each one, then add only what you approve to the trusted starter catalog."
        trailing={<StatusBadge icon={<LibraryIcon />} label="Human-in-the-loop" emphasis="primary" />}
      />

      <GlossyPanel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <label style={{ display: 'block' }}>
            <div style={fieldLabelStyle}>Language</div>
            <select value={languageCode} onChange={(event) => setLanguageCode(event.target.value)} style={selectStyle}>
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'block', flex: 1, minWidth: 200 }}>
            <div style={fieldLabelStyle}>Ollama model</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={selectedModel ?? ''}
                onChange={(event) => setSelectedModel(event.target.value || null)}
                style={{ ...selectStyle, flex: 1 }}
              >
                {ollamaModels.map((model) => (
                  <option key={model.name} value={model.name}>
                    {ollamaModelLabel(model)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                title="Refresh installed models"
                onClick={() => void loadOllamaModels()}
                disabled={loadingModels}
                style={tonalButtonStyle}
              >
                <RefreshIcon />
              </button>
            </div>
          </label>

          <label style={{ display: 'block' }}>
            <div style={fieldLabelStyle}>Count</div>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(event) => setCount(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
              style={{ ...selectStyle, width: 80 }}
            />
          </label>

          <button type="button" className="bv-filled-button" disabled={generating} onClick={() => void generate()}>
            <AutoAwesomeIcon />
            {generating ? 'Generating...' : 'Generate candidates'}
          </button>
        </div>
      </GlossyPanel>

      {statusMessage && (
        <GlossyPanel>
          <StatusBadge label={statusMessage} emphasis={statusIsError ? 'warning' : 'success'} />
        </GlossyPanel>
      )}

      {candidates.length === 0 ? (
        <EmptyStatePanel
          icon={<LibraryIcon />}
          title="No candidates yet"
          message="Pick a language and model, then Generate candidates to draft new phrases for review."
        />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge icon={<CheckIcon />} label={`${approvedCount} of ${candidates.length} selected`} emphasis="primary" />
            <div style={{ flex: 1 }} />
            <button type="button" className="bv-filled-button" disabled={approving || approvedCount === 0} onClick={() => void approveSelected()}>
              <CheckCircleIcon />
              {approving ? 'Adding...' : `Add ${approvedCount} approved to catalog`}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {candidates.map((candidate, index) => (
              <CandidateCard
                key={index}
                candidate={candidate}
                onToggle={() => toggleApproved(index)}
                onChange={(field, value) => updateCandidate(index, field, value)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CandidateCard({
  candidate,
  onToggle,
  onChange,
}: {
  candidate: CandidateRow;
  onToggle: () => void;
  onChange: (field: keyof CatalogCandidate, value: string) => void;
}) {
  return (
    <GlossyPanel selected={candidate.approved}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ paddingTop: 4 }}>
          <input type="checkbox" checked={candidate.approved} onChange={onToggle} style={{ width: 18, height: 18 }} />
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <EditableField label="Title" value={candidate.title} onChange={(v) => onChange('title', v)} />
          <EditableField label="Phrase (romanized)" value={candidate.phrase} onChange={(v) => onChange('phrase', v)} />
          <EditableField label="Native script" value={candidate.nativeScript} onChange={(v) => onChange('nativeScript', v)} />
          <EditableField label="Meaning" value={candidate.meaning} onChange={(v) => onChange('meaning', v)} />
          <div style={{ gridColumn: '1 / -1' }}>
            <EditableField label="Prompt" value={candidate.prompt} onChange={(v) => onChange('prompt', v)} />
          </div>
        </div>
      </div>
    </GlossyPanel>
  );
}

function EditableField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bv-text-faint)', marginBottom: 3 }}>{label}</div>
      <input value={value} onChange={(event) => onChange(event.target.value)} style={{ ...selectStyle, width: '100%' }} />
    </label>
  );
}

const fieldLabelStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--bv-text-muted)',
  marginBottom: 6,
} as const;

const selectStyle = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--bv-border)',
  fontSize: 14,
  background: 'white',
} as const;

const tonalButtonStyle = {
  border: 'none',
  borderRadius: 8,
  background: 'rgba(14, 165, 164, 0.12)',
  color: 'var(--bv-seed-dark)',
  padding: '0 12px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
} as const;
