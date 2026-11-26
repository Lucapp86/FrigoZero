import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, ExternalLink, HelpCircle, Key, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { AppSettings } from '../types';
import { testGasConnection } from '../services/gasApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onResetDemoData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onResetDemoData
}) => {
  const [gasUrl, setGasUrl] = useState(settings.gasUrl);
  const [secretToken, setSecretToken] = useState(settings.secretToken);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);
  const [demoMode, setDemoMode] = useState(settings.demoMode);

  const [testingGas, setTestingGas] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestGas = async () => {
    setTestingGas(true);
    setTestResult(null);
    try {
      const res = await testGasConnection(gasUrl, secretToken);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Errore di connessione' });
    } finally {
      setTestingGas(false);
    }
  };

  const handleSave = () => {
    onSave({
      gasUrl: gasUrl.trim(),
      secretToken: secretToken.trim(),
      geminiApiKey: geminiApiKey.trim(),
      demoMode: demoMode
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Impostazioni FrigoZero</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-5 text-sm">
          
          {/* Demo Mode Toggle */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>Modalità Demo</span>
                {demoMode && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">ATTIVA</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Usa dati di esempio salvati in memoria senza richiedere Google Sheets o API key.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Google Apps Script Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-emerald-400" />
                URL Web App Google Apps Script
              </label>
              <span className="text-[11px] text-slate-400">Database Sheets</span>
            </div>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            />
            
            {/* Secret Token */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Secret Token (Opzionale)
              </label>
              <input
                type="text"
                placeholder="Lascia vuoto se non impostato in Code.gs"
                value={secretToken}
                onChange={(e) => setSecretToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            {/* Test Button & Result */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleTestGas}
                disabled={testingGas || !gasUrl}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 active:scale-95 transition-all disabled:opacity-50"
              >
                {testingGas ? 'Verifica in corso...' : 'Verifica Connessione Sheets'}
              </button>
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-lg text-xs flex items-start space-x-2 ${
                testResult.success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Gemini API Key Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-teal-400" />
                Chiave API Google Gemini (Free Tier)
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-teal-400 hover:underline flex items-center gap-0.5"
              >
                Ottieni gratis <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Necessaria per la comprensione del linguaggio naturale, la dettatura e la generazione di ricette anti-spreco personalizzate con Gemini 2.5 Flash.
            </p>
          </div>

          {/* Guide Quick Tip */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-800/30 rounded-xl text-xs text-slate-300 flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Zero Costi & Privacy Totale:</strong> Le chiavi rimangono esclusivamente nel tuo browser (localStorage). Nessun server intermedio legge o memorizza le tue credenziali.
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onResetDemoData}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Ripristina Dati Esempio
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Salva Impostazioni
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
