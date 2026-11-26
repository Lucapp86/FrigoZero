import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Check, 
  Camera, 
  Sparkles, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { ParsedPantryItem, Reparto, Urgenza, DispensaItem } from '../types';

interface EditableItem {
  tempId: string;
  ingrediente: string;
  quantita: string;
  reparto: Reparto;
  scadenza_stimata: string;
  urgenza: Urgenza;
}

interface FoodScanReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ParsedPantryItem[];
  onConfirm: (confirmedItems: Omit<DispensaItem, 'id'>[]) => Promise<void>;
}

const REPARTI: Reparto[] = [
  'Ortofrutta',
  'Frigo/Latticini',
  'Carne/Pesce',
  'Dispensa',
  'Surgelati',
  'Altro'
];

export const FoodScanReviewModal: React.FC<FoodScanReviewModalProps> = ({
  isOpen,
  onClose,
  items,
  onConfirm
}) => {
  const [editableList, setEditableList] = useState<EditableItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inizializza o aggiorna la lista locale quando cambiano gli items o si apre il modal
  useEffect(() => {
    if (isOpen) {
      const todayIso = new Date().toISOString().split('T')[0];
      const initial = items.map((item, idx) => ({
        tempId: `item_${Date.now()}_${idx}`,
        ingrediente: item.ingrediente || '',
        quantita: item.quantita || '1',
        reparto: item.reparto || 'Altro',
        scadenza_stimata: item.scadenza_stimata || todayIso,
        urgenza: item.urgenza || 'media'
      }));
      setEditableList(initial);
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  // Calcola urgenza in base alla data
  const calculateUrgencyFromDate = (dateStr: string): Urgenza => {
    if (!dateStr) return 'media';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(dateStr);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) return 'alta';
    if (diffDays <= 5) return 'media';
    return 'bassa';
  };

  const handleUpdateItem = (tempId: string, field: keyof EditableItem, value: any) => {
    setEditableList(prev => prev.map(item => {
      if (item.tempId !== tempId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'scadenza_stimata') {
        updated.urgenza = calculateUrgencyFromDate(value);
      }
      return updated;
    }));
  };

  const handleRemoveItem = (tempId: string) => {
    setEditableList(prev => prev.filter(item => item.tempId !== tempId));
  };

  const handleAddNewItem = () => {
    const today = new Date();
    today.setDate(today.getDate() + 5);
    const expIso = today.toISOString().split('T')[0];

    const newItem: EditableItem = {
      tempId: `item_${Date.now()}_${Math.random()}`,
      ingrediente: '',
      quantita: '1',
      reparto: 'Frigo/Latticini',
      scadenza_stimata: expIso,
      urgenza: 'media'
    };
    setEditableList(prev => [...prev, newItem]);
  };

  const handleConfirm = async () => {
    const validItems = editableList
      .filter(item => item.ingrediente.trim().length > 0)
      .map(item => ({
        ingrediente: item.ingrediente.trim(),
        quantita: item.quantita.trim() || '1',
        reparto: item.reparto,
        scadenza_stimata: item.scadenza_stimata,
        urgenza: item.urgenza,
        data_inserimento: new Date().toISOString()
      }));

    if (validItems.length === 0) {
      alert('Inserisci almeno un ingrediente valido prima di confermare.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(validItems);
      onClose();
    } catch (err: any) {
      alert('Errore durante il salvataggio in dispensa: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header Modale */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-sm">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Alimenti Riconosciuti
                </h3>
                <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {editableList.length} {editableList.length === 1 ? 'trovato' : 'trovati'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Revisiona, correggi nome o quantità prima di aggiungere in Dispensa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Scrollabile */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {editableList.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-medium">Nessun alimento presente nella lista.</p>
              <button
                type="button"
                onClick={handleAddNewItem}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 pt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Aggiungi alimento manualmente
              </button>
            </div>
          ) : (
            editableList.map((item, index) => (
              <div
                key={item.tempId}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-2.5 transition-all hover:border-slate-700/80"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.tempId)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Rimuovi alimento"
                    aria-label={`Rimuovi ${item.ingrediente || 'alimento'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* Nome Alimento */}
                  <div className="sm:col-span-5">
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">
                      Nome alimento *
                    </label>
                    <input
                      type="text"
                      value={item.ingrediente}
                      onChange={(e) => handleUpdateItem(item.tempId, 'ingrediente', e.target.value)}
                      placeholder="es. Latte parzialmente scremato"
                      className="w-full bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* Quantità */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">
                      Quantità
                    </label>
                    <input
                      type="text"
                      value={item.quantita}
                      onChange={(e) => handleUpdateItem(item.tempId, 'quantita', e.target.value)}
                      placeholder="es. 1L, 500g"
                      className="w-full bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* Reparto */}
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">
                      Reparto
                    </label>
                    <select
                      value={item.reparto}
                      onChange={(e) => handleUpdateItem(item.tempId, 'reparto', e.target.value as Reparto)}
                      className="w-full bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {REPARTI.map(rep => (
                        <option key={rep} value={rep}>{rep}</option>
                      ))}
                    </select>
                  </div>

                  {/* Scadenza stimata */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-medium text-slate-400 block mb-1 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      Scadenza
                    </label>
                    <input
                      type="date"
                      value={item.scadenza_stimata}
                      onChange={(e) => handleUpdateItem(item.tempId, 'scadenza_stimata', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pulsante Aggiungi Altro Alimento */}
          {editableList.length > 0 && (
            <button
              type="button"
              onClick={handleAddNewItem}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800/40 text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi un altro alimento</span>
            </button>
          )}
        </div>

        {/* Footer con Azioni */}
        <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            I prodotti saranno sincronizzati con Google Sheets e memorizzati in locale.
          </p>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              Annulla
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || editableList.length === 0}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Conferma e aggiungi in Dispensa</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
