import { AppSettings, DispensaItem, SpesaItem, Reparto, Urgenza } from '../types';
import { 
  loadLocalDispensa, 
  saveLocalDispensa, 
  loadLocalSpesa, 
  saveLocalSpesa 
} from './storage';

export interface GasApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  added?: any[];
  deletedCount?: number;
  movedCount?: number;
}

/**
 * Esegue una richiesta verso l'endpoint Google Apps Script Web App.
 * NOTA SUL CORS: GAS non supporta preflight OPTIONS per application/json.
 * Inviamo il body come stringa JSON con Content-Type text/plain;charset=utf-8
 * e redirect: 'follow'. Il server GAS riceve e.postData.contents ed elabora il JSON correttamente.
 */
async function callGasApi<T>(settings: AppSettings, action: string, payload: any = {}): Promise<GasApiResponse<T>> {
  if (settings.demoMode || !settings.gasUrl) {
    throw new Error('DEMO_MODE');
  }

  const url = settings.gasUrl.trim();
  const requestBody = JSON.stringify({
    action: action,
    payload: payload,
    token: settings.secretToken ? settings.secretToken.trim() : ''
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow',
      body: requestBody
    });

    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
    }

    const data: GasApiResponse<T> = await response.json();
    return data;
  } catch (err: any) {
    console.warn(`[GasApi] Errore chiamata "${action}":`, err);
    throw err;
  }
}

/**
 * Recupera tutti i dati di Dispensa e Spesa (da Sheets se online, da LocalStorage se Demo/Offline)
 */
export async function fetchAllData(settings: AppSettings): Promise<{
  dispensa: DispensaItem[];
  spesa: SpesaItem[];
  isDemo: boolean;
  error?: string;
}> {
  if (settings.demoMode || !settings.gasUrl) {
    return {
      dispensa: loadLocalDispensa(),
      spesa: loadLocalSpesa(),
      isDemo: true
    };
  }

  try {
    const res = await callGasApi<{ dispensa: DispensaItem[]; spesa: SpesaItem[] }>(settings, 'getAll');
    if (res.success && res.data) {
      // Salva nella cache locale
      saveLocalDispensa(res.data.dispensa || []);
      saveLocalSpesa(res.data.spesa || []);
      return {
        dispensa: res.data.dispensa || [],
        spesa: res.data.spesa || [],
        isDemo: false
      };
    } else {
      throw new Error(res.error || 'Risposta server non valida');
    }
  } catch (err: any) {
    console.warn('Fallback su cache locale:', err.message);
    return {
      dispensa: loadLocalDispensa(),
      spesa: loadLocalSpesa(),
      isDemo: true,
      error: `Connessione a Google Sheets fallita (${err.message}). Utilizzo dati locali.`
    };
  }
}

/**
 * Aggiunge ingredienti alla Dispensa
 */
export async function addDispensaItems(
  settings: AppSettings, 
  newItems: Omit<DispensaItem, 'id'>[]
): Promise<DispensaItem[]> {
  const itemsWithIds: DispensaItem[] = newItems.map((item, idx) => ({
    id: `dsp_${Date.now()}_${idx}`,
    ingrediente: item.ingrediente,
    quantita: item.quantita || '1',
    reparto: item.reparto || 'Altro',
    scadenza_stimata: item.scadenza_stimata || getDefaultExpiryDate(item.reparto || 'Altro'),
    urgenza: item.urgenza || calculateUrgency(item.scadenza_stimata),
    data_inserimento: item.data_inserimento || new Date().toISOString()
  }));

  // Aggiorna sempre la cache locale
  const current = loadLocalDispensa();
  const updated = [...itemsWithIds, ...current];
  saveLocalDispensa(updated);

  if (!settings.demoMode && settings.gasUrl) {
    try {
      await callGasApi(settings, 'addDispensa', itemsWithIds);
    } catch (e) {
      console.warn('Salvataggio su Google Sheets non riuscito, salvato solo in locale.', e);
    }
  }

  return updated;
}

/**
 * Elimina uno o più ingredienti dalla Dispensa
 */
export async function deleteDispensaItems(
  settings: AppSettings, 
  ids: string[]
): Promise<DispensaItem[]> {
  const current = loadLocalDispensa();
  const idSet = new Set(ids);
  const updated = current.filter(item => !idSet.has(item.id));
  saveLocalDispensa(updated);

  if (!settings.demoMode && settings.gasUrl) {
    try {
      await callGasApi(settings, 'deleteDispensa', ids);
    } catch (e) {
      console.warn('Eliminazione su Google Sheets non riuscita, eliminato solo in locale.', e);
    }
  }

  return updated;
}

/**
 * Aggiunge articoli alla Spesa
 */
export async function addSpesaItems(
  settings: AppSettings,
  newItems: Omit<SpesaItem, 'id' | 'comprato'>[]
): Promise<SpesaItem[]> {
  const itemsWithIds: SpesaItem[] = newItems.map((item, idx) => ({
    id: `sp_${Date.now()}_${idx}`,
    articolo: item.articolo,
    quantita: item.quantita || '1',
    reparto: item.reparto || 'Altro',
    comprato: false
  }));

  const current = loadLocalSpesa();
  const updated = [...current, ...itemsWithIds];
  saveLocalSpesa(updated);

  if (!settings.demoMode && settings.gasUrl) {
    try {
      await callGasApi(settings, 'addSpesa', itemsWithIds);
    } catch (e) {
      console.warn('Aggiunta spesa su Google Sheets fallita, salvato solo in locale.', e);
    }
  }

  return updated;
}

