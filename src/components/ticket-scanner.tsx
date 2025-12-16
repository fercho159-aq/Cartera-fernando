"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2, Check, RotateCcw } from "lucide-react";
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
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<TicketData | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("No se pudo acceder a la cámara. Por favor, permite el acceso o sube una imagen.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
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
      setError("Error al procesar el ticket. Intenta de nuevo.");
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

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

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
          <h2 className="text-lg font-semibold">Ticket Escaneado</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
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
          <div className="bg-card rounded-xl p-4 space-y-4 max-w-sm mx-auto">
            <h3 className="font-semibold text-center mb-4">Datos detectados:</h3>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Monto</span>
              <span className="text-2xl font-bold text-primary">
                ${scanResult.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Comercio</span>
              <span className="font-medium">{scanResult.title}</span>
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

        <div className="p-4 border-t space-y-2">
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
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <img
            src={capturedImage}
            alt="Ticket capturado"
            className="max-w-full max-h-full rounded-xl shadow-lg"
          />
        </div>

        {error && (
          <div className="mx-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center">
            {error}
          </div>
        )}

        <div className="p-4 border-t space-y-2">
          <Button
            onClick={processImage}
            className="w-full"
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analizando ticket...
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

  // Render de captura con cámara o subida
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Escanear Ticket</h2>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isCapturing ? (
          <div className="relative w-full max-w-md">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-xl shadow-lg"
            />
            <div className="absolute inset-0 border-4 border-primary/50 rounded-xl pointer-events-none" />
            <p className="text-center mt-4 text-sm text-muted-foreground">
              Centra el ticket en el recuadro
            </p>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-16 h-16 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Escanea tu ticket</h3>
              <p className="text-muted-foreground text-sm">
                Toma una foto o sube una imagen del ticket para registrar el gasto automáticamente
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center max-w-md">
            {error}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="p-4 border-t space-y-2">
        {isCapturing ? (
          <>
            <Button onClick={capturePhoto} className="w-full" size="lg">
              <Camera className="w-5 h-5 mr-2" />
              Tomar Foto
            </Button>
            <Button onClick={stopCamera} variant="outline" className="w-full">
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button onClick={startCamera} className="w-full" size="lg">
              <Camera className="w-5 h-5 mr-2" />
              Abrir Cámara
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-5 h-5 mr-2" />
              Subir Imagen
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
