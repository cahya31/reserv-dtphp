'use client'

/** Latar belakang foto sawah asli — statis, tanpa animasi. */
export function SawahScene({ dim = false }: { dim?: boolean }) {
  return (
    <div className="fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Foto hamparan sawah asli */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/sawah-bg.jpg)' }}
      />

      {/* Lapisan tipis agar teks tetap terbaca */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(10,30,8,0) 55%, rgba(10,30,8,0.32) 100%), linear-gradient(to bottom, rgba(10,30,8,0.18), rgba(10,30,8,0) 30%)',
        }}
      />
      {dim && <div className="absolute inset-0 bg-black/10" />}
    </div>
  )
}
