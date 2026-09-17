"use client";

import { useMemo, useRef, useState } from "react";
import { useOnClickOutside } from "@/lib/useOnClickOutside";
import { arbolSector } from "@/lib/sectoresData";
import { SerieId, SerieMeta } from "@/types";

interface SectorSeriesPickerProps {
  sectorId: string;
  seleccionadas: SerieId[];
  onAgregar: (id: SerieId) => void;
  maxSeries?: number;
}

export default function SectorSeriesPicker({
  sectorId,
  seleccionadas,
  onAgregar,
  maxSeries = 8,
}: SectorSeriesPickerProps) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setAbierto(false));

  const arbol = useMemo(() => arbolSector(sectorId), [sectorId]);
  const alcanzoLimite = seleccionadas.length >= maxSeries;

  const q = busqueda.trim().toLowerCase();
  const arbolFiltrado = useMemo(() => {
    if (!q) return arbol;
    return arbol
      .map((cuenta) => ({
        cuenta: cuenta.cuenta,
        subcuentas: cuenta.subcuentas
          .map((sub) => ({
            subcuenta: sub.subcuenta,
            items: sub.items.filter((it) => it.nombre.toLowerCase().includes(q)),
          }))
          .filter((sub) => sub.items.length > 0),
      }))
      .filter((cuenta) => cuenta.subcuentas.length > 0);
  }, [arbol, q]);

  function elegir(id: SerieId) {
    onAgregar(id);
    setBusqueda("");
    setAbierto(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        disabled={alcanzoLimite}
        className="flex items-center gap-2 rounded-lg border border-institucional-navy bg-institucional-navy px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#16294d] disabled:cursor-not-allowed disabled:border-institucional-gray disabled:bg-institucional-gray"
      >
        <span className="text-base leading-none">+</span>
        {alcanzoLimite ? `Máximo ${maxSeries} series` : "Agregar movimiento"}
      </button>

      {abierto && !alcanzoLimite && (
        <div className="absolute left-0 z-30 mt-2 w-96 rounded-xl border border-institucional-border bg-white p-2 shadow-cardHover">
          <input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar concepto…"
            className="mb-2 w-full rounded-md border border-institucional-border px-3 py-1.5 text-sm outline-none focus:border-institucional-teal"
          />
          <div className="max-h-[28rem] overflow-y-auto pr-1">
            {arbolFiltrado.length === 0 && (
              <p className="px-2 py-3 text-sm text-institucional-textsec">
                {q ? "Sin resultados." : "Este sector no tiene movimientos registrados."}
              </p>
            )}
            {arbolFiltrado.map((cuenta) => (
              <div key={cuenta.cuenta} className="mb-1">
                <p className="px-2 pb-0.5 pt-1.5 text-xs font-bold text-institucional-text">{cuenta.cuenta}</p>
                {cuenta.subcuentas.map((sub) => (
                  <div key={sub.subcuenta} className="pl-2">
                    <p className="px-2 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-institucional-textsec">
                      {sub.subcuenta}
                    </p>
                    {sub.items.map((it) => (
                      <ItemSerie
                        key={it.id}
                        meta={it}
                        seleccionada={seleccionadas.includes(it.id)}
                        onElegir={elegir}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemSerie({
  meta,
  seleccionada,
  onElegir,
}: {
  meta: SerieMeta;
  seleccionada: boolean;
  onElegir: (id: SerieId) => void;
}) {
  return (
    <button
      type="button"
      disabled={seleccionada}
      onClick={() => onElegir(meta.id)}
      title={meta.descripcion}
      className={`flex w-full items-start gap-2 rounded-md px-4 py-1.5 text-left text-sm transition ${
        seleccionada ? "cursor-not-allowed text-institucional-gray" : "text-institucional-text hover:bg-institucional-bg"
      }`}
    >
      <span className="mt-0.5 w-3 shrink-0">{seleccionada ? "✓" : ""}</span>
      <span className="truncate">{meta.nombre}</span>
    </button>
  );
}
