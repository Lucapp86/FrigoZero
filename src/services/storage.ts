import { AppSettings, DispensaItem, SpesaItem } from '../types';
import { INITIAL_MOCK_DISPENSA, INITIAL_MOCK_SPESA } from './mockData';

const SETTINGS_KEY = 'frigo_zero_settings_v1';
const LOCAL_DISPENSA_KEY = 'frigo_zero_dispensa_v1';
const LOCAL_SPESA_KEY = 'frigo_zero_spesa_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  gasUrl: '',
  secretToken: '',
  geminiApiKey: '',
  demoMode: true, // Attiva Demo Mode per impostazione predefinita se non configurato
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      gasUrl: parsed.gasUrl || '',
      secretToken: parsed.secretToken || '',
      geminiApiKey: parsed.geminiApiKey || '',
      demoMode: parsed.demoMode !== undefined ? parsed.demoMode : (!parsed.gasUrl && !parsed.geminiApiKey)
    };
  } catch (e) {
    console.error('Errore nel caricamento impostazioni:', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Errore nel salvataggio impostazioni:', e);
  }
}

export function loadLocalDispensa(): DispensaItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_DISPENSA_KEY);
    if (!raw) {
      saveLocalDispensa(INITIAL_MOCK_DISPENSA);
      return INITIAL_MOCK_DISPENSA;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_MOCK_DISPENSA;
  }
}

export function saveLocalDispensa(items: DispensaItem[]): void {
  try {
    localStorage.setItem(LOCAL_DISPENSA_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Errore salvataggio dispensa locale:', e);
  }
}

export function loadLocalSpesa(): SpesaItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_SPESA_KEY);
    if (!raw) {
      saveLocalSpesa(INITIAL_MOCK_SPESA);
      return INITIAL_MOCK_SPESA;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_MOCK_SPESA;
  }
}

export function saveLocalSpesa(items: SpesaItem[]): void {
  try {
    localStorage.setItem(LOCAL_SPESA_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Errore salvataggio spesa locale:', e);
  }
}
