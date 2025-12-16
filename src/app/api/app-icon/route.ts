import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface ManifestIcon {
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
}

interface Manifest {
    name: string;
    short_name: string;
    icons: ManifestIcon[];
    [key: string]: unknown;
}

// Íconos disponibles
const iconSets = {
    default: {
        name: 'Original',
        icons: [
            { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
    },
    green: {
        name: 'Verde',
        icons: [
            { src: '/icon-192x192-g.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/icon-512x512-g.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
    }
};

export async function GET() {
    try {
        const manifestPath = join(process.cwd(), 'public', 'manifest.json');
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;

        // Detectar qué ícono está activo
        const currentIcon = manifest.icons[0]?.src;
        let activeIcon = 'default';

        if (currentIcon?.includes('-g.')) {
            activeIcon = 'green';
        }

        return NextResponse.json({
            activeIcon,
            availableIcons: Object.entries(iconSets).map(([key, value]) => ({
                id: key,
                name: value.name,
                preview: value.icons[0].src
            }))
        });
    } catch (error) {
        console.error('Error reading manifest:', error);
        return NextResponse.json({ error: 'Error al leer configuración' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { iconSet } = await request.json();

        if (!iconSets[iconSet as keyof typeof iconSets]) {
            return NextResponse.json({ error: 'Ícono no válido' }, { status: 400 });
        }

        const manifestPath = join(process.cwd(), 'public', 'manifest.json');
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;

        // Actualizar íconos principales
        manifest.icons = iconSets[iconSet as keyof typeof iconSets].icons;

        // Actualizar íconos en shortcuts
        if (manifest.shortcuts) {
            (manifest.shortcuts as Array<{ icons?: ManifestIcon[] }>).forEach((shortcut) => {
                if (shortcut.icons) {
                    shortcut.icons = [iconSets[iconSet as keyof typeof iconSets].icons[0]];
                }
            });
        }

        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        return NextResponse.json({
            success: true,
            activeIcon: iconSet,
            message: 'Ícono actualizado. Reinstala la app para ver los cambios.'
        });
    } catch (error) {
        console.error('Error updating manifest:', error);
        return NextResponse.json({ error: 'Error al actualizar ícono' }, { status: 500 });
    }
}
