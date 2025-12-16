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
  const originalLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  console.log('=== TEXTO OCR DETECTADO ===');
  console.log(text);
  console.log('=== FIN TEXTO ===');
  
  // ============ BUSCAR MONTO TOTAL ============
  let amount = 0;
  
  // Buscar la ÚLTIMA línea que contenga "Total" (ignorando "Subtotal")
  const reversedLines = [...originalLines].reverse();
  for (const line of reversedLines) {
    // Ignorar líneas con "Subtotal" 
    if (/subtotal/i.test(line)) continue;
    
    // Buscar "Total" seguido de un monto
    // Patrones: "Total: $400.20 MXN" o "Total 1432.60 MXN" o "Total: -------- $400.20"
    const totalPatterns = [
      /total[:\s]*[\-]*\s*\$?\s*([\d,]+\.?\d*)\s*(?:mxn|pesos)?/i,
      /total.*\$\s*([\d,]+\.?\d*)/i,
      /\$\s*([\d,]+\.?\d*)\s*mxn/i,
    ];
    
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        const numStr = match[1].replace(/,/g, '');
        const num = parseFloat(numStr);
        if (num > 10 && num < 1000000) {
          amount = num;
          console.log('✅ Monto Total encontrado:', num, 'en línea:', line);
          break;
        }
      }
    }
    if (amount > 0) break;
  }
  
  // Si no encontramos "Total", buscar el número más grande con formato de precio
  if (amount === 0) {
    let maxPrice = 0;
    for (const line of originalLines) {
      // Buscar precios con formato $XXX.XX o XXX.XX MXN
      const matches = line.matchAll(/\$?\s*([\d,]+\.\d{2})\s*(?:mxn)?/gi);
      for (const match of matches) {
        const num = parseFloat(match[1].replace(/,/g, ''));
        if (num > maxPrice && num > 10) {
          maxPrice = num;
        }
      }
    }
    if (maxPrice > 0) {
      amount = maxPrice;
      console.log('📊 Monto máximo encontrado:', amount);
    }
  }

  // ============ BUSCAR FECHA ============
  let date = new Date().toISOString().split('T')[0];
  let dateFound = false;
  
  for (const line of originalLines) {
    // Patrón 1: "Date: 21.12.2023" o "Fecha: 15.12.2025"
    let match = line.match(/(?:date|fecha)[:\s]*(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})/i);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      date = `${year}-${month}-${day}`;
      dateFound = true;
      console.log('✅ Fecha encontrada (con label):', date);
      break;
    }
    
    // Patrón 2: Fecha sin label "21.12.2023" o "15/12/2025"
    if (!dateFound) {
      match = line.match(/\b(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})\b/);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        // Validar que sea una fecha válida
        const testDate = new Date(`${year}-${month}-${day}`);
        if (!isNaN(testDate.getTime())) {
          date = `${year}-${month}-${day}`;
          dateFound = true;
          console.log('✅ Fecha encontrada (sin label):', date);
          break;
        }
      }
    }
  }

  // ============ DETECTAR CATEGORÍA ============
  const textLower = text.toLowerCase();
  let category = 'other';
  
  // Patrones de comida (muy amplio)
  const foodPatterns = /sushi|oishii|restaurante|restaurant|tacos|taco|pastor|gringa|torta|pizza|burger|hambur|comida|cafe|café|coffee|starbucks|oxxo|seven|pollo|carne|mariscos|antojitos|cocina|food|kitchen|burrito|cerveza|beer|edamame|roll|nigiri|sashimi/i;
  
  if (foodPatterns.test(textLower)) {
    category = 'food';
  } else if (/uber|didi|taxi|gasolina|gas|pemex|estacionamiento|parking|metro|autobus|bus/i.test(textLower)) {
    category = 'transport';
  } else if (/cine|cinemex|cinepolis|netflix|spotify|juego|game|teatro|concierto|boleto/i.test(textLower)) {
    category = 'entertainment';
  } else if (/farmacia|hospital|doctor|medic|salud|guadalajara|benavides|similares|consultorio/i.test(textLower)) {
    category = 'health';
  } else if (/walmart|soriana|chedraui|liverpool|palacio|amazon|mercado libre|costco|sams|heb|bodega/i.test(textLower)) {
    category = 'shopping';
  } else if (/luz|agua|telmex|internet|telefono|cfe|recibo|servicio|telcel|izzi|megacable/i.test(textLower)) {
    category = 'utilities';
  }
  
  console.log('📦 Categoría detectada:', category);

  // ============ EXTRAER NOMBRE DEL COMERCIO ============
  let title = 'Compra';
  
  // Buscar en las primeras líneas una que parezca nombre de negocio
  for (const line of originalLines.slice(0, 8)) {
    // Limpiar la línea de caracteres especiales y guiones
    const cleanLine = line
      .replace(/^[-=_\s]+|[-=_\s]+$/g, '') // Quitar guiones al inicio/final
      .replace(/[^\w\sáéíóúÁÉÍÓÚñÑ\-]/g, ' ') // Quitar caracteres especiales excepto guiones
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
    
    // Criterios para ser un nombre de negocio:
    // - Al menos 3 caracteres
    // - Contiene letras (no solo números)
    // - No es una palabra reservada de tickets
    // - No empieza con "fecha", "date", "orden", etc.
    if (
      cleanLine.length >= 3 && 
      cleanLine.length <= 50 &&
      /[a-zA-ZáéíóúÁÉÍÓÚñÑ]{2,}/i.test(cleanLine) &&
      !/^(total|subtotal|fecha|date|hora|time|rfc|folio|ticket|recibo|iva|orden|order|qty|item|precio|cantidad)/i.test(cleanLine)
    ) {
      title = cleanLine.substring(0, 40);
      console.log('🏪 Nombre del comercio:', title);
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
