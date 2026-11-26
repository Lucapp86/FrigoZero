import { DispensaItem, SpesaItem, Ricetta } from '../types';

export const INITIAL_MOCK_DISPENSA: DispensaItem[] = [
  {
    id: 'dsp_demo_1',
    ingrediente: 'Latte fresco intero',
    quantita: '1 Litro',
    reparto: 'Frigo/Latticini',
    scadenza_stimata: getRelativeDate(1), // domani
    urgenza: 'alta',
    data_inserimento: new Date().toISOString()
  },
  {
    id: 'dsp_demo_2',
    ingrediente: 'Petto di pollo a fette',
    quantita: '400g',
    reparto: 'Carne/Pesce',
    scadenza_stimata: getRelativeDate(2),
    urgenza: 'alta',
    data_inserimento: new Date().toISOString()
  },
  {
    id: 'dsp_demo_3',
    ingrediente: 'Zucchine fresche',
    quantita: '3 pezzi',
    reparto: 'Ortofrutta',
    scadenza_stimata: getRelativeDate(3),
    urgenza: 'media',
    data_inserimento: new Date().toISOString()
  },
  {
    id: 'dsp_demo_4',
    ingrediente: 'Pomodori datterini',
    quantita: '250g',
    reparto: 'Ortofrutta',
    scadenza_stimata: getRelativeDate(4),
    urgenza: 'media',
    data_inserimento: new Date().toISOString()
  },
  {
    id: 'dsp_demo_5',
    ingrediente: 'Yogurt greco naturale',
    quantita: '2 vasetti',
    reparto: 'Frigo/Latticini',
    scadenza_stimata: getRelativeDate(5),
    urgenza: 'media',
    data_inserimento: new Date().toISOString()
  },
  {
    id: 'dsp_demo_6',
    ingrediente: 'Pasta Penne Rigate',
    quantita: '500g',
    reparto: 'Dispensa',
    scadenza_stimata: getRelativeDate(120),
    urgenza: 'bassa',
    data_inserimento: new Date().toISOString()
  },
  {
    id: 'dsp_demo_7',
    ingrediente: 'Piselli fini surgelati',
    quantita: '450g',
    reparto: 'Surgelati',
    scadenza_stimata: getRelativeDate(90),
    urgenza: 'bassa',
    data_inserimento: new Date().toISOString()
  },
  {
    id: 'dsp_demo_8',
    ingrediente: 'Parmigiano Reggiano DOP',
    quantita: '200g',
    reparto: 'Frigo/Latticini',
    scadenza_stimata: getRelativeDate(20),
    urgenza: 'bassa',
    data_inserimento: new Date().toISOString()
  }
];

export const INITIAL_MOCK_SPESA: SpesaItem[] = [
  {
    id: 'sp_demo_1',
    articolo: 'Uova biologiche',
    quantita: 'Confezione da 6',
    reparto: 'Frigo/Latticini',
    comprato: false
  },
  {
    id: 'sp_demo_2',
    articolo: 'Basilico fresco',
    quantita: '1 vasetto',
    reparto: 'Ortofrutta',
    comprato: true
  },
  {
    id: 'sp_demo_3',
    articolo: 'Olio extravergine d\'oliva',
    quantita: '1L',
    reparto: 'Dispensa',
    comprato: false
  },
  {
    id: 'sp_demo_4',
    articolo: 'Mozzarella di bufala',
    quantita: '250g',
    reparto: 'Frigo/Latticini',
    comprato: true
  },
  {
    id: 'sp_demo_5',
    articolo: 'Filetti di salmone',
    quantita: '300g',
    reparto: 'Carne/Pesce',
    comprato: false
  }
];

export const INITIAL_MOCK_RICETTE: Ricetta[] = [
  {
    titolo: 'Straccetti di Pollo con Zucchine e Pomodorini',
    tempo_min: 15,
    ingredienti_usati: ['Petto di pollo a fette', 'Zucchine fresche', 'Pomodori datterini'],
    ingredienti_mancanti: ['Olio extravergine d\'oliva'],
    procedimento: [
      'Taglia il petto di pollo a striscioline e le zucchine a rondelle sottili.',
      'In una padella antiaderente ben calda, salta il pollo a fuoco vivo per 3 minuti.',
      'Aggiungi le zucchine e i pomodorini tagliati a metà, cuoci per altri 5 minuti.',
      'Aggiusta di sale e pepe e servi subito con una spolverata di Parmigiano.'
    ],
    consiglio: 'Consuma subito il pollo in scadenza mantenendolo tenero!'
  },
  {
    titolo: 'Penne Cremose allo Yogurt Greco e Piselli',
    tempo_min: 20,
    ingredienti_usati: ['Pasta Penne Rigate', 'Yogurt greco naturale', 'Piselli fini surgelati', 'Parmigiano Reggiano DOP'],
    ingredienti_mancanti: ['Spicchio d\'aglio'],
    procedimento: [
      'Metti a bollire l\'acqua per la pasta e cala le penne.',
      'Negli ultimi 4 minuti di cottura della pasta, butta i piselli direttamente nella stessa pentola.',
      'In una ciotola, mescola lo yogurt greco con 2 cucchiai di acqua di cottura e Parmigiano grattugiato.',
      'Scola pasta e piselli, manteca a fuoco spento con la salsa allo yogurt.'
    ],
    consiglio: 'Alternativa leggera alla panna che utilizza lo yogurt greco in scadenza.'
  },
  {
    titolo: 'Crema Dolce di Latte & Caffè Antico',
    tempo_min: 10,
    ingredienti_usati: ['Latte fresco intero'],
    ingredienti_mancanti: ['Zucchero (2 cucchiai)', 'Amido di mais o farina (1 cucchiaio)'],
    procedimento: [
      'Scalda il latte in scadenza in un pentolino a fuoco basso.',
      'Sciogli l\'amido e lo zucchero in poco latte freddo prima di versarlo.',
      'Mescola continuamente fino a ottenere una crema liscia e vellutata.',
      'Lascia intiepidire e gusta come dessert o merenda proteica.'
    ],
    consiglio: 'Il modo migliore per consumare fino all\'ultima goccia di latte fresco!'
  }
];

function getRelativeDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}
