"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Check, RotateCcw, ImageIcon, ArrowLeft } from "lucide-react";
import Tesseract from 'tesseract.js';

interface TicketData {
  amount: number;
  title: string;
  category: string;
  date: string;
  confidence: number;
}

// Función para comprimir imagen
const compressImage = (base64: string, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

// Función para extraer datos del texto OCR
const extractTicketData = (text: string): TicketData => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Buscar el total
  let amount = 0;
  const totalPatterns = [
    /total[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /importe[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /monto[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.?\d*)/,
    /([\d,]+\.\d{2})\s*(?:mxn|pesos)?/i,
  ];

  for (const pattern of totalPatterns) {
    for (const line of lines.reverse()) {
      const match = line.match(pattern);
      if (match) {
        const numStr = match[1].replace(/,/g, '');
        const num = parseFloat(numStr);
        if (num > amount && num < 100000) {
          amount = num;
        }
      }
    }
  }

  // Buscar fecha
  let date = new Date().toISOString().split('T')[0];
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  ];

  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        try {
          if (match[1].length === 4) {
            // YYYY-MM-DD
            date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
          } else if (match[3].length === 4) {
            // DD-MM-YYYY
            date = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          } else {
            // DD-MM-YY
            const year = parseInt(match[3]) > 50 ? `19${match[3]}` : `20${match[3]}`;
            date = `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          }
          break;
        } catch {
          continue;
        }
      }
    }
  }

  // Determinar categoría por palabras clave
  const textLower = text.toLowerCase();
  let category = 'other';
  
  if (/restaurante|comida|pizza|burger|tacos|cafe|coffee|starbucks|oxxo|seven|tienda/i.test(textLower)) {
    category = 'food';
  } else if (/uber|didi|taxi|gasolina|gas|pemex/i.test(textLower)) {
    category = 'transport';
  } else if (/cine|netflix|spotify|juego|game/i.test(textLower)) {
    category = 'entertainment';
  } else if (/farmacia|hospital|doctor|medic|salud/i.test(textLower)) {
    category = 'health';
  } else if (/walmart|soriana|chedraui|liverpool|palacio|amazon|mercado libre/i.test(textLower)) {
    category = 'shopping';
  } else if (/luz|agua|telmex|internet|telefono|cfe/i.test(textLower)) {
    category = 'utilities';
  }

  // Extraer título (primera línea significativa o nombre del negocio)
  let title = 'Compra';
  for (const line of lines) {
    if (line.length > 3 && line.length < 50 && !/^\d+$/.test(line) && !/total|fecha|hora|rfc/i.test(line)) {
      title = line.substring(0, 40);
      break;
    }
  }

  return {
    amount: amount || 0,
    title,
    category,
    date,
    confidence: amount > 0 ? 0.7 : 0.3,
  };
};

export default function ScanPage() {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<TicketData | null>(null);

  const handleImageCapture = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const compressed = await compressImage(result, 1024, 0.8);
        setCapturedImage(compressed);
      };
      reader.onerror = () => {
        setError("Error al leer la imagen. Intenta de nuevo.");
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const processImage = useCallback(async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(
        capturedImage,
        'spa+eng', // Español e inglés
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
        }
      );

      const extractedData = extractTicketData(result.data.text);
      
      if (extractedData.amount === 0) {
        setError("No se pudo detectar el monto. ¿Puedes verlo claramente en la imagen?");
      }
      
      setScanResult(extractedData);
    } catch (err) {
      console.error("Error processing ticket:", err);
      setError("Error al procesar el ticket. Intenta con otra foto.");
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage]);

  const confirmResult = useCallback(() => {
    if (scanResult) {
      sessionStorage.setItem('scannedTicket', JSON.stringify(scanResult));
      router.push('/?fromScan=true');
    }
  }, [scanResult, router]);

  const retryCapture = useCallback(() => {
    setCapturedImage(null);
    setScanResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const goBack = () => {
    router.back();
  };

  const categoryLabels: Record<string, string> = {
    food: "🍔 Comida",
    transport: "🚗 Transporte",
    entertainment: "🎬 Entretenimiento",
    health: "💊 Salud",
    shopping: "🛍️ Compras",
    utilities: "💡 Servicios",
    other: "📦 Otros",
  };

  // Render de resultados
  if (scanResult) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center gap-4 p-4 border-b">
          <button onClick={goBack} className="p-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Ticket Escaneado ✅</h1>
        </header>

        <div className="flex-1 overflow-auto p-4">
          <div className="relative w-full max-w-sm mx-auto mb-6">
            <img src={capturedImage!} alt="Ticket" className="w-full rounded-xl shadow-lg" />
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Check className="w-3 h-3" />
              {Math.round(scanResult.confidence * 100)}% confianza
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 space-y-4 max-w-sm mx-auto shadow-lg border">
            <h3 className="font-semibold text-center">Datos detectados:</h3>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Monto</span>
              <span className="text-2xl font-bold text-primary">
                ${scanResult.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Comercio</span>
              <span className="font-medium text-right max-w-[60%]">{scanResult.title}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Categoría</span>
              <span className="font-medium">{categoryLabels[scanResult.category] || scanResult.category}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium">{scanResult.date}</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Puedes editar los datos después de confirmar
          </p>
        </div>

        <div className="p-4 border-t space-y-2 bg-background">
          <button
            onClick={confirmResult}
            className="w-full h-14 text-lg font-semibold rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Confirmar y Registrar Gasto
          </button>
          <button
            onClick={retryCapture}
            className="w-full h-12 rounded-xl border border-border flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Escanear Otro Ticket
          </button>
        </div>
      </main>
    );
  }

  // Preview de imagen
  if (capturedImage) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center gap-4 p-4 border-b">
          <button onClick={goBack} className="p-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Revisar Imagen</h1>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <img src={capturedImage} alt="Ticket" className="max-w-full max-h-[60vh] rounded-xl shadow-lg object-contain" />
        </div>

        {error && (
          <div className="mx-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <div className="p-4 border-t space-y-2 bg-background">
          <button
            onClick={processImage}
            disabled={isProcessing}
            className="w-full h-14 text-lg font-semibold rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analizando... {progress}%
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Procesar Ticket
              </>
            )}
          </button>
          <button
            onClick={retryCapture}
            className="w-full h-12 rounded-xl border border-border flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Tomar Otra Foto
          </button>
        </div>
      </main>
    );
  }

  // Pantalla principal de captura
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-4 p-4 border-b">
        <button onClick={goBack} className="p-2 rounded-full hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Escanear Ticket</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-16 h-16 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Escanea tu ticket</h2>
            <p className="text-muted-foreground text-sm">
              Toma una foto clara del ticket. El OCR extraerá el monto, fecha y comercio automáticamente.
            </p>
          </div>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t space-y-3 bg-background pb-safe">
        <label className="w-full h-14 text-lg font-semibold rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-3 cursor-pointer active:opacity-80">
          <Camera className="w-6 h-6" />
          <span>Tomar Foto</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageCapture}
            className="hidden"
          />
        </label>

        <label className="w-full h-14 text-lg rounded-xl border-2 border-border flex items-center justify-center gap-3 cursor-pointer active:opacity-80 bg-background">
          <ImageIcon className="w-6 h-6" />
          <span>Elegir de Galería</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageCapture}
            className="hidden"
          />
        </label>
      </div>
    </main>
  );
}
