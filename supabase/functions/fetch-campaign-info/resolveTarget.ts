import { parse as parseDinnerqueen } from './parsers/dinnerqueen.ts'
import { parse as parseGangnammatzip } from './parsers/gangnammatzip.ts'
import type { CampaignInfo } from './parsers/common.ts'

export type Target = {
  parse: (html: string) => CampaignInfo
}

const TARGETS_BY_HOSTNAME: Record<string, Target> = {
  'dinnerqueen.net': { parse: parseDinnerqueen },
  'www.dinnerqueen.net': { parse: parseDinnerqueen },
  'xn--939au0g4vj8sq.net': { parse: parseGangnammatzip },
}

export function resolveTarget(hostname: string): Target | null {
  return TARGETS_BY_HOSTNAME[hostname] ?? null
}
