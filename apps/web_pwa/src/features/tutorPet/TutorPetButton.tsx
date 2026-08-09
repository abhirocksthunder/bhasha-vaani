import { useEffect, useState } from 'react';
import type { ApiClient } from '../../core/api/apiClient';
import { StatusBadge } from '../../ui/StatusBadge';
import { CloseIcon, PetsIcon, RefreshIcon, RouteIcon, SendIcon } from '../../ui/icons';
import type { LearnerProfile } from '../profiles/types';
import type { LanguagePack } from '../languages/types';
import { OllamaRepository } from '../lessons/ollamaRepository';
import { ollamaModelLabel, type OllamaModel } from '../lessons/types';

// Mirrors apps/mobile_flutter/lib/features/tutor_pet/presentation/tutor_pet_button.dart.
interface TutorPetButtonProps {
  apiClient: ApiClient;
  selectedProfile: LearnerProfile | null;
  languages: LanguagePack[];
  selectedLanguage: LanguagePack | null;
}

export function TutorPetButton({ apiClient, selectedProfile, languages, selectedLanguage }: TutorPetButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        title="Ask tutor pet"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 20px',
          borderRadius: 28,
          border: 'none',
          background: 'var(--bv-seed)',
          color: 'white',
          fontWeight: 800,
          fontSize: 14,
          boxShadow: '0 10px 24px rgba(14, 165, 164, 0.35)',
          cursor: 'pointer',
        }}
      >
        <PetsIcon />
        Ask
      </button>

      {open && (
        <TutorPetSheet
          apiClient={apiClient}
          selectedProfile={selectedProfile}
          languages={languages}
          selectedLanguage={selectedLanguage}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function TutorPetSheet({
  apiClient,
  selectedProfile,
  languages,
  selectedLanguage,
  onClose,
}: TutorPetButtonProps & { onClose: () => void }) {
  const [word, setWord] = useState('');
  const [language, setLanguage] = useState<LanguagePack | null>(selectedLanguage ?? languages[0] ?? null);
  const [provider, setProvider] = useState<'local_ollama' | 'local_lmstudio' | 'frontier_later'>('local_ollama');
  const [ollamaModel, setOllamaModel] = useState<string | null>(null);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadOllamaModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOllamaModels() {
    setLoadingModels(true);
    try {
      const repository = new OllamaRepository(apiClient);
      const models = await repository.fetchModels();
      setOllamaModels(models);
      setOllamaModel((current) => current ?? models[0]?.name ?? null);
    } catch {
      setOllamaModels([]);
      setOllamaModel(null);
    } finally {
      setLoadingModels(false);
    }
  }

  async function ask() {
    if (!language || !word.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const response = await apiClient.postMap<Record<string, unknown>>('/assistant/word', {
        word: word.trim(),
        language_code: language.code,
        explanation_language: selectedProfile?.explanationLanguage ?? 'English',
        model: provider === 'local_ollama' && ollamaModel ? `ollama:${ollamaModel}` : provider,
      });
      setAnswer((response.answer as string | undefined) ?? 'No answer returned.');
    } catch {
      setAnswer('I could not reach the tutor backend. Try again when the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.35)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: '16px 16px 0 0', padding: 20, width: '100%', maxWidth: 480, boxShadow: '0 -10px 40px rgba(15, 23, 42, 0.25)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(14, 165, 164, 0.12)', color: 'var(--bv-seed-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PetsIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Tutor pet</div>
            <div style={{ fontSize: 13, color: 'var(--bv-text-muted)' }}>Ask any word or phrase.</div>
          </div>
          <button type="button" title="Close" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 6 }}>
            <CloseIcon />
          </button>
        </div>

        <input
          value={word}
          onChange={(event) => setWord(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void ask();
          }}
          placeholder="Example: water"
          style={{ display: 'block', width: '100%', marginTop: 14, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--bv-border)', fontSize: 14 }}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <select
            value={language?.code ?? ''}
            onChange={(event) => setLanguage(languages.find((l) => l.code === event.target.value) ?? null)}
            style={selectStyle}
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
          <select value={provider} onChange={(event) => setProvider(event.target.value as typeof provider)} style={selectStyle}>
            <option value="local_ollama">Local Ollama</option>
            <option value="local_lmstudio">Local LM Studio</option>
            <option value="frontier_later">Frontier later</option>
          </select>
        </div>

        {provider === 'local_ollama' && (
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <select value={ollamaModel ?? ''} onChange={(event) => setOllamaModel(event.target.value || null)} style={selectStyle}>
              {ollamaModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {ollamaModelLabel(model)}
                </option>
              ))}
            </select>
            <button
              type="button"
              title="Refresh models"
              onClick={() => void loadOllamaModels()}
              disabled={loadingModels}
              style={{ border: 'none', borderRadius: 8, background: 'rgba(14, 165, 164, 0.12)', color: 'var(--bv-seed-dark)', padding: '0 12px', cursor: 'pointer' }}
            >
              <RefreshIcon />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <StatusBadge icon={<RouteIcon />} label="Provider gateway" emphasis="primary" />
          <div style={{ flex: 1 }} />
          <button type="button" className="bv-filled-button" disabled={loading} onClick={() => void ask()}>
            <SendIcon />
            Ask
          </button>
        </div>

        {answer && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: 'var(--bv-neutral-bg)', fontSize: 14, whiteSpace: 'pre-wrap' }}>
            {answer}
          </div>
        )}
      </div>
    </div>
  );
}

const selectStyle = {
  flex: 1,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--bv-border)',
  fontSize: 14,
  background: 'white',
} as const;
