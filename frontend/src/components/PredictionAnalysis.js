import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PredictionChart from './PredictionChart';

const PredictionAnalysis = ({ ticker, startDate, endDate, isDarkMode }) => {
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionChartType, setPredictionChartType] = useState('predictions');

  const fetchPredictions = async () => {
    if (!ticker) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/stock/${ticker}/predictions`;
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      
      const response = await axios.get(url);
      setPredictionData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch prediction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [ticker, startDate, endDate]);

  const cardClasses = isDarkMode 
    ? 'bg-gray-800 rounded-lg shadow-lg border border-gray-700' 
    : 'bg-white rounded-lg shadow-lg border border-gray-200';

  if (loading) {
    return (
      <div className={`${cardClasses} p-6`}>
        <h3 className="text-lg font-semibold mb-4">📈 Prediction Analysis</h3>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading predictions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${cardClasses} p-6`}>
        <h3 className="text-lg font-semibold mb-4">📈 Prediction Analysis</h3>
        <div className="text-red-500 text-center">{error}</div>
        <button
          onClick={fetchPredictions}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mx-auto block"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!predictionData) return null;

  const { historical_data, future_predictions, model_stats } = predictionData;

  return (
    <div className={`${cardClasses} p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📈 Prediction Analysis</h3>
        <button
          onClick={fetchPredictions}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Enhanced Prediction Type Toggle */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          📊 Analysis Type:
        </label>
        <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
          {[
            { key: 'predictions', label: 'ML Predictions', icon: '🔮' },
            { key: 'daily_change', label: 'Daily Change %', icon: '📊' },
            { key: 'cumulative_change', label: 'Total Return %', icon: '📈' }
          ].map((type) => (
            <button
              key={type.key}
              onClick={() => {
                console.log('Setting prediction chart type to:', type.key);
                setPredictionChartType(type.key);
              }}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                predictionChartType === type.key
                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                  : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 hover:shadow-sm'
              }`}
            >
              <span>{type.icon}</span>
              <span className="hidden sm:inline">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Chart Type Indicator */}
      <div className="mb-3 text-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Showing: {predictionChartType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      </div>

      {/* Model Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="text-lg font-bold text-blue-600">{model_stats.linear_r2}</div>
          <div className="text-xs text-gray-500">R² Score</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="text-lg font-bold text-green-600">{model_stats.data_points}</div>
          <div className="text-xs text-gray-500">Data Points</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="text-lg font-bold text-purple-600">{model_stats.prediction_days}</div>
          <div className="text-xs text-gray-500">Future Days</div>
        </div>
      </div>

      {/* Enhanced Chart Container */}
      <div className="h-64 mb-4 border border-gray-200 dark:border-gray-600 rounded-lg p-2">
        <PredictionChart 
          data={historical_data} 
          chartType={predictionChartType}
          isDarkMode={isDarkMode}
          key={predictionChartType} // Force re-render on type change
        />
      </div>

      {/* Chart Type Description */}
      <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
        {predictionChartType === 'predictions' && (
          <p>🔮 <strong>ML Predictions:</strong> Shows actual prices vs linear/polynomial regression forecasts</p>
        )}
        {predictionChartType === 'daily_change' && (
          <p>📊 <strong>Daily Changes:</strong> Day-over-day percentage price movements (green = gain, red = loss)</p>
        )}
        {predictionChartType === 'cumulative_change' && (
          <p>📈 <strong>Total Return:</strong> Cumulative percentage change from the starting price</p>
        )}
      </div>

      {/* Future Predictions */}
      {future_predictions && future_predictions.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2 text-sm">📅 Future Predictions (Next 7 Days)</h4>
          <div className="max-h-32 overflow-y-auto">
            {future_predictions.map((pred, index) => (
              <div key={index} className="flex justify-between text-xs py-1 border-b border-gray-200 dark:border-gray-600">
                <span>{pred.date}</span>
                <span className="text-green-600">${pred.linear_pred}</span>
                <span className="text-red-600">${pred.poly_pred}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionAnalysis;
