export type AlertType = 'price' | 'indicator' | 'drawing' | 'strategy' | 'webhook';
export type AlertOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'crosses_above' | 'crosses_below';
export interface AlertRule { id: string; userId: string; symbolId: string; type: AlertType; operator: AlertOperator; threshold: number; enabled: boolean; cooldownSeconds: number; }
export interface AlertEvent { ruleId: string; firedAt: number; value: number; deliveryId: string; }
