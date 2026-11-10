import { ProductItem } from '@/types/inventory'

export const TOP_PRODUCT_FAMILIES = [
  'SERINGAS',
  'SORO',
  'CATETER',
  'TUBOS COLETA',
  'LUVAS',
  'COMPRESSA GAZE',
  'ESPARADRAPO',
  'SONDA TOM CAT',
  'FIO NYLON',
  'EQUIPO TRANSFUSÃO',
  'POLIGLACTINA',
] as const

export type ProductFamilyName = (typeof TOP_PRODUCT_FAMILIES)[number] | 'DEMAIS'

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

export function classifyProductFamily(productName: string): ProductFamilyName {
  const text = normalizeText(productName || '')

  if (text.includes('TOM CAT') || text.includes('TOMCAT')) {
    return 'SONDA TOM CAT'
  }
  if (text.includes('SERINGA')) {
    return 'SERINGAS'
  }
  if (
    text.includes('SORO') ||
    text.includes('CLORETO DE SODIO') ||
    text.includes('RINGER') ||
    text.includes('GLICOSE')
  ) {
    return 'SORO'
  }
  if (text.includes('CATETER') || text.includes('JELCO') || text.includes('SCALP')) {
    return 'CATETER'
  }
  if (
    text.includes('TUBO') &&
    (text.includes('COLETA') ||
      text.includes('VACUO') ||
      text.includes('EDTA') ||
      text.includes('HEPARINA') ||
      text.includes('CITRATO') ||
      text.includes('FLUORETO') ||
      text.includes('ATIVADOR') ||
      text.includes('GEL'))
  ) {
    return 'TUBOS COLETA'
  }
  if (text.includes('LUVA')) {
    return 'LUVAS'
  }
  if (text.includes('COMPRESSA') || text.includes('GAZE')) {
    return 'COMPRESSA GAZE'
  }
  if (text.includes('ESPARADRAPO')) {
    return 'ESPARADRAPO'
  }
  if (text.includes('NYLON')) {
    return 'FIO NYLON'
  }
  if (text.includes('EQUIPO') && text.includes('TRANSF')) {
    return 'EQUIPO TRANSFUSÃO'
  }
  if (text.includes('POLIGLACTINA') || text.includes('VICRYL')) {
    return 'POLIGLACTINA'
  }

  return 'DEMAIS'
}

export function isExcessStock(
  item: Pick<ProductItem, 'estoque' | 'estoque_minimo'>,
  excessMultiplier = 3
): boolean {
  if (item.estoque_minimo === null || item.estoque_minimo <= 0) {
    return false
  }
  return item.estoque > item.estoque_minimo * excessMultiplier
}

export function normalizeExcessMultiplier(raw?: string | number | null): number {
  const parsed = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(parsed) || parsed < 1.5 || parsed > 10) {
    return 3
  }
  return Math.round(parsed * 10) / 10
}

