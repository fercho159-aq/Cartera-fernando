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
  const lines = [...originalLines]; // Copia para no mutar
  
  console.log('Texto OCR detectado:', text);
  
  // Buscar el total - buscar específicamente líneas con "Total"
  let amount = 0;
  
  // Primero buscar líneas que contengan "Total" explícitamente
  for (const line of lines) {
    const totalMatch = line.match(/total[:\s]*\$?\s*([\d,\.]+)/i);
    if (totalMatch) {
      const numStr = totalMatch[1].replace(/,/g, '').replace(/\.(?=.*\.)/g, '');
      const num = parseFloat(numStr);
      if (num > 10 && num < 100000) {
        amount = num;
        console.log('Monto encontrado en Total:', num, 'de línea:', line);
      }
    }
  }
  
  // Si no encontramos con "Total", buscar el número más grande que parezca precio
  if (amount === 0) {
    const pricePattern = /\$?\s*([\d,]+\.?\d{0,2})\s*(?:mxn|pesos|mn)?/gi;
    let maxPrice = 0;
    
    for (const line of lines) {
      let match;
      while ((match = pricePattern.exec(line)) !== null) {
        const numStr = match[1].replace(/,/g, '');
        const num = parseFloat(numStr);
        if (num > maxPrice && num > 10 && num < 100000) {
          maxPrice = num;
        }
      }
    }
    amount = maxPrice;
    console.log('Monto más grande encontrado:', amount);
  }

  // Buscar fecha - mejorado para más formatos
  let date = new Date().toISOString().split('T')[0];
  const datePatterns = [
    /fecha[:\s]*([\d]{1,2})[\.\/\-]([\d]{1,2})[\.\/\-]([\d]{2,4})/i,
    /date[:\s]*([\d]{1,2})[\.\/\-]([\d]{1,2})[\.\/\-]([\d]{2,4})/i,
    /([\d]{1,2})[\.\/\-]([\d]{1,2})[\.\/\-]([\d]{4})/,
    /([\d]{1,2})[\.\/\-]([\d]{1,2})[\.\/\-]([\d]{2})\b/,
  ];

  for (const line of originalLines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        try {
          let day = match[1];
          let month = match[2];
          let year = match[3];
          
          // Si el primer grupo tiene más de 2 dígitos y parece "fecha:", ajustar
          if (day.length > 2) continue;
          
          // Normalizar año
          if (year.length === 2) {
            year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
          }
          
          date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('Fecha encontrada:', date, 'de línea:', line);
          break;
        } catch {
          continue;
        }
      }
    }
  }

  // Determinar categoría por palabras clave - ampliado
  const textLower = text.toLowerCase();
  let category = 'other';
  
  // Comida - ampliado con más palabras
  if (/sushi|restaurante|restaurant|comida|pizza|burger|tacos|taco|cafe|café|coffee|starbucks|oxxo|seven|tienda|pollo|carne|mariscos|antojitos|cocina|food|kitchen|burritos|tortas/i.test(textLower)) {
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
  
  console.log('Categoría detectada:', category);

  // Extraer título - buscar nombre del negocio (primera línea con letras mayúsculas)
  let title = 'Compra';
  
  // Primero buscar una línea que parezca nombre de negocio
  for (const line of originalLines.slice(0, 5)) { // Solo primeras 5 líneas
    const cleanLine = line.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
    
    // Debe tener al menos 3 caracteres, no ser solo números, no contener palabras reservadas
    if (
      cleanLine.length >= 3 && 
      cleanLine.length <= 40 &&
      /[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,}/i.test(cleanLine) &&
      !/total|subtotal|fecha|hora|rfc|folio|ticket|recibo|iva|cambio|efectivo|tarjeta|cliente/i.test(cleanLine)
    ) {
      title = cleanLine.substring(0, 35);
      console.log('Título encontrado:', title);
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
