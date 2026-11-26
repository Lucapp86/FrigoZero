import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  ShoppingCart, 
  CheckCircle, 
  Plus, 
  ChefHat, 
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Flame
} from 'lucide-react';
import { DispensaItem, Ricetta, AppSettings } from '../types';
import { generateRecipesWithGemini } from '../services/geminiApi';

interface CosaCucinoTabProps {
  dispensaItems: DispensaItem[];
  settings: AppSettings;
  onAddMissingToSpesa: (items: string[]) => Promise<void>;
  onConsumeIngredients: (ingredientNames: string[]) => Promise<void>;
}

export const CosaCucinoTab: React.FC<CosaCucinoTabProps> = ({
  dispensaItems,
  settings,
  onAddMissingToSpesa,
  onConsumeIngredients
}) => {
  const [selectedTime, setSelectedTime] = useState<number>(30);
  const [onlyInHouse, setOnlyInHouse] = useState<boolean>(true);
  const [recipes, setRecipes] = useState<Ricetta[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [addedMissingMap, setAddedMissingMap] = useState<Record<string, boolean>>({});
  const [cookedRecipeIdx, setCookedRecipeIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (dispensaItems.length === 0) {
      alert('La dispensa è vuota! Aggiungi qualche ingrediente prima di generare le ricette.');
      return;
    }

    setIsGenerating(true);
    setAddedMissingMap({});
    setCookedRecipeIdx(null);

    try {
      const results = await generateRecipesWithGemini(
        dispensaItems,
        selectedTime,
        onlyInHouse,
        settings.geminiApiKey
      );
      setRecipes(results);
    } catch (err: any) {
      alert('Errore generazione ricette: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddMissing = async (recipeIdx: number, missingItems: string[]) => {
    if (!missingItems || missingItems.length === 0) return;
    await onAddMissingToSpesa(missingItems);
    setAddedMissingMap(prev => ({ ...prev, [recipeIdx]: true }));
  };

  const handleCooked = async (recipeIdx: number, recipe: Ricetta) => {
    if (window.confirm(`Vuoi segnare come consumati in dispensa gli ingredienti usati per "${recipe.titolo}"?`)) {
      await onConsumeIngredients(recipe.ingredienti_usati);
      setCookedRecipeIdx(recipeIdx);
    }
  };

  // Ingredienti prioritari che scadono presto
  const urgentIngredients = dispensaItems.filter(i => i.urgenza === 'alta' || i.urgenza === 'media');

  return (
    <div className="pb-28 pt-2 px-4 max-w-3xl mx-auto space-y-4">
      
      {/* Box Filtri & Generatore IA */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        {/* Glow decorativo */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              Chef Anti-Spreco con Gemini
            </h2>
            <p className="text-xs text-slate-400">
              Crea 3 ricette su misura per consumare ciò che scade prima
            </p>
          </div>
        </div>

        {/* Controllo 1: Tempo a disposizione */}
        <div className="space-y-1.5 mb-4">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Tempo a disposizione
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 45].map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedTime === time
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
                }`}
              >
                {time === 45 ? '45+ min' : `${time} min`}
              </button>
            ))}
          </div>
        </div>

        {/* Controllo 2: Vincolo Dispensa */}
        <div className="space-y-1.5 mb-5">
          <label className="text-xs font-semibold text-slate-300">
            Ingredienti Extra
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setOnlyInHouse(true)}
              className={`p-2.5 rounded-xl font-medium transition-all text-left flex items-start space-x-2 ${
                onlyInHouse
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
              }`}
            >
              <div className="mt-0.5">
                <CheckCircle className={`w-3.5 h-3.5 ${onlyInHouse ? 'text-emerald-400' : 'text-slate-500'}`} />
              </div>
              <div>
                <div className="font-bold">Solo quello che ho</div>
                <div className="text-[10px] text-slate-400 leading-tight">Zero spesa extra</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOnlyInHouse(false)}
              className={`p-2.5 rounded-xl font-medium transition-all text-left flex items-start space-x-2 ${
                !onlyInHouse
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
              }`}
            >
              <div className="mt-0.5">
                <Plus className={`w-3.5 h-3.5 ${!onlyInHouse ? 'text-emerald-400' : 'text-slate-500'}`} />
              </div>
              <div>
                <div className="font-bold">+ 1-2 extra</div>
                <div className="text-[10px] text-slate-400 leading-tight">Con opzione lista spesa</div>
              </div>
            </button>
          </div>
        </div>

        {/* Lista ingredienti che Gemini darà priorità */}
        {urgentIngredients.length > 0 && (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
            <span className="text-[11px] text-slate-400 block mb-1">
              Priorità assoluta agli ingredienti in scadenza:
            </span>
            <div className="flex flex-wrap gap-1">
              {urgentIngredients.map(item => (
                <span 
                  key={item.id} 
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                    item.urgenza === 'alta' 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {item.ingrediente}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pulsante CTA Generazione con Gemini */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || dispensaItems.length === 0}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Gemini sta creando 3 ricette anti-spreco...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Genera 3 Ricette Anti-Spreco</span>
            </>
          )}
        </button>

      </div>

      {/* Risultati: Ricette Generate */}
      {recipes.length > 0 && (
        <div className="space-y-4 pt-2 animate-fadeIn">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Ricette Consigliate ({recipes.length})
            </h3>
            <span className="text-[11px] text-emerald-400 font-semibold">Gemini 2.5 Flash</span>
          </div>

          {recipes.map((recipe, idx) => {
            const hasMissing = recipe.ingredienti_mancanti && recipe.ingredienti_mancanti.length > 0;
            const isAddedToSpesa = addedMissingMap[idx];
            const isCooked = cookedRecipeIdx === idx;

            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors"
              >
                {/* Header Ricetta */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-extrabold text-white tracking-tight">
                      {recipe.titolo}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.tempo_min} minuti
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {recipe.ingredienti_usati.length} ingredienti da dispensa
                      </span>
                    </div>
                  </div>

                  {isCooked ? (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1 border border-emerald-500/30">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Cucinato!
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCooked(idx, recipe)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                    >
                      Segna Cucinata
                    </button>
                  )}
                </div>

                {/* Ingredienti Usati */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Ingredienti usati dalla tua dispensa:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.ingredienti_usati.map((ing: string, iIdx: number) => (
                      <span
                        key={iIdx}
                        className="text-xs bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 px-2.5 py-1 rounded-lg font-medium"
                      >
                        ✓ {ing}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Ingredienti Mancanti (con tasto Aggiungi alla Spesa) */}
                {hasMissing && (
                  <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Ingredienti mancanti ({recipe.ingredienti_mancanti!.length}):
                      </span>
                      
                      <button
                        onClick={() => handleAddMissing(idx, recipe.ingredienti_mancanti!)}
                        disabled={isAddedToSpesa}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
                          isAddedToSpesa
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                        }`}
                      >
                        {isAddedToSpesa ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Aggiunti alla Spesa</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Aggiungi alla Spesa</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredienti_mancanti!.map((m: string, mIdx: number) => (
                        <span
                          key={mIdx}
                          className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                        >
                          + {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Procedimento Passo-Passo */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <div className="text-xs font-bold text-slate-300">
                    Preparazione:
                  </div>
                  <ol className="space-y-2 text-xs text-slate-300 leading-relaxed list-none">
                    {recipe.procedimento.map((step: string, sIdx: number) => (
                      <li key={sIdx} className="flex items-start space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-700 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Consiglio Anti-Spreco */}
                {recipe.consiglio && (
                  <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Consiglio Chef:</strong> {recipe.consiglio}</span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Stato Iniziale se non ci sono ancora ricette */}
      {recipes.length === 0 && !isGenerating && (
        <div className="text-center py-10 px-4 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-emerald-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">
            Nessuna ricetta ancora generata
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Seleziona il tempo che hai e clicca sul pulsante in alto. L'intelligenza artificiale analizzerà la tua dispensa per evitare ogni spreco!
          </p>
        </div>
      )}

    </div>
  );
};
