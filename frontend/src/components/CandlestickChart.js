import React from 'react';
import { ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar } from 'recharts';

const Candlestick = (props) => {
  const { payload, x, y, width, height } = props;
  if (!payload) return null;

  const { open, high, low, close } = payload;
  const isGreen = close >= open;
  const color = isGreen ? '#10b981' : '#ef4444';
  const centerX = x + width / 2;

  return (
    <g>
      {/* Wick (high-low line) */}
      <line
        x1={centerX}
        y1={y}
        x2={centerX}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x + width * 0.2}
        y={isGreen ? y + height * 0.3 : y + height * 0.1}
        width={width * 0.6}
        height={height * 0.6}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

const CandlestickChart = ({ data }) => {
  return (
    <ComposedChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="date" 
        tick={{ fontSize: 12 }}
        angle={-45}
        textAnchor="end"
        height={60}
      />
      <YAxis 
        tick={{ fontSize: 12 }} 
        domain={['dataMin - 0.5', 'dataMax + 0.5']}
      />
      <Tooltip 
        content={({ active, payload, label }) => {
          if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isGreen = data.close >= data.open;
            const change = data.close - data.open;
            const changePercent = ((change / data.open) * 100).toFixed(2);
            
            return (
              <div className="bg-white p-4 border border-gray-300 rounded shadow-lg text-sm">
                <p className="font-semibold mb-2 text-gray-800">{label}</p>
                <div className="space-y-1">
                  <p>Open: <span className="font-mono">${data.open.toFixed(2)}</span></p>
                  <p>High: <span className="font-mono text-green-600">${data.high.toFixed(2)}</span></p>
                  <p>Low: <span className="font-mono text-red-600">${data.low.toFixed(2)}</span></p>
                  <p>Close: <span className={`font-mono ${isGreen ? 'text-green-600' : 'text-red-600'}`}>
                    ${data.close.toFixed(2)}
                  </span></p>
                  <p>Volume: <span className="font-mono text-gray-600">{data.volume.toLocaleString()}</span></p>
                  <div className="border-t pt-1 mt-2">
                    <p className="text-xs">
                      Change: <span className={`font-semibold ${isGreen ? 'text-green-600' : 'text-red-600'}`}>
                        ${change.toFixed(2)} ({changePercent}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        }}
      />
      <Legend />
      <Bar 
        dataKey="high" 
        fill="transparent"
        shape={(props) => <Candlestick {...props} />}
        name="Price"
      />
    </ComposedChart>
  );
};

export default CandlestickChart;
