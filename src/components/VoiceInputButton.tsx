import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    // Controllo compatibilità browser per Web Speech API
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Il tuo browser non supporta il riconoscimento vocale Web Speech. Puoi comunque digitare il testo normalmente!');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Errore riconoscimento vocale:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Errore avvio riconoscimento vocale:', err);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={startListening}
      disabled={disabled || isListening}
      aria-label="Dettatura vocale"
      className={`relative p-2.5 rounded-xl flex items-center justify-center transition-all ${
        isListening
          ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50 scale-105'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95'
      }`}
      title={isListening ? 'Ascolto in corso...' : 'Ditta a voce gli ingredienti'}
    >
      {isListening ? (
        <>
          <Mic className="w-5 h-5 animate-bounce" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-400 rounded-full animate-ping" />
        </>
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
};
