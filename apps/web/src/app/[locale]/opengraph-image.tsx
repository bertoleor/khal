import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Khal, agenda de turnos para estudios de pestañas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 140,
          fontWeight: 700,
          letterSpacing: '-6px',
          color: '#ffffff',
        }}
      >
        Khal
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 24,
          fontSize: 36,
          color: 'rgba(255, 255, 255, 0.68)',
        }}
      >
        Turnos online para estudios de pestañas
      </div>
    </div>,
    size
  );
}
