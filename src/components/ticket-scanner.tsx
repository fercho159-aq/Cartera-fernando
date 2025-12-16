"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2, Check, RotateCcw, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
    // Reset input para permitir seleccionar la misma imagen
    event.target.value = '';
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
      setError("Error al procesar el ticket. Verifica que la imagen sea clara y vuelve a intentar.");
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
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Ticket Escaneado ✅</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {/* Preview de la imagen */}
          <div className="relative w-full max-w-sm mx-auto mb-6">
            <img
              src={capturedImage!}
              alt="Ticket escaneado"
              className="w-full rounded-xl shadow-lg"
            />
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Check className="w-3 h-3" />
              {Math.round(scanResult.confidence * 100)}% confianza
            </div>
          </div>

          {/* Datos extraídos */}
          <div className="bg-card rounded-xl p-4 space-y-4 max-w-sm mx-auto shadow-lg">
            <h3 className="font-semibold text-center mb-4">Datos detectados:</h3>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Monto</span>
              <span className="text-2xl font-bold text-primary">
                ${scanResult.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Comercio</span>
              <span className="font-medium text-right max-w-[60%] truncate">{scanResult.title}</span>
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

        <div className="p-4 border-t space-y-2 bg-background">
          <Button onClick={confirmResult} className="w-full" size="lg">
            <Check className="w-5 h-5 mr-2" />
            Confirmar y Registrar Gasto
          </Button>
          <Button onClick={retryCapture} variant="outline" className="w-full">
            <RotateCcw className="w-5 h-5 mr-2" />
            Escanear Otro Ticket
          </Button>
        </div>
      </div>
    );
  }

  // Render de captura/preview de imagen
  if (capturedImage) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Revisar Imagen</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <img
            src={capturedImage}
            alt="Ticket capturado"
            className="max-w-full max-h-full rounded-xl shadow-lg object-contain"
          />
        </div>

        {error && (
          <div className="mx-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center">
            {error}
          </div>
        )}

        <div className="p-4 border-t space-y-2 bg-background">
          <Button
            onClick={processImage}
            className="w-full"
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analizando ticket con IA...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Procesar Ticket
              </>
            )}
          </Button>
          <Button onClick={retryCapture} variant="outline" className="w-full">
            <RotateCcw className="w-5 h-5 mr-2" />
            Tomar Otra Foto
          </Button>
        </div>
      </div>
    );
  }

  // Render principal - selección de método de captura
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Escanear Ticket</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-16 h-16 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Escanea tu ticket</h3>
            <p className="text-muted-foreground text-sm">
              Toma una foto del ticket o selecciona una imagen de tu galería. La IA extraerá automáticamente el monto, fecha y comercio.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Inputs ocultos */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageCapture}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageCapture}
          className="hidden"
        />
      </div>

      <div className="p-4 border-t space-y-3 bg-background">
        <Button 
          onClick={() => cameraInputRef.current?.click()} 
          className="w-full h-14 text-lg"
          size="lg"
        >
          <Camera className="w-6 h-6 mr-3" />
          Tomar Foto
        </Button>
        <Button
          onClick={() => galleryInputRef.current?.click()}
          variant="outline"
          className="w-full h-14 text-lg"
          size="lg"
        >
          <ImageIcon className="w-6 h-6 mr-3" />
          Elegir de Galería
        </Button>
        <Button
          onClick={onClose}
          variant="ghost"
          className="w-full"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
