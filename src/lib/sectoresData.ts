import rawSectores from "@/data/balance_cambiario_sectores.json";
import { DatasetPorSector, SectorMeta, SerieMeta } from "@/types";
import { DETALLE_META, NodoCuenta } from "@/lib/detalleSeries";

/**
 * Este módulo importa `balance_cambiario_sectores.json` (~3 MB, el detalle
 * mensual de cada uno de los ~29 sectores para cada concepto). A propósito
 * es un archivo SEPARADO del dataset principal (`balance_cambiario.json`,
 * ~230 KB): solo la solapa "Comparar por Sector" importa este módulo, así
 * que Next.js lo deja en su propio chunk y el Dashboard / Comparador
 * general no pagan ese peso.
 */
const dataset = rawSectores as unknown as DatasetPorSector;

export function listaSectores(): SectorMeta[] {
  return Object.entries(dataset.porSector ?? {})
    .map(([id, s]) => ({ id, nombre: s.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function nombreSector(sectorId: string): string {
  return dataset.porSector?.[sectorId]?.nombre ?? sectorId;
}

export function getValoresSectorConcepto(sectorId: string, conceptoId: string): number[] {
  return dataset.porSector?.[sectorId]?.detalle?.[conceptoId] ?? [];
}

/** Arma el árbol Cuenta > Subcuenta > Concepto, mostrando SOLO los conceptos que existen para ese sector. */
export function arbolSector(sectorId: string): NodoCuenta[] {
  const detalleSector = dataset.porSector?.[sectorId]?.detalle ?? {};
  const idsDisponibles = new Set(Object.keys(detalleSector));

  const cuentas = new Map<string, Map<string, SerieMeta[]>>();
  for (const [id, meta] of Object.entries(DETALLE_META)) {
    if (!idsDisponibles.has(id)) continue;
    const cuenta = meta.categoria;
    const subcuenta = meta.subcategoria ?? "Otros";
    if (!cuentas.has(cuenta)) cuentas.set(cuenta, new Map());
    const subMap = cuentas.get(cuenta)!;
    if (!subMap.has(subcuenta)) subMap.set(subcuenta, []);
    subMap.get(subcuenta)!.push(meta);
  }

  const resultado: NodoCuenta[] = [];
  for (const [cuenta, subMap] of cuentas) {
    const subcuentas = Array.from(subMap.entries())
      .map(([subcuenta, items]) => ({
        subcuenta,
        items: items.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
      }))
      .sort((a, b) => a.subcuenta.localeCompare(b.subcuenta, "es"));
    resultado.push({ cuenta, subcuentas });
  }

  const ordenCuentas = ["Cuenta Corriente", "Cuenta Capital", "Cuenta Financiera"];
  resultado.sort((a, b) => {
    const ia = ordenCuentas.indexOf(a.cuenta);
    const ib = ordenCuentas.indexOf(b.cuenta);
    if (ia === -1 && ib === -1) return a.cuenta.localeCompare(b.cuenta, "es");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return resultado;
}
