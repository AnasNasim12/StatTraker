import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const PredictionChart = ({ data, chartType, isDarkMode }) => {
  if (!data || data.length === 0) return null;

  const renderChart = () => {
    switch (chartType) {
      case 'predictions':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                labelStyle={{ color: '#374151' }}
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db' }}
                formatter={(value, name) => [
                  `$${value?.toFixed(2) || 'N/A'}`,
                  name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 2 }}
                name="Actual Price"
              />
              <Line 
                type="monotone" 
                dataKey="linear_pred" 
                stroke="#16a34a" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Linear Prediction"
              />
              <Line 
                type="monotone" 
                dataKey="poly_pred" 
                stroke="#dc2626" 
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                name="Polynomial Prediction"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'daily_change':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
              <Tooltip 
                labelStyle={{ color: '#374151' }}
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db' }}
                formatter={(value) => [`${value?.toFixed(2) || 'N/A'}%`, 'Daily Change']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="daily_change" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={(props) => {
                  const { payload } = props;
                  const isPositive = payload?.daily_change >= 0;
                  return (
                    <circle
                      {...props}
                      fill={isPositive ? '#10b981' : '#ef4444'}
                      r={2}
                    />
                  );
                }}
                name="Daily % Change"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'cumulative_change':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
              <Tooltip 
                labelStyle={{ color: '#374151' }}
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db' }}
                formatter={(value) => [`${value?.toFixed(2) || 'N/A'}%`, 'Cumulative Change']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="cumulative_change" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={false}
                name="Cumulative % Change"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a chart type to view predictions
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full">
      {renderChart()}
    </div>
  );
};

export default PredictionChart;
