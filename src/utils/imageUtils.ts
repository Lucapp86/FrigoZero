/**
 * Utility per la manipolazione e compressione di immagini lato client tramite HTML5 Canvas.
 */

/**
 * Ridimensiona un'immagine mantenendo le proporzioni e la converte in Base64 (JPEG) compresso.
 * Evita payload pesanti su reti mobili quando l'utente scatta foto ad alta risoluzione.
 *
 * @param file File immagine selezionato dall'utente
 * @param maxDim Dimensione massima (larghezza o altezza) in pixel, default 1024
 * @param quality Qualità di compressione JPEG (0.0 - 1.0), default 0.75
 * @returns Promise con stringa base64 (senza prefisso data URL) e mimeType
 */
export function resizeImageToBase64(
  file: File,
  maxDim: number = 1024,
  quality: number = 0.75
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Il file selezionato non è un\'immagine valida.'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Errore durante la lettura del file immagine.'));
    };

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Impossibile ottenere i dati dell\'immagine.'));
        return;
      }

      const img = new Image();

      img.onerror = () => {
        reject(new Error('Impossibile decodificare l\'immagine.'));
      };

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          reject(new Error('Dimensioni dell\'immagine non valide.'));
          return;
        }

        // Calcolo dimensioni mantenendo l'aspect ratio
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossibile inizializzare il contesto Canvas 2D.'));
          return;
        }

        // Sfondo bianco predefinito per gestire trasparenze (es. PNG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Rendering dell'immagine scalata sul canvas
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        const base64 = compressedDataUrl.includes(',')
          ? compressedDataUrl.split(',')[1]
          : compressedDataUrl;

        resolve({ base64, mimeType });
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}
