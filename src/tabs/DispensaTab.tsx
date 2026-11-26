import React, { useState, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Plus, 
  Search, 
  Clock, 
  Check, 
  Calendar,
  AlertTriangle,
  Layers,
  Utensils,
  Camera
} from 'lucide-react';
import { DispensaItem, Reparto, Urgenza, AppSettings, ParsedPantryItem } from '../types';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { FoodScanReviewModal } from '../components/FoodScanReviewModal';
import { parsePantryInputWithGemini, analyzeFoodImage } from '../services/geminiApi';
import { resizeImageToBase64 } from '../utils/imageUtils';

interface DispensaTabProps {
  items: DispensaItem[];
  settings: AppSettings;
  onAddItems: (newItems: Omit<DispensaItem, 'id'>[]) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onNavigateToCook: () => void;
}

const REPARTI: Reparto[] = [
  'Ortofrutta', 
  'Frigo/Latticini', 
  'Carne/Pesce', 
  'Dispensa', 
  'Surgelati', 
  'Altro'
];

export const DispensaTab: React.FC<DispensaTabProps> = ({
  items,
  settings,
  onAddItems,
  onDeleteItem,
  onNavigateToCook
}) => {
  const [naturalInput, setNaturalInput] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedReparto, setSelectedReparto] = useState<string>('all');
  const [showManualAdd, setShowManualAdd] = useState(false);

  // Scansione fotografica (scontrino / frigo)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [scannedItems, setScannedItems] = useState<ParsedPantryItem[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Form manuale
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualReparto, setManualReparto] = useState<Reparto>('Frigo/Latticini');
  const [manualDays, setManualDays] = useState('5');

  // Gestione aggiunta rapida via AI
  const handleAiAdd = async () => {
    if (!naturalInput.trim()) return;

    setIsProcessingAi(true);
    try {
      const parsedItems = await parsePantryInputWithGemini(naturalInput, settings.geminiApiKey);
      if (parsedItems.length > 0) {
        await onAddItems(parsedItems as any);
        setNaturalInput('');
      } else {
        alert('Nessun ingrediente riconosciuto nel testo. Prova ad essere più specifico.');
      }
    } catch (err: any) {
      alert('Errore durante l\'analisi degli ingredienti: ' + err.message);
    } finally {
      setIsProcessingAi(false);
    }
  };

  // Gestione aggiunta manuale
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const days = parseInt(manualDays, 10) || 5;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + days);
    const scadenzaIso = expDate.toISOString().split('T')[0];

    const urgenza: Urgenza = days <= 2 ? 'alta' : (days <= 5 ? 'media' : 'bassa');

    await onAddItems([{
      ingrediente: manualName.trim(),
      quantita: manualQty.trim() || '1',
      reparto: manualReparto,
      scadenza_stimata: scadenzaIso,
      urgenza: urgenza,
      data_inserimento: new Date().toISOString()
    }]);

    setManualName('');
    setManualQty('1');
    setShowManualAdd(false);
  };

  // Dettatura vocale trascritta
  const handleVoiceTranscript = (text: string) => {
    setNaturalInput(prev => prev ? `${prev}, ${text}` : text);
  };

  // Gestione scansione fotografica (scontrino o frigo/dispensa)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    setIsAnalyzingImage(true);
    try {
      // 1. Compressione immagine lato client (Canvas HTML5)
      const { base64, mimeType } = await resizeImageToBase64(file, 1024, 0.75);

      // 2. Chiamata a Gemini Vision (gemini-2.5-flash) o mock se in demo
      const itemsFound = await analyzeFoodImage(base64, mimeType, settings.geminiApiKey);

      if (itemsFound && itemsFound.length > 0) {
        setScannedItems(itemsFound);
        setIsReviewModalOpen(true);
      } else {
        alert('Nessun alimento riconosciuto nell\'immagine. Prova con una foto più nitida o ravvicinata.');
      }
    } catch (err: any) {
      console.error('Errore durante l\'analisi dell\'immagine:', err);
      alert('Errore durante l\'analisi dell\'immagine: ' + (err.message || 'Errore sconosciuto'));
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Conferma salvataggio alimenti riconosciuti via addDispensa
  const handleConfirmScannedItems = async (confirmedItems: Omit<DispensaItem, 'id'>[]) => {
    await onAddItems(confirmedItems);
    setIsReviewModalOpen(false);
    setScannedItems([]);
  };

  // Calcolo giorni rimanenti e badge
  const getExpiryDetails = (scadenzaIso: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(scadenzaIso);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Scaduto (${Math.abs(diffDays)}g fa)`, style: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    } else if (diffDays === 0) {
      return { label: 'Scade oggi!', style: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' };
    } else if (diffDays === 1) {
      return { label: 'Scade domani', style: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
    } else if (diffDays <= 4) {
      return { label: `${diffDays} giorni rimasti`, style: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    } else {
      return { label: `${diffDays} giorni`, style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
  };

  // Conteggi urgenza
  const urgentCount = items.filter(i => i.urgenza === 'alta').length;
  const mediumCount = items.filter(i => i.urgenza === 'media').length;

  // Filtraggio lista
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Filtro ricerca
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.ingrediente.toLowerCase().includes(q);
        const matchesReparto = item.reparto.toLowerCase().includes(q);
        if (!matchesName && !matchesReparto) return false;
      }
      // Filtro urgenza
      if (selectedUrgency !== 'all' && item.urgenza !== selectedUrgency) {
        return false;
      }
      // Filtro reparto
      if (selectedReparto !== 'all' && item.reparto !== selectedReparto) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      // Ordina sempre per data di scadenza più imminente
      return a.scadenza_stimata.localeCompare(b.scadenza_stimata);
    });
  }, [items, searchQuery, selectedUrgency, selectedReparto]);

  return (
    <div className="pb-28 pt-2 px-4 max-w-3xl mx-auto space-y-4">
      
      {/* Box Input Intelligente (Testo Libero + Voce + Gemini) */}
      <div className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 rounded-2xl p-3.5 border border-slate-700/80 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Inserimento Rapido con IA
          </label>
          <button
            onClick={() => setShowManualAdd(!showManualAdd)}
            className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            {showManualAdd ? 'Nascondi Manuale' : '+ Form Classico'}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={naturalInput}
            onChange={(e) => setNaturalInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiAdd()}
            placeholder="es. uova, 2 zucchine, latte in scadenza, petto di pollo..."
            className="flex-1 min-w-0 bg-slate-950/70 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
            disabled={isProcessingAi || isAnalyzingImage}
          />
          
          <VoiceInputButton 
            onTranscript={handleVoiceTranscript} 
            disabled={isProcessingAi || isAnalyzingImage} 
          />

          {/* Pulsante Fotocamera per Scansione Scontrino o Frigo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingAi || isAnalyzingImage}
            aria-label="Scansiona scontrino o frigo"
            title="Scansiona scontrino o frigo"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 disabled:opacity-50 transition-all shrink-0 flex items-center justify-center"
          >
            {isAnalyzingImage ? (
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-emerald-400" />
            )}
          </button>

          {/* Input file nascosto con capture environment per fotocamera e galleria */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageSelect}
          />

          <button
            onClick={handleAiAdd}
            disabled={isProcessingAi || isAnalyzingImage || !naturalInput.trim()}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
          >
            {isProcessingAi ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Analisi...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Aggiungi</span>
              </>
            )}
          </button>
        </div>
        
        {/* Stato di caricamento analisi foto */}
        {isAnalyzingImage && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 mt-2.5 animate-pulse">
            <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="font-medium">Analisi immagine in corso (scontrino o frigo)...</span>
          </div>
        )}

        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
          💡 Scrivi, detta a voce o fotografa scontrini e alimenti: Gemini stimerà automaticamente reparto e scadenza.
        </p>
      </div>

      {/* Form Aggiunta Manuale (Collassabile) */}
      {showManualAdd && (
        <form onSubmit={handleManualAdd} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fadeIn">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Aggiunta Manuale Dettagliata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nome Ingrediente *</label>
              <input
                type="text"
                required
                placeholder="es. Mozzarella"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Quantità</label>
              <input
                type="text"
                placeholder="es. 250g, 2 pezzi"
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Reparto</label>
              <select
                value={manualReparto}
                onChange={(e) => setManualReparto(e.target.value as Reparto)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {REPARTI.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Scadenza Stimata (Giorni da oggi)</label>
              <input
                type="number"
                min="0"
                max="365"
                value={manualDays}
                onChange={(e) => setManualDays(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-transform active:scale-95"
            >
              Salva in Dispensa
            </button>
          </div>
        </form>
      )}

      {/* Banner Urgenza & Call to Action Cucina */}
      {urgentCount > 0 && (
        <div className="bg-gradient-to-r from-rose-950/60 via-amber-950/40 to-slate-900 border border-rose-500/30 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{urgentCount} {urgentCount === 1 ? 'alimento in scadenza rapida' : 'alimenti in scadenza rapida'}!</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Non sprecare cibo: trova subito cosa preparare oggi.
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToCook}
            className="px-3.5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-rose-950/50 active:scale-95 transition-all shrink-0"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Cucina Ora</span>
          </button>
        </div>
      )}

      {/* Barra di Ricerca & Filtri Urgenza */}
      <div className="space-y-2.5">
        
        {/* Input Cerca */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca ingrediente o reparto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
          />
        </div>

        {/* Chip Filtro Urgenza */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedUrgency('all')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
              selectedUrgency === 'all'
                ? 'bg-slate-700 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Tutti ({items.length})
          </button>
          
          <button
            onClick={() => setSelectedUrgency('alta')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center space-x-1 ${
              selectedUrgency === 'alta'
                ? 'bg-rose-500 text-white shadow'
                : 'bg-slate-900 text-rose-400 hover:text-rose-300 border border-slate-800'
            }`}
          >
            <span>Urgente ({urgentCount})</span>
          </button>

          <button
            onClick={() => setSelectedUrgency('media')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center space-x-1 ${
              selectedUrgency === 'media'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-slate-900 text-amber-400 hover:text-amber-300 border border-slate-800'
            }`}
          >
            <span>Entro 5gg ({mediumCount})</span>
          </button>

          <button
            onClick={() => setSelectedUrgency('bassa')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
              selectedUrgency === 'bassa'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'bg-slate-900 text-emerald-400 hover:text-emerald-300 border border-slate-800'
            }`}
          >
            <span>Lunga durata</span>
          </button>
        </div>

        {/* Chip Filtro Reparti */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px]">
          <button
            onClick={() => setSelectedReparto('all')}
            className={`px-2.5 py-1 rounded-lg shrink-0 ${
              selectedReparto === 'all' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tutti i reparti
          </button>
          {REPARTI.map(rep => (
            <button
              key={rep}
              onClick={() => setSelectedReparto(rep)}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                selectedReparto === rep ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {rep}
            </button>
          ))}
        </div>

      </div>

      {/* Lista Card Ingredienti */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 space-y-2">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">Nessun ingrediente trovato</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedUrgency !== 'all' || selectedReparto !== 'all'
              ? 'Nessun risultato per i filtri selezionati. Prova a reimpostare i filtri.'
              : 'La tua dispensa è vuota! Usa la barra in alto per aggiungere ingredienti a voce o per iscritto.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map(item => {
            const expiry = getExpiryDetails(item.scadenza_stimata);

            return (
              <div
                key={item.id}
                className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between shadow-sm transition-all group"
              >
                {/* Dettagli Ingrediente */}
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm text-white truncate tracking-tight">
                      {item.ingrediente}
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60 shrink-0">
                      {item.quantita}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1">
                    {/* Badge Reparto */}
                    <span className="text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
                      {item.reparto}
                    </span>

                    {/* Badge Scadenza Dinamica */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${expiry.style}`}>
                      <Clock className="w-2.5 h-2.5" />
                      <span>{expiry.label}</span>
                    </span>

                    <span className="text-[10px] text-slate-500 flex items-center space-x-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{item.scadenza_stimata}</span>
                    </span>
                  </div>
                </div>

                {/* Azione Rapida: Consumato */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    aria-label={`Segna ${item.ingrediente} come consumato`}
                    title="Segna come consumato"
                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 active:scale-90 transition-all flex items-center space-x-1 text-xs font-semibold"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span className="hidden sm:inline">Consumato</span>
                  </button>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    aria-label={`Rimuovi ${item.ingrediente}`}
                    title="Elimina"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition-all sm:hidden"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Statistiche Piè di pagina */}
      <div className="pt-2 text-center text-xs text-slate-500">
        Totale ingredienti: <strong className="text-slate-400">{items.length}</strong> • Urgenza alta: <strong className="text-rose-400">{urgentCount}</strong>
      </div>

      {/* Modale di Revisione Rapida Alimenti Riconosciuti */}
      <FoodScanReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        items={scannedItems}
        onConfirm={handleConfirmScannedItems}
      />

    </div>
  );
};
