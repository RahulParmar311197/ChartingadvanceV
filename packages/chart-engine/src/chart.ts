export interface ChartViewport { from: number; to: number; priceMin?: number; priceMax?: number; }
export interface ChartPane { id: string; height: number; indicators: string[]; }
export interface DrawingPoint { time: number; price: number; }
export interface Drawing { id: string; type: 'line' | 'ray' | 'trendline' | 'horizontal' | 'vertical' | 'text'; points: DrawingPoint[]; locked?: boolean; visible?: boolean; }
export interface ChartLayout { id: string; symbolId: string; timeframe: string; panes: ChartPane[]; drawings: Drawing[]; }

export interface IndicatorDefinition<TConfig = unknown> {
  id: string;
  name: string;
  overlay: boolean;
  defaults: TConfig;
  calculate(input: { candles: import('./market').Candle[]; config: TConfig }): number[];
}
