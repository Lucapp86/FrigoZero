import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  ShoppingCart, 
  ArrowRight, 
  PackageCheck,
  Store,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SpesaItem, Reparto } from '../types';
import { VoiceInputButton } from '../components/VoiceInputButton';

interface SpesaTabProps {
  items: SpesaItem[];
  onAddItem: (item: Omit<SpesaItem, 'id' | 'comprato'>) => Promise<void>;
  onToggleItem: (id: string, newCompratoStatus?: boolean) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onMoveToDispensa: () => Promise<void>;
  isMoving: boolean;
}

const REPARTI_ORDINE: Reparto[] = [
  'Ortofrutta',
  'Frigo/Latticini',
  'Carne/Pesce',
  'Dispensa',
  'Surgelati',
  'Altro'
];

export const SpesaTab: React.FC<SpesaTabProps> = ({
  items,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onMoveToDispensa,
  isMoving
}) => {
  const [newArticolo, setNewArticolo] = useState('');
  const [newQuantita, setNewQuantita] = useState('1');
  const [newReparto, setNewReparto] = useState<Reparto>('Ortofrutta');
  const [showCompleted, setShowCompleted] = useState(true);

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newArticolo.trim()) return;

    await onAddItem({
      articolo: newArticolo.trim(),
      quantita: newQuantita.trim() || '1',
      reparto: newReparto
    });

    setNewArticolo('');
    setNewQuantita('1');
  };

  const handleVoiceTranscript = (text: string) => {
    // Inserisce il testo dettato
    setNewArticolo(text);
  };

  // Separa gli elementi da comprare da quelli già comprati
  const pendingItems = useMemo(() => items.filter(i => !i.comprato), [items]);
  const boughtItems = useMemo(() => items.filter(i => i.comprato), [items]);

  // Raggruppa i pendenti per reparto (percorso tipico del supermercato)
  const groupedPending = useMemo(() => {
    const groups: Partial<Record<Reparto, SpesaItem[]>> = {};
    for (const r of REPARTI_ORDINE) {
      const inRep = pendingItems.filter(i => i.reparto === r);
      if (inRep.length > 0) {
        groups[r] = inRep;
      }
    }
    return groups;
  }, [pendingItems]);

  const totalCount = items.length;
  const boughtCount = boughtItems.length;
  const progressPercent = totalCount > 0 ? Math.round((boughtCount / totalCount) * 100) : 0;

  return (
    <div className="pb-36 pt-2 px-4 max-w-3xl mx-auto space-y-4">
      
      {/* Input Aggiunta Articolo Spesa (Testo + Voce + Categoria) */}
      <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
            <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
            Aggiungi alla Lista Spesa
          </label>
          <span className="text-[11px] text-slate-400">
            {pendingItems.length} da acquistare
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            required
            value={newArticolo}
            onChange={(e) => setNewArticolo(e.target.value)}
            placeholder="es. Zucchine, Farina 00, Latte..."
            className="flex-1 bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
          />

          <VoiceInputButton onTranscript={handleVoiceTranscript} />

          <button
            type="submit"
            disabled={!newArticolo.trim()}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white flex items-center space-x-1 shadow-md shadow-blue-500/20 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Aggiungi</span>
          </button>
        </div>

        {/* Quantità e Selezione Reparto */}
        <div className="flex items-center space-x-2 pt-0.5">
          <input
            type="text"
            placeholder="Q.tà (es. 2, 500g)"
            value={newQuantita}
            onChange={(e) => setNewQuantita(e.target.value)}
            className="w-28 bg-slate-800/80 border border-slate-700/70 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          <select
            value={newReparto}
            onChange={(e) => setNewReparto(e.target.value as Reparto)}
            className="flex-1 bg-slate-800/80 border border-slate-700/70 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {REPARTI_ORDINE.map(rep => (
              <option key={rep} value={rep}>{rep}</option>
            ))}
          </select>
        </div>
      </form>

      {/* Barra Progresso Spesa */}
      {totalCount > 0 && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-400" />
              Avanzamento Spesa
            </span>
            <span className="text-slate-400 font-bold">
              {boughtCount} di {totalCount} comprati ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista Articoli da Comprare Raggruppati per Reparto */}
      {pendingItems.length === 0 && boughtItems.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-2">
          <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">Lista della spesa vuota</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Aggiungi gli articoli che ti servono oppure genera ricette da "Cosa Cucino" per aggiungere gli ingredienti mancanti con un click!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Sezioni per Reparto (percorso supermercato) */}
          {REPARTI_ORDINE.map(reparto => {
            const list = groupedPending[reparto];
            if (!list || list.length === 0) return null;

            return (
              <div key={reparto} className="space-y-2">
                <div className="flex items-center space-x-2 px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {reparto}
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-full">
                    {list.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {list.map(item => (
                    <div
                      key={item.id}
                      onClick={() => onToggleItem(item.id, true)}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-[0.99] rounded-2xl p-3 flex items-center justify-between cursor-pointer shadow-sm transition-all select-none group"
                    >
                      {/* Checkbox grande facile da toccare con una mano sola */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-xl border-2 border-slate-600 group-hover:border-blue-400 flex items-center justify-center transition-colors bg-slate-800/50 shrink-0">
                          {/* Vuoto prima di essere toccato */}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">
                            {item.articolo}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Quantità: {item.quantita}
                          </span>
                        </div>
                      </div>

                      {/* Rimuovi */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className="p-2 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Articoli già Comprati nel Carrello */}
          {boughtItems.length > 0 && (
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center justify-between w-full px-1 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Nel carrello ({boughtItems.length})
                </span>
                {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showCompleted && (
                <div className="space-y-1.5 opacity-70">
                  {boughtItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => onToggleItem(item.id, false)}
                      className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-2.5 flex items-center justify-between cursor-pointer hover:opacity-100 transition-all select-none"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <span className="text-xs text-slate-400 line-through truncate font-medium">
                          {item.articolo} ({item.quantita}) - <span className="text-[10px]">{item.reparto}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className="p-1.5 text-slate-600 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* PULSANTE FISSO STICKY IN FONDO: "Ho finito la spesa (Sposta in Dispensa)" */}
      {boughtItems.length > 0 && (
        <div className="fixed bottom-20 inset-x-0 z-20 px-4 max-w-md mx-auto pointer-events-auto">
          <button
            onClick={onMoveToDispensa}
            disabled={isMoving}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm flex items-center justify-center space-x-2 shadow-2xl shadow-emerald-500/40 active:scale-[0.98] transition-all border border-emerald-300/40"
          >
            {isMoving ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Spostamento in Dispensa in corso...</span>
              </>
            ) : (
              <>
                <PackageCheck className="w-5 h-5" />
                <span>Ho finito la spesa ({boughtItems.length} in Dispensa)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};
