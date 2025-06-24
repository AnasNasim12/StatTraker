import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Bar,
  ReferenceLine,
  Cell
} from 'recharts';
import PredictionAnalysis from './components/PredictionAnalysis';

// Custom Candlestick component
const CandlestickBar = (props) => {
  const { payload, x, y, width, height } = props;
  if (!payload) return null;
  
  const { open, high, low, close } = payload;
  const isGreen = close >= open;
  const color = isGreen ? '#10b981' : '#ef4444';
  
  // Calculate positions
  const centerX = x + width / 2;
  const bodyTop = Math.max(open, close);
  const bodyBottom = Math.min(open, close);
  const bodyHeight = Math.abs(close - open);
  
  // Scale calculations (assuming the chart area represents the price range)
  const priceRange = high - low;
  const pixelPerPrice = height / priceRange;
  
  const highY = y;
  const lowY = y + height;
  const bodyTopY = y + (high - bodyTop) * pixelPerPrice;
  const bodyBottomY = y + (high - bodyBottom) * pixelPerPrice;
  
  return (
    <g>
      {/* High-Low line (wick) */}
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body rectangle */}
      <rect
        x={x + width * 0.25}
        y={bodyTopY}
        width={width * 0.5}
        height={Math.max(bodyBottomY - bodyTopY, 1)}
        fill={isGreen ? color : color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

function App() {
  const [stockData, setStockData] = useState([]);
  const [ticker, setTicker] = useState('AAPL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stockInfo, setStockInfo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedTickers, setSelectedTickers] = useState(['AAPL']);
  const [comparisonData, setComparisonData] = useState([]);
  const [comparisonInfo, setComparisonInfo] = useState({});
  const [showRelativePerformance, setShowRelativePerformance] = useState(false);
  const intervalRef = useRef(null);
  const [selectedStocks, setSelectedStocks] = useState(['AAPL']);
  const [multiStockData, setMultiStockData] = useState({});
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [loadingStocks, setLoadingStocks] = useState(new Set());

  // Set default dates (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  const fetchStockData = async (symbol = ticker, start = startDate, end = endDate) => {
    try {
      setLoading(true);
      setError(null);
      
      // Try proxy first, fallback to direct URL
      let baseUrl = '';
      try {
        // Test if proxy is working
        await axios.get('/api/stock/AAPL', { timeout: 1000 });
      } catch (proxyError) {
        // Fallback to direct backend URL
        baseUrl = 'http://localhost:5000';
        console.warn('Proxy not available, using direct backend URL');
      }
      
      let dataUrl = `${baseUrl}/api/stock/${symbol}`;
      let infoUrl = `${baseUrl}/api/stock/${symbol}/info`;
      
      if (start && end) {
        dataUrl += `?start_date=${start}&end_date=${end}`;
      }
      
      const [dataResponse, infoResponse] = await Promise.all([
        axios.get(dataUrl),
        axios.get(infoUrl).catch(err => {
          console.warn('Failed to fetch stock info:', err);
          return { data: null };
        })
      ]);
      
      setStockData(dataResponse.data.data);
      setTicker(dataResponse.data.ticker);
      setStockInfo(infoResponse.data);
      setLastRefresh(new Date());
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Backend server is not running. Please start the Flask server on port 5000.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch stock data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonData = async (tickers = selectedTickers, start = startDate, end = endDate) => {
    try {
      setLoading(true);
      setError(null);
      
      // Try proxy first, fallback to direct URL
      let baseUrl = '';
      try {
        // Test if proxy is working
        await axios.get('/api/stock/AAPL', { timeout: 1000 });
      } catch (proxyError) {
        // Fallback to direct backend URL
        baseUrl = 'http://localhost:5000';
        console.warn('Proxy not available, using direct backend URL');
      }
      
      let url = `${baseUrl}/api/stocks/compare?tickers=${tickers.join(',')}`;
      if (start && end) {
        url += `&start_date=${start}&end_date=${end}`;
      }
      
      const response = await axios.get(url);
      setComparisonData(response.data.data);
      setComparisonInfo(response.data.stock_info);
      setLastRefresh(new Date());
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Backend server is not running. Please start the Flask server on port 5000.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch comparison data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        if (startDate && endDate) {
          if (isMultiMode && selectedStocks.length > 0) {
            fetchMultipleStocks(selectedStocks, startDate, endDate);
          } else if (!isMultiMode && ticker) {
            fetchStockData(ticker, startDate, endDate);
          }
        }
      }, 15 * 60 * 1000); // 15 minutes
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, ticker, startDate, endDate, isMultiMode, selectedStocks]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchStockData();
    }
  }, []);

  const fetchMultipleStocks = async (tickers, start = startDate, end = endDate) => {
    try {
      setLoading(true);
      setError(null);
      const newLoadingStocks = new Set(tickers);
      setLoadingStocks(newLoadingStocks);

      const promises = tickers.map(async (ticker) => {
        try {
          let url = `/api/stock/${ticker}`;
          if (start && end) {
            url += `?start_date=${start}&end_date=${end}`;
          }
          
          const [dataResponse, infoResponse] = await Promise.all([
            axios.get(url),
            axios.get(`/api/stock/${ticker}/info`).catch(() => ({ data: null }))
          ]);

          setLoadingStocks(prev => {
            const updated = new Set(prev);
            updated.delete(ticker);
            return updated;
          });

          return {
            ticker: ticker.toUpperCase(),
            data: dataResponse.data.data,
            info: infoResponse.data
          };
        } catch (err) {
          setLoadingStocks(prev => {
            const updated = new Set(prev);
            updated.delete(ticker);
            return updated;
          });
          throw new Error(`Failed to fetch ${ticker}: ${err.response?.data?.error || err.message}`);
        }
      });

      const results = await Promise.allSettled(promises);
      const stockDataMap = {};
      const errors = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { ticker, data, info } = result.value;
          stockDataMap[ticker] = { data, info };
        } else {
          errors.push(result.reason.message);
        }
      });

      setMultiStockData(stockDataMap);
      if (errors.length > 0) {
        setError(`Some stocks failed to load: ${errors.join(', ')}`);
      }
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to fetch stock data');
    } finally {
      setLoading(false);
      setLoadingStocks(new Set());
    }
  };

  const handleTickerSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newTicker = formData.get('ticker');
    if (newTicker) {
      fetchStockData(newTicker, startDate, endDate);
    }
  };

  const handleDateChange = () => {
    if (startDate && endDate) {
      if (isMultiMode) {
        fetchMultipleStocks(selectedStocks, startDate, endDate);
      } else {
        fetchStockData(ticker, startDate, endDate);
      }
    }
  };

  const handleDownload = async (format) => {
    try {
      // Try proxy first, fallback to direct URL
      let baseUrl = '';
      try {
        await axios.get('/api/stock/AAPL', { timeout: 1000 });
      } catch (proxyError) {
        baseUrl = 'http://localhost:5000';
      }
      
      let url = `${baseUrl}/api/stock/${ticker}/export/${format}`;
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${ticker}_stock_data.${format}`;
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Download failed. Please ensure the backend server is running.');
    }
  };

  const handleManualRefresh = () => {
    if (isMultiMode) {
      fetchMultipleStocks(selectedStocks, startDate, endDate);
    } else {
      fetchStockData(ticker, startDate, endDate);
    }
  };

  const handleAddTicker = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newTicker = formData.get('newTicker')?.trim().toUpperCase();
    
    if (newTicker && !selectedTickers.includes(newTicker)) {
      const updatedTickers = [...selectedTickers, newTicker];
      setSelectedTickers(updatedTickers);
      if (comparisonMode) {
        fetchComparisonData(updatedTickers, startDate, endDate);
      }
    }
    e.target.reset();
  };

  const handleAddStock = (newTicker) => {
    if (newTicker && !selectedStocks.includes(newTicker.toUpperCase())) {
      const updatedStocks = [...selectedStocks, newTicker.toUpperCase()];
      setSelectedStocks(updatedStocks);
      if (isMultiMode) {
        fetchMultipleStocks(updatedStocks, startDate, endDate);
      }
    }
  };

  const handleRemoveTicker = (tickerToRemove) => {
    const updatedTickers = selectedTickers.filter(t => t !== tickerToRemove);
    setSelectedTickers(updatedTickers);
    if (comparisonMode && updatedTickers.length > 0) {
      fetchComparisonData(updatedTickers, startDate, endDate);
    }
  };

  const handleRemoveStock = (tickerToRemove) => {
    const updatedStocks = selectedStocks.filter(t => t !== tickerToRemove);
    setSelectedStocks(updatedStocks);
    
    const updatedData = { ...multiStockData };
    delete updatedData[tickerToRemove];
    setMultiStockData(updatedData);
  };

  const handleModeSwitch = (multiMode) => {
    setIsMultiMode(multiMode);
    setError(null);
    
    if (multiMode) {
      fetchMultipleStocks(selectedStocks, startDate, endDate);
    } else {
      fetchStockData(selectedStocks[0] || 'AAPL', startDate, endDate);
    }
  };

  const formatMarketCap = (value) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value?.toLocaleString() || 'N/A'}`;
  };

  const generateColors = (count) => {
    const colors = [
      '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed',
      '#db2777', '#0891b2', '#65a30d', '#e11d48', '#7c2d12'
    ];
    return colors.slice(0, count);
  };

  const renderChart = () => {
    if (!stockData.length) return null;

    // Prepare data with price range for candlestick scaling
    const dataWithRange = stockData.map(item => ({
      ...item,
      range: item.high - item.low,
      body: Math.abs(item.close - item.open)
    }));

    switch (chartType) {
      case 'line':
        return (
          <LineChart data={stockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelStyle={{ color: '#374151' }}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
              name="Closing Price"
            />
          </LineChart>
        );

      case 'candlestick':
        return (
          <ComposedChart data={dataWithRange}>
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
              domain={['dataMin - 1', 'dataMax + 1']}
            />
            <Tooltip 
              labelStyle={{ color: '#374151' }}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d5db' }}
              formatter={(value, name) => {
                if (name === 'candlestick') {
                  return [
                    `O: $${value.open} H: $${value.high} L: $${value.low} C: $${value.close}`,
                    'OHLC'
                  ];
                }
                return [
                  typeof value === 'number' ? `$${value.toFixed(2)}` : value,
                  name.charAt(0).toUpperCase() + name.slice(1)
                ];
              }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const isGreen = data.close >= data.open;
                  return (
                    <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                      <p className="font-medium">{label}</p>
                      <p>Open: <span className="font-mono">${data.open}</span></p>
                      <p>High: <span className="font-mono text-green-600">${data.high}</span></p>
                      <p>Low: <span className="font-mono text-red-600">${data.low}</span></p>
                      <p>Close: <span className={`font-mono ${isGreen ? 'text-green-600' : 'text-red-600'}`}>${data.close}</span></p>
                      <p>Volume: <span className="font-mono">{data.volume.toLocaleString()}</span></p>
                      <p className="text-sm text-gray-500">
                        Change: <span className={isGreen ? 'text-green-600' : 'text-red-600'}>
                          ${(data.close - data.open).toFixed(2)} ({(((data.close - data.open) / data.open) * 100).toFixed(2)}%)
                        </span>
                      </p>
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
              stroke="transparent"
              name="Candlestick"
              shape={(props) => <CandlestickBar {...props} />}
            />
          </ComposedChart>
        );

      case 'volume':
        return (
          <ComposedChart data={stockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis yAxisId="price" orientation="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip 
              labelStyle={{ color: '#374151' }}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d5db' }}
              formatter={(value, name) => [
                name === 'volume' ? value.toLocaleString() : `$${value.toFixed(2)}`,
                name.charAt(0).toUpperCase() + name.slice(1)
              ]}
            />
            <Legend />
            <Bar yAxisId="volume" dataKey="volume" fill="#e5e7eb" name="Volume" opacity={0.6} />
            <Line 
              yAxisId="price"
              type="monotone" 
              dataKey="close" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={false}
              name="Close Price"
            />
          </ComposedChart>
        );

      default:
        return null;
    }
  };

  const renderComparisonChart = () => {
    if (!comparisonData.length) return null;

    const colors = generateColors(selectedTickers.length);
    const dataKey = showRelativePerformance ? 'relative' : 'close';

    switch (chartType) {
      case 'line':
        return (
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelStyle={{ color: '#374151' }}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d5db' }}
              formatter={(value, name) => [
                showRelativePerformance ? `${value}%` : `$${value?.toFixed(2)}`,
                name.replace('_close', '').replace('_relative', '')
              ]}
            />
            <Legend />
            {selectedTickers.map((ticker, index) => (
              <Line
                key={ticker}
                type="monotone"
                dataKey={`${ticker}_${dataKey}`}
                stroke={colors[index]}
                strokeWidth={2}
                dot={false}
                name={ticker}
              />
            ))}
          </LineChart>
        );

      case 'volume':
        return (
          <ComposedChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis yAxisId="price" orientation="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip 
              labelStyle={{ color: '#374151' }}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d5db' }}
              formatter={(value, name) => [
                name.includes('volume') ? value?.toLocaleString() : 
                  showRelativePerformance ? `${value}%` : `$${value?.toFixed(2)}`,
                name.replace('_close', '').replace('_volume', '').replace('_relative', '')
              ]}
            />
            <Legend />
            {selectedTickers.map((ticker, index) => (
              <React.Fragment key={ticker}>
                <Bar 
                  yAxisId="volume" 
                  dataKey={`${ticker}_volume`} 
                  fill={colors[index]} 
                  name={`${ticker} Volume`} 
                  opacity={0.3} 
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey={`${ticker}_${dataKey}`}
                  stroke={colors[index]}
                  strokeWidth={2}
                  dot={false}
                  name={`${ticker} Price`}
                />
              </React.Fragment>
            ))}
          </ComposedChart>
        );

      default:
        return renderChart();
    }
  };

  const renderMultiStockChart = () => {
    const colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#c2410c'];
    const allData = Object.values(multiStockData).reduce((acc, stock) => {
      return acc.concat(stock.data || []);
    }, []);

    if (allData.length === 0) return null;

    // Normalize data by date for comparison
    const dateMap = {};
    Object.entries(multiStockData).forEach(([ticker, stock]) => {
      (stock.data || []).forEach(item => {
        if (!dateMap[item.date]) {
          dateMap[item.date] = { date: item.date };
        }
        dateMap[item.date][`${ticker}_close`] = item.close;
        dateMap[item.date][`${ticker}_volume`] = item.volume;
        dateMap[item.date][`${ticker}_high`] = item.high;
        dateMap[item.date][`${ticker}_low`] = item.low;
        dateMap[item.date][`${ticker}_open`] = item.open;
      });
    });

    const chartData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelStyle={{ color: '#374151' }}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d5db' }}
            />
            <Legend />
            {selectedStocks.map((ticker, index) => (
              <Line
                key={ticker}
                type="monotone"
                dataKey={`${ticker}_close`}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                name={`${ticker} Close`}
              />
            ))}
          </LineChart>
        );

      case 'candlestick':
        return (
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelStyle={{ color: '#374151' }}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d5db' }}
            />
            <Legend />
            {selectedStocks.map((ticker, index) => (
              <React.Fragment key={ticker}>
                <Line type="monotone" dataKey={`${ticker}_high`} stroke={colors[index % colors.length]} name={`${ticker} High`} strokeWidth={1} dot={false} opacity={0.7} />
                <Line type="monotone" dataKey={`${ticker}_low`} stroke={colors[index % colors.length]} name={`${ticker} Low`} strokeWidth={1} dot={false} opacity={0.7} strokeDasharray="3 3" />
                <Line type="monotone" dataKey={`${ticker}_close`} stroke={colors[index % colors.length]} name={`${ticker} Close`} strokeWidth={2} dot={false} />
              </React.Fragment>
            ))}
          </ComposedChart>
        );

      case 'volume':
        return (
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis yAxisId="price" orientation="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip 
              labelStyle={{ color: '#374151' }}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d5db' }}
              formatter={(value, name) => [
                name.includes('volume') ? value?.toLocaleString() : `$${value?.toFixed(2)}`,
                name.replace('_close', '').replace('_volume', '').replace('_relative', '')
              ]}
            />
            <Legend />
            {selectedStocks.map((ticker, index) => (
              <React.Fragment key={ticker}>
                <Bar 
                  yAxisId="volume" 
                  dataKey={`${ticker}_volume`} 
                  fill={colors[index % colors.length]} 
                  name={`${ticker} Volume`} 
                  opacity={0.3} 
                />
                <Line 
                  yAxisId="price"
                  type="monotone" 
                  dataKey={`${ticker}_close`} 
                  stroke={colors[index % colors.length]} 
                  strokeWidth={2}
                  dot={false}
                  name={`${ticker} Price`}
                />
              </React.Fragment>
            ))}
          </ComposedChart>
        );

      default:
        return null;
    }
  };

  const themeClasses = isDarkMode 
    ? 'min-h-screen bg-gray-900 text-white transition-colors duration-300' 
    : 'min-h-screen bg-gray-100 transition-colors duration-300';
  
  const cardClasses = isDarkMode 
    ? 'bg-gray-800 rounded-lg shadow-lg border border-gray-700' 
    : 'bg-white rounded-lg shadow-lg border border-gray-200';

  return (
    <div className={themeClasses}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Stock Market Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Real-time stock analysis and comparison tool
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mode Toggle */}
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => handleModeSwitch(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all $
                  !isMultiMode
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Single Stock
              </button>
              <button
                onClick={() => handleModeSwitch(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all $
                  isMultiMode
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Compare Stocks
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-all ${
                isDarkMode 
                  ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 shadow-lg' 
                  : 'bg-gray-800 text-white hover:bg-gray-700 shadow-lg'
              }`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Multi-Stock Selector Card */}
        {isMultiMode && (
          <div className={`${cardClasses} p-6 mb-8`}>
            <h3 className="text-lg font-semibold mb-4">Selected Stocks</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedStocks.map((stock, index) => (
                <div
                  key={stock}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <span 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#65a30d', '#e11d48', '#7c2d12'][index % 10] }}
                  ></span>
                  <span className="font-medium">{stock}</span>
                  {loadingStocks.has(stock) ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <button
                      onClick={() => handleRemoveStock(stock)}
                      className="text-red-500 hover:text-red-700 ml-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const newTicker = formData.get('newTicker');
                handleAddStock(newTicker);
                e.target.reset();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                name="newTicker"
                placeholder="Add stock (e.g., TSLA)"
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                Add Stock
              </button>
            </form>
          </div>
        )}

        {/* Stock Metadata Cards Grid */}
        {!isMultiMode && stockInfo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`${cardClasses} p-6 hover:shadow-xl transition-shadow`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</h3>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <p className="text-xl font-bold truncate">{stockInfo.company_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{stockInfo.sector}</p>
            </div>
            
            <div className={`${cardClasses} p-6 hover:shadow-xl transition-shadow`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Market Cap</h3>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-xl font-bold">{formatMarketCap(stockInfo.market_cap)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">PE: {stockInfo.pe_ratio?.toFixed(2) || 'N/A'}</p>
            </div>
            
            <div className={`${cardClasses} p-6 hover:shadow-xl transition-shadow`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Price</h3>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              </div>
              <p className="text-xl font-bold">${stockInfo.current_price?.toFixed(2) || 'N/A'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Prev: ${stockInfo.previous_close?.toFixed(2) || 'N/A'}
              </p>
            </div>
            
            <div className={`${cardClasses} p-6 hover:shadow-xl transition-shadow`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Day Range</h3>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
              <p className="text-xl font-bold">
                ${stockInfo.day_low?.toFixed(2) || 'N/A'} - ${stockInfo.day_high?.toFixed(2) || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Vol: {stockInfo.volume?.toLocaleString() || 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Loading State */}
        {loading && (
          <div className={`${cardClasses} p-12 mb-8`}>
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-medium">Loading stock data...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">This may take a few moments</p>
            </div>
          </div>
        )}

        {/* Enhanced Error State */}
        {error && (
          <div className={`${cardClasses} p-6 mb-8 border-l-4 border-red-500`}>
            <div className="flex items-center">
              <div className="text-red-500 mr-3">⚠️</div>
              <div>
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Error</h3>
                <p className="text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls Card */}
        <div className={`${cardClasses} p-6 mb-8`}>
          {/* Ticker Input - Only show in single mode */}
          {!isMultiMode && (
            <form onSubmit={handleTickerSubmit} className="flex gap-4 items-center mb-6">
              <label htmlFor="ticker" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Stock Symbol:
              </label>
              <input
                type="text"
                name="ticker"
                id="ticker"
                placeholder="Enter ticker (e.g., AAPL)"
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Fetch Data
              </button>
            </form>
          )}

          {/* Date Range Inputs */}
          <div className="flex gap-4 items-center mb-6">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleDateChange}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
            >
              Update Range
            </button>
          </div>

          {/* Chart Type Toggle - Enhanced Visibility */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6 p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-fit">
              📊 Chart Type:
            </label>
            <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
              {['line', 'candlestick', 'volume'].map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-6 py-3 rounded-md text-sm font-semibold transition-all duration-200 min-w-[120px] $
                    chartType === type
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 transform scale-105'
                      : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 hover:shadow-md border border-gray-300 dark:border-gray-500'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {type === 'line' && '📈'}
                    {type === 'candlestick' && '🕯️'}
                    {type === 'volume' && '📊'}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Export and Refresh Controls */}
          <div className="flex gap-4 items-center justify-between">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">Export:</label>
              <button
                onClick={() => handleDownload('csv')}
                className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                disabled={isMultiMode ? Object.keys(multiStockData).length === 0 : !stockData.length}
              >
                CSV
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                disabled={isMultiMode ? Object.keys(multiStockData).length === 0 : !stockData.length}
              >
                PDF
              </button>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="autoRefresh" className="text-sm">Auto-refresh (15min)</label>
              </div>
              
              <button
                onClick={handleManualRefresh}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {lastRefresh && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
              {isMultiMode && ` (${selectedStocks.length} stocks)`}
            </div>
          )}
        </div>

        {/* Enhanced Chart Container */}
        <div className={`${cardClasses} p-6 hover:shadow-xl transition-shadow`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {isMultiMode 
                ? `Stock Comparison - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart` 
                : `${ticker} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`
              }
            </h2>
            {lastRefresh && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          {!loading && !error && (
            <ResponsiveContainer width="100%" height={500}>
              {isMultiMode ? renderMultiStockChart() : renderChart()}
            </ResponsiveContainer>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Container - Takes 2/3 width */}
          <div className={`${cardClasses} p-6 hover:shadow-xl transition-shadow lg:col-span-2`}>
            {!loading && !error && (
              <ResponsiveContainer width="100%" height={500}>
                {isMultiMode ? renderMultiStockChart() : renderChart()}
              </ResponsiveContainer>
            )}
          </div>

          {/* Prediction Analysis - Takes 1/3 width */}
          <div className="lg:col-span-1">
            <PredictionAnalysis 
              ticker={isMultiMode ? selectedStocks[0] : ticker} 
              startDate={startDate}
              endDate={endDate}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
