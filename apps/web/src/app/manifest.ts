import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Khal | Agenda de pestañas',
    short_name: 'Khal',
    description: 'Turnos online para estudios de pestañas.',
    start_url: '/es',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
