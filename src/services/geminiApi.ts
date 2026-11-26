import { DispensaItem, ParsedPantryItem, Ricetta, Reparto } from '../types';
import { INITIAL_MOCK_RICETTE } from './mockData';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Chiama l'API di Gemini per estrarre ingredienti strutturati da linguaggio naturale o dettatura vocale.
 */
export async function parsePantryInputWithGemini(
  rawText: string,
  apiKey: string
): Promise<ParsedPantryItem[]> {
  if (!rawText.trim()) return [];

  // Se non c'è la chiave API, usa il parser euristico di riserva
  if (!apiKey || apiKey.trim() === '') {
    return parsePantryFallback(rawText);
  }

  const todayIso = new Date().toISOString().split('T')[0];

  const prompt = `Sei l'assistente IA di "FrigoZero", un'applicazione anti-spreco alimentare.
Analizza il seguente testo inserito dall'utente (scritto o dettato vocalmente):
"${rawText}"

Estrai tutti gli ingredienti/alimenti menzionati e restituisci un array JSON di oggetti.
Ogni oggetto DEVE avere i seguenti campi:
- "ingrediente": stringa, nome chiaro dell'ingrediente (es. "Zucchine", "Petto di pollo", "Latte")
- "quantita": stringa, quantità indicata (es. "2", "500g", "1 litro", "1 confezione") oppure "1" se non specificata
- "reparto": uno tra "Ortofrutta", "Frigo/Latticini", "Carne/Pesce", "Dispensa", "Surgelati", "Altro"
- "scadenza_stimata": data stimata in formato ISO YYYY-MM-DD. Oggi è ${todayIso}.
  Regole di stima:
  * Se l'utente dice "in scadenza", "da consumare subito", "scade oggi" o "domani" -> imposta data tra oggi e domani (0-1 giorno).
  * Carne o pesce freschi -> +2 o +3 giorni.
  * Ortofrutta fresca -> +4 o +5 giorni.
  * Frigo/Latticini (latte, yogurt, formaggi freschi) -> +5 o +7 giorni.
  * Dispensa secca (pasta, riso, scatolame, farina) -> +60 giorni.
  * Surgelati -> +90 giorni.
- "urgenza": uno tra "alta" (se scade entro 2 giorni o è specificato "in scadenza"), "media" (3-5 giorni), "bassa" (oltre 5 giorni).

Rispondi ESCLUSIVAMENTE con un array JSON valido, senza testo o blocchi markdown all'infuori del JSON.`;

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Gemini API call failed, falling back:', errText);
      return parsePantryFallback(rawText);
    }

    const jsonRes = await response.json();
    const candidateText = jsonRes?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return parsePantryFallback(rawText);
    }

    // Parsing JSON pulito
    const cleanedJson = cleanJsonString(candidateText);
    const parsed = JSON.parse(cleanedJson);
    if (Array.isArray(parsed)) {
      return parsed.map(sanitizeParsedItem);
    } else if (typeof parsed === 'object' && parsed !== null) {
      // In caso restituisca { items: [...] } o singolo oggetto
      const items = (parsed as any).items || (parsed as any).ingredienti || [parsed];
      return items.map(sanitizeParsedItem);
    }

    return parsePantryFallback(rawText);
  } catch (error) {
    console.error('Errore durante la chiamata a Gemini:', error);
    return parsePantryFallback(rawText);
  }
}

/**
 * Genera 3 ricette anti-spreco utilizzando gli ingredienti presenti in Dispensa.
 */