/**
 * Modifica lo stato 'comprato' di un articolo nella lista spesa
 */
export async function toggleSpesaItem(
  settings: AppSettings,
  id: string,
  newCompratoStatus?: boolean
): Promise<SpesaItem[]> {
  const current = loadLocalSpesa();
  let targetStatus = false;
  const updated = current.map(item => {
    if (item.id === id) {
      targetStatus = newCompratoStatus !== undefined ? newCompratoStatus : !item.comprato;
      return { ...item, comprato: targetStatus };
    }
    return item;
  });
  saveLocalSpesa(updated);

  if (!settings.demoMode && settings.gasUrl) {
    try {
      await callGasApi(settings, 'toggleSpesa', { id, comprato: targetStatus });
    } catch (e) {
      console.warn('Toggle su Google Sheets fallito, aggiornato solo in locale.', e);
    }
  }

  return updated;
}

/**
 * Elimina uno o più articoli dalla Spesa
 */
export async function deleteSpesaItems(
  settings: AppSettings,
  ids: string[]
): Promise<SpesaItem[]> {
  const current = loadLocalSpesa();
  const idSet = new Set(ids);
  const updated = current.filter(item => !idSet.has(item.id));
  saveLocalSpesa(updated);

  if (!settings.demoMode && settings.gasUrl) {
    try {
      await callGasApi(settings, 'deleteSpesa', ids);
    } catch (e) {
      console.warn('Eliminazione spesa su Google Sheets fallita, eliminato solo in locale.', e);
    }
  }

  return updated;
}

/**
 * Sposta tutti gli articoli con comprato = TRUE da Spesa a Dispensa
 */
export async function moveSpesaToDispensa(settings: AppSettings): Promise<{
  dispensa: DispensaItem[];
  spesa: SpesaItem[];
  movedCount: number;
}> {
  const currentSpesa = loadLocalSpesa();
  const currentDispensa = loadLocalDispensa();

  const bought = currentSpesa.filter(item => item.comprato);
  const remainingSpesa = currentSpesa.filter(item => !item.comprato);

  if (bought.length === 0) {
    return {
      dispensa: currentDispensa,
      spesa: currentSpesa,
      movedCount: 0
    };
  }

  const newDispensaItems: DispensaItem[] = bought.map((item, idx) => {
    const scadenza = getDefaultExpiryDate(item.reparto);
    return {
      id: `dsp_moved_${Date.now()}_${idx}`,
      ingrediente: item.articolo,
      quantita: item.quantita || '1',
      reparto: item.reparto || 'Altro',
      scadenza_stimata: scadenza,
      urgenza: calculateUrgency(scadenza),
      data_inserimento: new Date().toISOString()
    };
  });

  const updatedDispensa = [...newDispensaItems, ...currentDispensa];
  saveLocalDispensa(updatedDispensa);
  saveLocalSpesa(remainingSpesa);

  if (!settings.demoMode && settings.gasUrl) {
    try {
      await callGasApi(settings, 'moveSpesaToDispensa', {});
    } catch (e) {
      console.warn('Spostamento su Google Sheets fallito, completato solo in locale.', e);
    }
  }

  return {
    dispensa: updatedDispensa,
    spesa: remainingSpesa,
    movedCount: bought.length
  };
}

/**
 * Test di connessione verso Google Apps Script
 */
export async function testGasConnection(gasUrl: string, secretToken: string): Promise<{ success: boolean; message: string }> {
  if (!gasUrl || !gasUrl.startsWith('http')) {
    return { success: false, message: 'URL non valido. Inserisci l\'URL completo della Web App.' };
  }

  try {
    const res = await fetch(gasUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      body: JSON.stringify({ action: 'ping', token: secretToken.trim() })
    });

    if (!res.ok) {
      return { success: false, message: `Errore HTTP ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    if (data.success) {
      return { success: true, message: 'Connessione a Google Sheets riuscita!' };
    } else {
      return { success: false, message: data.error || 'Il server ha risposto con un errore.' };
    }
  } catch (err: any) {
    return { 
      success: false, 
      message: `Impossibile raggiungere l'URL: ${err.message}. Verifica che l'accesso dell'App Web sia impostato su "Chiunque".` 
    };
  }
}

// Support functions
export function getDefaultExpiryDate(reparto: Reparto): string {
  const daysMap: Record<Reparto, number> = {
    'Carne/Pesce': 3,
    'Ortofrutta': 5,
    'Frigo/Latticini': 7,
    'Altro': 14,
    'Dispensa': 60,
    'Surgelati': 90
  };
  const days = daysMap[reparto] !== undefined ? daysMap[reparto] : 14;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function calculateUrgency(scadenzaIso?: string): Urgenza {
  if (!scadenzaIso) return 'bassa';
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(scadenzaIso);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 2) return 'alta';
    if (diffDays <= 5) return 'media';
    return 'bassa';
  } catch {
    return 'media';
  }
}
