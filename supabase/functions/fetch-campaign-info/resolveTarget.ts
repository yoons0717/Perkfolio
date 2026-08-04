import { parse as parseDinnerqueen } from './parsers/dinnerqueen.ts'
import { parse as parseGangnammatzip } from './parsers/gangnammatzip.ts'
import type { CampaignInfo, Platform } from './parsers/common.ts'

export type Target = {
  platform: Platform
  parse: (html: string) => CampaignInfo
}

const TARGETS_BY_HOSTNAME: Record<string, Target> = {
  'dinnerqueen.net': { platform: '디너의여왕', parse: parseDinnerqueen },
  'www.dinnerqueen.net': { platform: '디너의여왕', parse: parseDinnerqueen },
  'xn--939au0g4vj8sq.net': { platform: '강남맛집', parse: parseGangnammatzip },
}

export function resolveTarget(hostname: string): Target | null {
  return TARGETS_BY_HOSTNAME[hostname] ?? null
}
