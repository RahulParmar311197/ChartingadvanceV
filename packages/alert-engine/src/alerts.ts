export type AlertType = 'price' | 'indicator' | 'drawing' | 'strategy' | 'webhook';
export type AlertOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'crosses_above' | 'crosses_below';
export interface AlertRule { id: string; userId: string; symbolId: string; type: AlertType; operator: AlertOperator; threshold: number; enabled: boolean; cooldownSeconds: number; }
export interface AlertEvent { ruleId: string; firedAt: number; value: number; deliveryId: string; }

export function evaluateAlert(
  rule: AlertRule,
  value: number,
  now: number,
  previousValue?: number,
  lastFiredAt?: number,
): AlertEvent | null {
  if (!rule.enabled || !Number.isFinite(value) || !Number.isFinite(rule.threshold) || !Number.isFinite(now)) return null;
  if (lastFiredAt != null && now - lastFiredAt < Math.max(0, rule.cooldownSeconds) * 1000) return null;

  const crossedAbove = previousValue != null && Number.isFinite(previousValue) && previousValue <= rule.threshold && value > rule.threshold;
  const crossedBelow = previousValue != null && Number.isFinite(previousValue) && previousValue >= rule.threshold && value < rule.threshold;
  const triggered = rule.operator === 'gt' ? value > rule.threshold
    : rule.operator === 'gte' ? value >= rule.threshold
    : rule.operator === 'lt' ? value < rule.threshold
    : rule.operator === 'lte' ? value <= rule.threshold
    : rule.operator === 'crosses_above' ? crossedAbove
    : crossedBelow;
  if (!triggered) return null;
  return { ruleId: rule.id, firedAt: now, value, deliveryId: `${rule.id}:${now}` };
}
