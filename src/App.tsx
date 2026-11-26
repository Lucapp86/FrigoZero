import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Navbar, TabType } from './components/Navbar';
import { SettingsModal } from './components/SettingsModal';
import { DispensaTab } from './tabs/DispensaTab';
import { CosaCucinoTab } from './tabs/CosaCucinoTab';
import { SpesaTab } from './tabs/SpesaTab';
import { AppSettings, DispensaItem, SpesaItem, Reparto } from './types';
import { 
  loadSettings, 
  saveSettings, 
  loadLocalDispensa, 
  loadLocalSpesa, 
  saveLocalDispensa, 
  saveLocalSpesa 
} from './services/storage';
import { 
  fetchAllData, 
  addDispensaItems, 
  deleteDispensaItems, 
  addSpesaItems, 
  toggleSpesaItem, 
  deleteSpesaItems, 
  moveSpesaToDispensa 
} from './services/gasApi';
import { INITIAL_MOCK_DISPENSA, INITIAL_MOCK_SPESA } from './services/mockData';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [activeTab, setActiveTab] = useState<TabType>('dispensa');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [dispensaItems, setDispensaItems] = useState<DispensaItem[]>(loadLocalDispensa);
  const [spesaItems, setSpesaItems] = useState<SpesaItem[]>(loadLocalSpesa);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(!settings.demoMode && !!settings.gasUrl);
  const [isMovingSpesa, setIsMovingSpesa] = useState<boolean>(false);

  // Notifiche Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Caricamento iniziale dei dati
  const loadData = useCallback(async (currentSettings: AppSettings) => {
    setIsLoading(true);
    try {
      const result = await fetchAllData(currentSettings);
      setDispensaItems(result.dispensa);
      setSpesaItems(result.spesa);
      setIsOnline(!result.isDemo);

      if (result.error) {
        showToast(result.error, 'error');
      }
    } catch (err: any) {
      console.warn('Errore sincronizzazione:', err);
      setIsOnline(false);
      showToast('Utilizzo dati locali (offline)', 'info');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(settings);
  }, [loadData, settings]);

  // Gestione Dispensa
  const handleAddDispensa = async (newItems: Omit<DispensaItem, 'id'>[]) => {
    try {
      const updated = await addDispensaItems(settings, newItems);
      setDispensaItems(updated);
      showToast(`${newItems.length} ingrediente/i aggiunto/i alla Dispensa!`, 'success');
    } catch (e: any) {
      showToast('Errore durante l\'aggiunta in dispensa: ' + e.message, 'error');
    }
  };

  const handleDeleteDispensa = async (id: string) => {
    try {
      const updated = await deleteDispensaItems(settings, [id]);
      setDispensaItems(updated);
      showToast('Ingrediente consumato!', 'success');
    } catch (e: any) {
      showToast('Errore durante l\'eliminazione: ' + e.message, 'error');
    }
  };

  // Gestione Spesa
  const handleAddSpesa = async (item: Omit<SpesaItem, 'id' | 'comprato'>) => {
    try {
      const updated = await addSpesaItems(settings, [item]);
      setSpesaItems(updated);
      showToast(`"${item.articolo}" aggiunto alla Spesa!`, 'success');
    } catch (e: any) {
      showToast('Errore aggiunta spesa: ' + e.message, 'error');
    }
  };

  const handleToggleSpesa = async (id: string, newCompratoStatus?: boolean) => {
    try {
      const updated = await toggleSpesaItem(settings, id, newCompratoStatus);
      setSpesaItems(updated);
    } catch (e: any) {
      showToast('Errore aggiornamento spesa: ' + e.message, 'error');
    }
  };

  const handleDeleteSpesa = async (id: string) => {
    try {
      const updated = await deleteSpesaItems(settings, [id]);
      setSpesaItems(updated);
      showToast('Articolo rimosso dalla spesa', 'info');
    } catch (e: any) {
      showToast('Errore eliminazione spesa: ' + e.message, 'error');
    }
  };

  // SPOSTA DA SPESA A DISPENSA
  const handleMoveSpesaToDispensa = async () => {
    setIsMovingSpesa(true);
    try {
      const result = await moveSpesaToDispensa(settings);
      setDispensaItems(result.dispensa);
      setSpesaItems(result.spesa);
      showToast(`🎉 ${result.movedCount} articoli acquistati spostati in Dispensa con scadenza stimata!`, 'success');
    } catch (e: any) {
      showToast('Errore spostamento spesa: ' + e.message, 'error');
    } finally {
      setIsMovingSpesa(false);
    }
  };

  // Aggiungi ingredienti mancanti da Ricetta alla Spesa
  const handleAddMissingToSpesa = async (missingNames: string[]) => {
    const newItems: Omit<SpesaItem, 'id' | 'comprato'>[] = missingNames.map(name => {
      let reparto: Reparto = 'Altro';
      const n = name.toLowerCase();
      if (/mela|pera|verdura|zucch|carot|pomodor|insalat|cipoll|patat|aglio/i.test(n)) reparto = 'Ortofrutta';
      else if (/latte|yogurt|formagg|burro|parmigian|ricott|uov/i.test(n)) reparto = 'Frigo/Latticini';
      else if (/pollo|carne|pesce|salmone|tonno|prosciutt/i.test(n)) reparto = 'Carne/Pesce';
      else if (/pasta|riso|farina|olio|sale|zucchero/i.test(n)) reparto = 'Dispensa';

      return {
        articolo: name,
        quantita: '1',
        reparto: reparto
      };
    });

    try {
      const updated = await addSpesaItems(settings, newItems);
      setSpesaItems(updated);
      showToast(`${newItems.length} ingrediente/i mancante/i aggiunto/i alla Lista Spesa!`, 'success');
    } catch (e: any) {
      showToast('Errore aggiunta ingredienti mancanti: ' + e.message, 'error');
    }
  };

  // Segna come consumati ingredienti usati in una ricetta
  const handleConsumeIngredients = async (ingredientNames: string[]) => {
    const idsToDelete: string[] = [];
    const namesSet = new Set(ingredientNames.map(n => n.toLowerCase().trim()));

    for (const item of dispensaItems) {
      const itemLower = item.ingrediente.toLowerCase().trim();
      for (const name of namesSet) {
        if (itemLower.includes(name) || name.includes(itemLower)) {
          idsToDelete.push(item.id);
          break;
        }
      }
    }

    if (idsToDelete.length > 0) {
      const updated = await deleteDispensaItems(settings, idsToDelete);
      setDispensaItems(updated);
      showToast(`${idsToDelete.length} ingredienti consumati e rimossi dalla Dispensa!`, 'success');
    } else {
      showToast('Ricetta segnata come cucinata!', 'success');
    }
  };

  // Salva nuove impostazioni
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    showToast('Impostazioni salvate con successo!', 'success');
    loadData(newSettings);
  };

  // Ripristina dati di esempio
  const handleResetDemoData = () => {
    saveLocalDispensa(INITIAL_MOCK_DISPENSA);
    saveLocalSpesa(INITIAL_MOCK_SPESA);
    setDispensaItems(INITIAL_MOCK_DISPENSA);
    setSpesaItems(INITIAL_MOCK_SPESA);
    showToast('Dati demo ripristinati!', 'success');
    setIsSettingsOpen(false);
  };

  // Conteggi per i badge
  const dispensaUrgentCount = dispensaItems.filter(i => i.urgenza === 'alta').length;
  const spesaPendingCount = spesaItems.filter(i => !i.comprato).length;

  return (
    <div className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      
      {/* Header Fisso in Alto */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={() => loadData(settings)}
        isRefreshing={isLoading}
        isOnline={isOnline}
      />

      {/* Notifica Toast Fluttuante */}
      {toast && (
        <div className="fixed top-16 inset-x-4 z-50 flex justify-center pointer-events-none animate-fadeIn">
          <div className={`max-w-md px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-semibold backdrop-blur-md border ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
              : 'bg-slate-900/90 text-slate-200 border-slate-700/60'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Contenuto Principale con Tab Attivo */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dispensa' && (
          <DispensaTab
            items={dispensaItems}
            settings={settings}
            onAddItems={handleAddDispensa}
            onDeleteItem={handleDeleteDispensa}
            onNavigateToCook={() => setActiveTab('cucina')}
          />
        )}

        {activeTab === 'cucina' && (
          <CosaCucinoTab
            dispensaItems={dispensaItems}
            settings={settings}
            onAddMissingToSpesa={handleAddMissingToSpesa}
            onConsumeIngredients={handleConsumeIngredients}
          />
        )}

        {activeTab === 'spesa' && (
          <SpesaTab
            items={spesaItems}
            onAddItem={handleAddSpesa}
            onToggleItem={handleToggleSpesa}
            onDeleteItem={handleDeleteSpesa}
            onMoveToDispensa={handleMoveSpesaToDispensa}
            isMoving={isMovingSpesa}
          />
        )}
      </main>

      {/* Barra di Navigazione Fissa in Basso */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        dispensaUrgentCount={dispensaUrgentCount}
        spesaPendingCount={spesaPendingCount}
      />

      {/* Modale Impostazioni */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onResetDemoData={handleResetDemoData}
      />

    </div>
  );
};
