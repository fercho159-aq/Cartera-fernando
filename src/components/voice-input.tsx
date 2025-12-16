"use client";

import { useState, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceInputResult {
  amount: number;
  title: string;
  category: string;
  type: "income" | "expense";
}

interface VoiceInputProps {
  onResult: (result: VoiceInputResult) => void;
  onError?: (error: string) => void;
}

// Extrae datos de una frase hablada
const parseVoiceInput = (text: string): VoiceInputResult | null => {
  const normalizedText = text.toLowerCase().trim();
  console.log("Texto recibido:", normalizedText);

  let amount = 0;
  let title = "";
  let category = "other";
  let type: "income" | "expense" = "expense";

  // ============ DETECTAR TIPO (INGRESO O GASTO) ============
  
  // Patrones de INGRESO
  const incomePatterns = [
    /(?:recib[ií]|me pagaron|me dieron|me regalaron|gan[eé]|cobr[eé]|entr[oó]|deposit[oó]|transferencia de?)\s*/i,
    /(?:quincena|salario|sueldo|nómina|nomina|bono|aguinaldo|premio)/i,
  ];
  
  // Patrones de GASTO
  const expensePatterns = [
    /(?:gast[eé]|pagu[eé]|compr[eé]|me cost[oó]|pag[oó]|di|dí)\s*/i,
  ];

  const isIncome = incomePatterns.some(p => p.test(normalizedText));
  const isExpense = expensePatterns.some(p => p.test(normalizedText));

  if (isIncome && !isExpense) {
    type = "income";
  } else {
    type = "expense";
  }

  // ============ EXTRAER MONTO ============
  
  // Patrones para encontrar montos
  const amountPatterns = [
    // "100 pesos", "mil pesos", "1500"
    /(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:pesos|varos|bolas|MXN)?/i,
    // "mil", "dos mil", etc.
    /(un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)?\s*(mil|cien(?:tos)?)\s*(?:pesos)?/i,
  ];

  // Buscar números directos
  const numberMatch = normalizedText.match(/(\d+(?:,\d{3})*(?:\.\d{1,2})?)/);
  if (numberMatch) {
    amount = parseFloat(numberMatch[1].replace(/,/g, ""));
  }

  // Buscar palabras numéricas
  if (amount === 0) {
    const wordNumbers: Record<string, number> = {
      "un mil": 1000, "mil": 1000,
      "dos mil": 2000, "tres mil": 3000, "cuatro mil": 4000, "cinco mil": 5000,
      "seis mil": 6000, "siete mil": 7000, "ocho mil": 8000, "nueve mil": 9000,
      "diez mil": 10000, "quince mil": 15000, "veinte mil": 20000,
      "cien": 100, "doscientos": 200, "trescientos": 300, "cuatrocientos": 400,
      "quinientos": 500, "seiscientos": 600, "setecientos": 700,
      "ochocientos": 800, "novecientos": 900,
      "cincuenta": 50, "cuarenta": 40, "treinta": 30, "veinte": 20,
    };

    for (const [word, value] of Object.entries(wordNumbers)) {
      if (normalizedText.includes(word)) {
        amount = value;
        break;
      }
    }
  }

  // ============ EXTRAER TÍTULO/DESCRIPCIÓN ============
  
  // Patrones para extraer la descripción
  const descriptionPatterns = [
    // "gasté X en DESCRIPCIÓN"
    /(?:en|de|por)\s+(.+?)(?:\s*(?:pesos|$))/i,
    // "compré DESCRIPCIÓN"
    /(?:compr[eé]|pagu[eé])\s+(.+?)(?:\s+(?:por|\d|$))/i,
    // "DESCRIPCIÓN X pesos"
    /^(.+?)\s+\d+\s*(?:pesos)?$/i,
  ];

  for (const pattern of descriptionPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      title = match[1]
        .replace(/\d+/g, "")
        .replace(/pesos?|varos?|bolas?/gi, "")
        .trim();
      if (title.length > 2) break;
    }
  }

  // Si es ingreso con palabras clave, usar esas como título
  if (type === "income") {
    if (/quincena/i.test(normalizedText)) title = "Quincena";
    else if (/salario|sueldo/i.test(normalizedText)) title = "Salario";
    else if (/nómina|nomina/i.test(normalizedText)) title = "Nómina";
    else if (/bono/i.test(normalizedText)) title = "Bono";
    else if (/aguinaldo/i.test(normalizedText)) title = "Aguinaldo";
    else if (/regalo|regalaron/i.test(normalizedText)) title = "Regalo";
    else if (/transferencia/i.test(normalizedText)) title = "Transferencia";
    else if (!title) title = "Ingreso";
  }

  // Si no encontramos título, usar uno genérico
  if (!title || title.length < 2) {
    title = type === "income" ? "Ingreso" : "Gasto";
  }

  // Capitalizar primera letra
  title = title.charAt(0).toUpperCase() + title.slice(1);

  // ============ DETECTAR CATEGORÍA ============
  
  if (type === "income") {
    if (/quincena|salario|sueldo|nómina|nomina/i.test(normalizedText)) {
      category = "salary";
    } else if (/freelance|proyecto|trabajo extra/i.test(normalizedText)) {
      category = "freelance";
    } else if (/inversión|dividendos|rendimiento/i.test(normalizedText)) {
      category = "investment";
    } else {
      category = "other";
    }
  } else {
    // Categorías de gasto
    const categoryPatterns: [RegExp, string][] = [
      [/taco|comida|pizza|hambur|sushi|restaurante|café|cafe|coffee|desayuno|almuerzo|cena|papas|pollo|torta|burrito|antojo/i, "food"],
      [/uber|didi|taxi|gasolina|gas|estacionamiento|metro|camión|autobus|pasaje/i, "transport"],
      [/cine|netflix|spotify|juego|concierto|teatro|boleto|diversión/i, "entertainment"],
      [/farmacia|doctor|hospital|medicina|consultorio|dentista/i, "health"],
      [/ropa|zapatos|tenis|walmart|amazon|tienda|supermercado|super/i, "shopping"],
      [/luz|agua|internet|teléfono|telefono|gas natural|renta|servicio/i, "utilities"],
    ];

    for (const [pattern, cat] of categoryPatterns) {
      if (pattern.test(normalizedText)) {
        category = cat;
        break;
      }
    }
  }

  // Solo retornar si encontramos un monto válido
  if (amount > 0) {
    console.log("Resultado parseado:", { amount, title, category, type });
    return { amount, title, category, type };
  }

  return null;
};