export async function generateRecipesWithGemini(
  dispensaItems: DispensaItem[],
  tempoMaxMinuti: number,
  soloQuelloCheHo: boolean,
  apiKey: string
): Promise<Ricetta[]> {
  // Se non ci sono ingredienti o manca l'API key, restituisci ricette mock intelligenti
  if (dispensaItems.length === 0 || !apiKey || apiKey.trim() === '') {
    return filterMockRecipes(dispensaItems, tempoMaxMinuti);
  }

  // Ordina per urgenza (alta prima) e poi per scadenza più vicina
  const sorted = [...dispensaItems].sort((a, b) => {
    const weight: Record<string, number> = { alta: 0, media: 1, bassa: 2 };
    const wA = weight[a.urgenza] ?? 3;
    const wB = weight[b.urgenza] ?? 3;
    if (wA !== wB) return wA - wB;
    return a.scadenza_stimata.localeCompare(b.scadenza_stimata);
  });

  const dispensaListString = sorted
    .map(i => `- ${i.ingrediente} (${i.quantita}, Reparto: ${i.reparto}, Urgenza: ${i.urgenza.toUpperCase()}, Scadenza: ${i.scadenza_stimata})`)
    .join('\n');

  const prompt = `Sei un esperto chef della cucina italiana focalizzato sulla filosofia "Cucina a Spreco Zero" (FrigoZero).
L'utente ha attualmente a disposizione questi ingredienti nella sua dispensa/frigorifero:

${dispensaListString}

REQUISITI DELLA RICHIESTA:
1. Tempo massimo di preparazione e cottura: ${tempoMaxMinuti} minuti.
2. Vincolo ingredienti: ${soloQuelloCheHo 
  ? "RIGOROSO: usa ESCLUSIVAMENTE gli ingredienti elencati nella dispensa (più basi universali da cucina come sale, pepe, acqua, olio)." 
  : "FLESSIBILE: dai priorità agli ingredienti in dispensa, ma puoi includere 1 o 2 ingredienti extra comuni da acquistare al supermercato."
}
3. OBIETTIVO PRIMARIO: massimizza l'uso degli ingredienti contrassegnati con URGENZA ALTA o MEDIA per evitare che vadano a male.
4. Genera esattamente 3 ricette varie, sfiziose, realistiche e facili da cucinare a casa.

Restituisci ESCLUSIVAMENTE un array JSON con questa struttura esatta:
[
  {
    "titolo": "Nome invitante del piatto",
    "tempo_min": 20,
    "ingredienti_usati": ["ingrediente della dispensa 1", "ingrediente della dispensa 2"],
    "ingredienti_mancanti": ["ingrediente extra da comprare 1"],
    "procedimento": [
      "Passaggio 1: istruzioni chiare e concise",
      "Passaggio 2: ...",
      "Passaggio 3: ..."
    ],
    "consiglio": "Breve trucco dello chef o consiglio per non sprecare"
  }
]`;

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      })
    });

    if (!response.ok) {
      console.warn('Gemini Ricette call failed, fallback mock.');
      return filterMockRecipes(dispensaItems, tempoMaxMinuti);
    }

    const jsonRes = await response.json();
    const candidateText = jsonRes?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return filterMockRecipes(dispensaItems, tempoMaxMinuti);
    }

    const cleaned = cleanJsonString(candidateText);
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((r: any) => ({
        titolo: r.titolo || 'Ricetta Veloce Anti-Spreco',
        tempo_min: Number(r.tempo_min) || tempoMaxMinuti,
        ingredienti_usati: Array.isArray(r.ingredienti_usati) ? r.ingredienti_usati : [],
        ingredienti_mancanti: Array.isArray(r.ingredienti_mancanti) ? r.ingredienti_mancanti : [],
        procedimento: Array.isArray(r.procedimento) ? r.procedimento : [String(r.procedimento || '')],
        consiglio: r.consiglio || ''
      }));
    }

    return filterMockRecipes(dispensaItems, tempoMaxMinuti);
  } catch (err) {
    console.error('Errore generazione ricette Gemini:', err);
    return filterMockRecipes(dispensaItems, tempoMaxMinuti);
  }
}

/**
 * Parser euristico locale di fallback quando l'utente non ha impostato la chiave Gemini
 * o è offline. Estrae quantità, reparto e stima la scadenza.
 */
