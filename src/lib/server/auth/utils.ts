import { encodeBase32LowerCaseNoPadding } from '@oslojs/encoding'

export function generateId(len: number): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  const token = encodeBase32LowerCaseNoPadding(bytes)
  return token
}
