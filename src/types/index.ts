export type Reparto = 
  | 'Ortofrutta' 
  | 'Frigo/Latticini' 
  | 'Carne/Pesce' 
  | 'Dispensa' 
  | 'Surgelati' 
  | 'Altro';

export type Urgenza = 'alta' | 'media' | 'bassa';

export interface DispensaItem {
  id: string;
  ingrediente: string;
  quantita: string;
  reparto: Reparto;
  scadenza_stimata: string; // ISO Date YYYY-MM-DD
  urgenza: Urgenza;
  data_inserimento?: string;
}

export interface SpesaItem {
  id: string;
  articolo: string;
  quantita: string;
  reparto: Reparto;
  comprato: boolean;
}

export interface Ricetta {
  id?: string;
  titolo: string;
  tempo_min: number;
  ingredienti_usati: string[];
  ingredienti_mancanti?: string[];
  procedimento: string[];
  consiglio?: string;
}

export interface AppSettings {
  gasUrl: string;
  secretToken: string;
  geminiApiKey: string;
  demoMode: boolean;
}

export interface ParsedPantryItem {
  ingrediente: string;
  quantita?: string;
  reparto?: Reparto;
  scadenza_stimata?: string;
  urgenza?: Urgenza;
}