function parsePantryFallback(rawText: string): ParsedPantryItem[] {
  // Separa per virgola, " e ", " più ", punto e a capo
  const tokens = rawText
    .split(/,|\be\b|\bpiù\b|\+|\n/gi)
    .map(t => t.trim())
    .filter(t => t.length > 1);

  if (tokens.length === 0) {
    tokens.push(rawText.trim());
  }

  const today = new Date();

  return tokens.map(token => {
    let lower = token.toLowerCase();
    let isUrgent = lower.includes('in scadenza') || lower.includes('scade') || lower.includes('subito');
    
    // Rimuove la dicitura 'in scadenza' dal nome
    let cleanedName = token
      .replace(/\b(in scadenza|da consumare|scade presto|subito|oggi)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Rileva quantità semplice (es. "2 zucchine", "500g pasta", "1l latte")
    let quantita = '1';
    const qtyMatch = cleanedName.match(/^(\d+[\s\w]*?)\s+([a-zA-ZÀ-ÿ].*)/i);
    if (qtyMatch) {
      quantita = qtyMatch[1].trim();
      cleanedName = qtyMatch[2].trim();
    }

    // Capitalizza nome
    if (cleanedName.length > 0) {
      cleanedName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
    } else {
      cleanedName = token;
    }

    // Rileva reparto
    const reparto = detectReparto(cleanedName);

    // Calcola giorni di scadenza stimata
    let daysToAdd = isUrgent ? 1 : getDaysForReparto(reparto);
    const expDate = new Date();
    expDate.setDate(today.getDate() + daysToAdd);
    const scadenzaIso = expDate.toISOString().split('T')[0];

    const urgenza = isUrgent || daysToAdd <= 2 ? 'alta' : (daysToAdd <= 5 ? 'media' : 'bassa');

    return {
      ingrediente: cleanedName,
      quantita: quantita,
      reparto: reparto,
      scadenza_stimata: scadenzaIso,
      urgenza: urgenza
    };
  });
}

function detectReparto(name: string): Reparto {
  const n = name.toLowerCase();
  if (/mela|pera|banana|limon|aranc|verdura|zucch|carot|pomodor|insalat|cipoll|patat|spinac|fungh|peperon|frutta/i.test(n)) {
    return 'Ortofrutta';
  }
  if (/latte|yogurt|formagg|mozzarell|burro|parmigian|ricott|panna|uov/i.test(n)) {
    return 'Frigo/Latticini';
  }
  if (/pollo|carne|manzo|maiale|macinato|pesce|salmone|tonno|orata|prosciutt|salame|fesa/i.test(n)) {
    return 'Carne/Pesce';
  }
  if (/pasta|riso|farina|biscott|cereali|olio|sale|zucchero|scatol|legumi|tonno in scatola/i.test(n)) {
    return 'Dispensa';
  }
  if (/surgelat|gelato|piselli surgelati|bastoncini/i.test(n)) {
    return 'Surgelati';
  }
  return 'Altro';
}

function getDaysForReparto(reparto: Reparto): number {
  switch (reparto) {
    case 'Carne/Pesce': return 2;
    case 'Ortofrutta': return 4;
    case 'Frigo/Latticini': return 6;
    case 'Dispensa': return 60;
    case 'Surgelati': return 90;
    default: return 10;
  }
}

function sanitizeParsedItem(item: any): ParsedPantryItem {
  const repartiValidi: Reparto[] = ['Ortofrutta', 'Frigo/Latticini', 'Carne/Pesce', 'Dispensa', 'Surgelati', 'Altro'];
  const urgenzeValide = ['alta', 'media', 'bassa'];

  const reparto = repartiValidi.includes(item.reparto) ? item.reparto : detectReparto(item.ingrediente || '');
  const urgenza = urgenzeValide.includes(item.urgenza) ? item.urgenza : 'media';

  return {
    ingrediente: String(item.ingrediente || 'Ingrediente').trim(),
    quantita: String(item.quantita || '1').trim(),
    reparto: reparto,
    scadenza_stimata: item.scadenza_stimata || new Date().toISOString().split('T')[0],
    urgenza: urgenza
  };
}

function cleanJsonString(str: string): string {
  return str
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function filterMockRecipes(dispensaItems: DispensaItem[], tempoMax: number): Ricetta[] {
  // Cerca ricette che rientrano nel tempo
  const filtered = INITIAL_MOCK_RICETTE.filter((r: Ricetta) => r.tempo_min <= tempoMax);
  return filtered.length > 0 ? filtered : INITIAL_MOCK_RICETTE;
}
