import { INVIDIOUS_INSTANCES, UPSTREAM } from '../config'

const recentFailures = new Map<string, number>()
const recentSuccess = new Map<string, number>()

const now = () => Date.now()

export function strip(instance: string): string {
  return instance.replace(/\/+$/, '')
}

function score(instance: string): number {
  let value = 0
  if ((recentFailures.get(instance) ?? 0) > now()) value += 1000
  const successAt = recentSuccess.get(instance)
  if (successAt) value -= Math.min(50, Math.floor((now() - successAt) / 1000))
  return value
}

export function orderedInstances(): string[] {
  return [...INVIDIOUS_INSTANCES].map(strip).sort((a, b) => score(a) - score(b))
}

export function markSuccess(instance: string): void {
  recentSuccess.set(instance, now())
  recentFailures.delete(instance)
}

export function markFailure(instance: string, cooldownMs: number = UPSTREAM.failureCooldownMs): void {
  recentFailures.set(instance, now() + cooldownMs)
}

function isInCooldown(instance: string): boolean {
  return (recentFailures.get(instance) ?? 0) > now()
}

export function prioritizedInstances(): string[] {
  const instances = orderedInstances()
  return [
    ...instances.filter((i) => !isInCooldown(i)),
    ...instances.filter((i) => isInCooldown(i)),
  ]
}
