export function drawingPointsForSeries(drawing) {
  if (!Array.isArray(drawing?.points)) return [];
  return drawing.points
    .map((point) => ({ time: point.time, value: point.price }))
    .sort((a, b) => a.time - b.time);
}
