

interface Point {
  time: string;
  value: number;
}

interface SimpleChartProps {
  data: Point[];
  color?: string;
  height?: number;
  labelY?: string;
}

export function SimpleChart({ data, color = '#1a73e8', height = 200, labelY = '' }: SimpleChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-canvas rounded-xl text-muted text-[13px]" style={{ height }}>
        No historical data available
      </div>
    );
  }

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1; // avoid division by zero

  // Add 10% padding to top and bottom
  const paddedMin = minVal - range * 0.1;
  const paddedMax = maxVal + range * 0.1;
  const paddedRange = paddedMax - paddedMin;

  const width = 1000;
  const strokeWidth = 2;

  // Generate SVG path points
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - paddedMin) / paddedRange) * height;
    return `${x},${y}`;
  });
  
  const pathData = `M ${points.join(' L ')}`;
  
  // Fill path for gradient under the line
  const fillPathData = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  return (
    <div className="w-full relative pr-10">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 0.5, 1].map((tick) => (
          <line
            key={tick}
            x1="0"
            y1={height * tick}
            x2={width}
            y2={height * tick}
            stroke="currentColor"
            className="text-line"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}

        {/* Fill */}
        <path d={fillPathData} fill={`url(#gradient-${color})`} />
        
        {/* Line */}
        <path d={pathData} fill="none" stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
      </svg>
      
      {/* Y Axis Labels */}
      <div className="absolute top-0 right-0 h-full flex flex-col justify-between items-end pointer-events-none text-[10px] text-muted font-medium">
        <span>{paddedMax.toFixed(1)} {labelY}</span>
        <span>{((paddedMax + paddedMin) / 2).toFixed(1)} {labelY}</span>
        <span>{paddedMin.toFixed(1)} {labelY}</span>
      </div>
    </div>
  );
}
