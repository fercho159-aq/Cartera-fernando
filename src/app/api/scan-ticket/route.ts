import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCurrentUserId } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

interface TicketData {
  amount: number;
  title: string;
  category: string;
  date: string;
  confidence: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar API Key primero
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY no está configurada');
      return NextResponse.json(
        { error: 'Servicio de escaneo no configurado. Contacta al administrador.' },
        { status: 503 }
      );
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No se proporcionó imagen' },
        { status: 400 }
      );
    }

    // Remover el prefijo data:image/...;base64, si existe
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analiza esta imagen de un ticket o recibo de compra y extrae la siguiente información en formato JSON.

IMPORTANTE: 
- El monto debe ser el TOTAL de la compra (busca palabras como "Total", "Total a pagar", "Importe Total")
- La fecha debe estar en formato YYYY-MM-DD
- El título debe ser el nombre del negocio/tienda o una descripción breve de la compra
- La categoría debe ser UNA de estas opciones exactas: food, transport, entertainment, health, shopping, utilities, other

Responde SOLO con un objeto JSON válido, sin texto adicional, con esta estructura exacta:
{
  "amount": número (solo el número, sin símbolo de moneda),
  "title": "string con el nombre del negocio o descripción",
  "category": "string con la categoría",
  "date": "YYYY-MM-DD",
  "confidence": número del 0 al 1 indicando qué tan seguro estás de la extracción
}

Si no puedes leer algún dato, usa valores por defecto razonables:
- amount: 0
- title: "Compra"
- category: "other"
- date: fecha de hoy
- confidence: 0.5

Recuerda: responde SOLO con el JSON, sin explicaciones.`;

    console.log('Enviando imagen a Gemini...');
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('Respuesta de Gemini:', text.substring(0, 200));

    // Intentar parsear la respuesta como JSON
    let ticketData: TicketData;
    try {
      // Limpiar la respuesta de posibles caracteres extra
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      ticketData = JSON.parse(cleanedText);
    } catch {
      // Si falla el parsing, intentar extraer datos manualmente
      console.error('Error parsing Gemini response:', text);
      ticketData = {
        amount: 0,
        title: 'Compra escaneada',
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        confidence: 0.3,
      };
    }

    // Validar y normalizar la categoría
    const validCategories = ['food', 'transport', 'entertainment', 'health', 'shopping', 'utilities', 'other'];
    if (!validCategories.includes(ticketData.category)) {
      ticketData.category = 'other';
    }

    // Asegurar que el monto sea un número positivo
    ticketData.amount = Math.abs(Number(ticketData.amount) || 0);

    return NextResponse.json({
      success: true,
      data: ticketData,
    });
  } catch (error) {
    console.error('Error al procesar ticket:', error);
    
    // Dar mensaje más específico según el tipo de error
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (errorMessage.includes('API_KEY')) {
      return NextResponse.json(
        { error: 'API Key inválida. Contacta al administrador.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al procesar la imagen. Intenta con otra foto más clara.' },
      { status: 500 }
    );
  }
}