export function VoiceInput({ onResult, onError }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    // Verificar soporte de Web Speech API
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.("Tu navegador no soporta reconocimiento de voz");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "es-MX";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);

      // Si es resultado final, procesar
      if (event.results[current].isFinal) {
        const result = parseVoiceInput(transcriptText);
        if (result) {
          onResult(result);
        } else {
          onError?.("No entendí el monto. Intenta decir: 'Gasté 100 pesos en comida'");
        }
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        onError?.("No escuché nada. Intenta de nuevo.");
      } else if (event.error === "not-allowed") {
        onError?.("Permiso de micrófono denegado. Habilítalo en la configuración.");
      } else {
        onError?.("Error al escuchar. Intenta de nuevo.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isSupported, onResult, onError]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`
          w-full h-14 text-lg rounded-xl flex items-center justify-center gap-3
          transition-all duration-200
          ${isListening 
            ? "bg-red-500 text-white animate-pulse" 
            : "border-2 border-dashed border-border hover:border-primary hover:bg-primary/5"
          }
        `}
      >
        {isListening ? (
          <>
            <MicOff className="w-6 h-6" />
            <span>Escuchando...</span>
          </>
        ) : (
          <>
            <Mic className="w-6 h-6" />
            <span>🎤 Dictar Gasto o Ingreso</span>
          </>
        )}
      </button>
      
      {transcript && (
        <p className="text-sm text-muted-foreground italic text-center">
          "{transcript}"
        </p>
      )}
    </div>
  );
}
