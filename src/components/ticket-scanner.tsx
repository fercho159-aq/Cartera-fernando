"use client";

import { useState, useCallback, useEffect } from "react";
import { Camera, X, Loader2, Check, RotateCcw, ImageIcon } from "lucide-react";

interface TicketData {
  amount: number;
  title: string;
  category: string;
  date: string;
  confidence: number;
}

interface TicketScannerProps {
  onScanComplete: (data: TicketData) => void;
  onClose: () => void;
}

export function TicketScanner({ onScanComplete, onClose }: TicketScannerProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<TicketData | null>(null);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${window.scrollY}px`;
    
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, []);

  const handleImageCapture = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
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

    try {
      const response = await fetch("/api/scan-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al procesar el ticket");
      }

      setScanResult(result.data);
    } catch (err) {
      console.error("Error processing ticket:", err);
      setError("Error al procesar el ticket. Verifica que la imagen sea clara.");
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage]);

  const confirmResult = useCallback(() => {
    if (scanResult) {
      onScanComplete(scanResult);
    }
  }, [scanResult, onScanComplete]);

  const retryCapture = useCallback(() => {
    setCapturedImage(null);
    setScanResult(null);
    setError(null);
  }, []);

  const stopPropagation = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  // Render de resultados del escaneo
  if (scanResult) {
    const categoryLabels: Record<string, string> = {
      food: "🍔 Comida",
      transport: "🚗 Transporte",
      entertainment: "🎬 Entretenimiento",
      health: "💊 Salud",
      shopping: "🛍️ Compras",
      utilities: "💡 Servicios",
      other: "📦 Otros",
    };

    return (
      <div 
        className="fixed inset-0 z-[9999] bg-background"
        onClick={stopPropagation}
        onTouchStart={stopPropagation}
        style={{ touchAction: 'none' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <h2 className="text-lg font-semibold">Ticket Escaneado ✅</h2>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="p-2 rounded-full hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="relative w-full max-w-sm mx-auto mb-6">
              <img src={capturedImage!} alt="Ticket" className="w-full rounded-xl shadow-lg" />
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Check className="w-3 h-3" />
                {Math.round(scanResult.confidence * 100)}%
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
          </div>

          <div className="p-4 border-t space-y-2 bg-background shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); confirmResult(); }}
              className="w-full h-14 text-lg font-semibold rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Confirmar y Registrar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); retryCapture(); }}
              className="w-full h-12 rounded-xl border border-border flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Escanear Otro
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render de preview de imagen
  if (capturedImage) {
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-background"
        onClick={stopPropagation}
        onTouchStart={stopPropagation}
        style={{ touchAction: 'none' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <h2 className="text-lg font-semibold">Revisar Imagen</h2>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="p-2 rounded-full hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <img src={capturedImage} alt="Ticket" className="max-w-full max-h-full rounded-xl shadow-lg object-contain" />
          </div>

          {error && (
            <div className="mx-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div className="p-4 border-t space-y-2 bg-background shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); processImage(); }}
              disabled={isProcessing}
              className="w-full h-14 text-lg font-semibold rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analizando con IA...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Procesar Ticket
                </>
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); retryCapture(); }}
              className="w-full h-12 rounded-xl border border-border flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Otra Foto
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render principal
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-background"
      onClick={stopPropagation}
      onTouchStart={stopPropagation}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold">Escanear Ticket</h2>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="p-2 rounded-full hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-sm">
            <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-16 h-16 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Escanea tu ticket</h3>
              <p className="text-muted-foreground text-sm">
                Toma una foto del ticket o selecciona una imagen. La IA extraerá el monto, fecha y comercio.
              </p>
            </div>
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t space-y-3 bg-background shrink-0">
          {/* Botón cámara */}
          <label 
            className="w-full h-14 text-lg font-semibold rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={stopPropagation}
          >
            <Camera className="w-6 h-6" />
            <span>Tomar Foto</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              onClick={stopPropagation}
              className="absolute opacity-0 w-0 h-0"
            />
          </label>

          {/* Botón galería */}
          <label 
            className="w-full h-14 text-lg rounded-xl border-2 border-border flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] transition-transform bg-background"
            onClick={stopPropagation}
          >
            <ImageIcon className="w-6 h-6" />
            <span>Elegir de Galería</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageCapture}
              onClick={stopPropagation}
              className="absolute opacity-0 w-0 h-0"
            />
          </label>

          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-full h-12 text-muted-foreground"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
