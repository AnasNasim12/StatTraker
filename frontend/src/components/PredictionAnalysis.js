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

  const cardClasses = 'bg-gray-900 border border-gray-800 rounded-sm shadow-sm';

  if (loading) {
    return (
      <div className={`${cardClasses} p-4`}>
        <h3 className="text-sm font-medium text-gray-300 mb-4">Predictions</h3>
        <div className="flex justify-center items-center h-32">
          <div className="w-4 h-4 border border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${cardClasses} p-4`}>
        <h3 className="text-sm font-medium text-gray-300 mb-4">Predictions</h3>
        <div className="text-red-400 text-center text-sm">{error}</div>
        <button
          onClick={fetchPredictions}
          className="mt-2 btn-primary rounded-sm text-xs mx-auto block"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!predictionData) return null;

  const { historical_data, future_predictions, model_stats } = predictionData;

  return (
    <div className={`${cardClasses} p-4`}>
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-800">
        <h3 className="text-sm font-medium text-gray-300">Predictions</h3>
        <button
          onClick={fetchPredictions}
          className="text-gray-500 hover:text-gray-300 text-xs"
        >
          Refresh
        </button>
      </div>

      {/* Minimalistic Prediction Type Toggle */}
      <div className="mb-4">
        <div className="flex bg-gray-900 border border-gray-800 rounded-sm text-xs">
          {[
            { key: 'predictions', label: 'ML' },
            { key: 'daily_change', label: 'Daily %' },
            { key: 'cumulative_change', label: 'Total %' }
          ].map((type, index) => (
            <button
              key={type.key}
              onClick={() => setPredictionChartType(type.key)}
              className={`px-2 py-1.5 font-medium transition-colors ${
                predictionChartType === type.key
                  ? 'bg-gray-800 text-gray-100'
                  : 'text-gray-400 hover:text-gray-200'
              } ${index < 2 ? 'border-r border-gray-800' : ''}`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Minimalistic Model Statistics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-800 border border-gray-700 rounded-sm">
          <div className="text-sm font-mono text-blue-400">{model_stats.linear_r2}</div>
          <div className="text-xs text-gray-500">R²</div>
        </div>
        <div className="text-center p-2 bg-gray-800 border border-gray-700 rounded-sm">
          <div className="text-sm font-mono text-gray-300">{model_stats.data_points}</div>
          <div className="text-xs text-gray-500">Points</div>
        </div>
        <div className="text-center p-2 bg-gray-800 border border-gray-700 rounded-sm">
          <div className="text-sm font-mono text-gray-300">{model_stats.prediction_days}</div>
          <div className="text-xs text-gray-500">Days</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 border border-gray-800 rounded-sm mb-4">
        <PredictionChart 
          data={historical_data} 
          chartType={predictionChartType}
          isDarkMode={true}
          key={predictionChartType}
        />
      </div>

      {/* Future Predictions - Minimalistic */}
      {future_predictions && future_predictions.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
            7-Day Forecast
          </div>
          <div className="max-h-24 overflow-y-auto scrollbar-hide space-y-1">
            {future_predictions.slice(0, 3).map((pred, index) => (
              <div key={index} className="flex justify-between text-xs py-1 border-b border-gray-800">
                <span className="text-gray-500 font-mono">{pred.date.slice(5)}</span>
                <span className="text-blue-400 font-mono">${pred.linear_pred}</span>
                <span className="text-red-400 font-mono">${pred.poly_pred}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionAnalysis;
