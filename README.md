# 📈 Stock Market Dashboard

A comprehensive React + Flask stock market dashboard with real-time data visualization, multi-stock comparison, predictions, and advanced charting capabilities.

## 🌟 Features

### Core Functionality
- **Real-time Stock Data**: Fetch live stock data using yfinance
- **Multiple Chart Types**: Line charts, candlestick charts, and volume analysis
- **Multi-Stock Comparison**: Compare multiple stocks side by side
- **Date Range Filtering**: Analyze data across custom time periods
- **Auto/Manual Refresh**: Keep data current with automatic or manual updates

### Advanced Features
- **ML Predictions**: Linear and polynomial regression forecasting
- **Percentage Analysis**: Daily and cumulative percentage change charts
- **Data Export**: Download data as CSV or PDF
- **Dark/Light Theme**: Toggle between themes for better UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### Technical Features
- **RESTful API**: Clean Flask backend with CORS support
- **Modern UI**: Built with Tailwind CSS and Recharts
- **Error Handling**: Comprehensive error states and loading indicators
- **Performance**: Optimized rendering and data fetching

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stock-dashboard.git
   cd stock-dashboard
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Quick Start Scripts
Use the provided batch files for easier startup:
- `start-backend.bat` - Start Flask server
- `start-frontend.bat` - Start React development server
- `start-both.bat` - Start both servers automatically

## 📊 API Endpoints

### Stock Data
- `GET /api/stock/<ticker>` - Get stock data
- `GET /api/stock/<ticker>?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Get filtered data
- `GET /api/stock/<ticker>/info` - Get company metadata

### Predictions
- `GET /api/stock/<ticker>/predictions` - Get ML predictions and trend analysis

### Export
- `GET /api/stock/<ticker>/export/csv` - Download CSV
- `GET /api/stock/<ticker>/export/pdf` - Download PDF

## 🛠️ Technology Stack

### Backend
- **Flask**: Web framework
- **yfinance**: Stock data fetching
- **scikit-learn**: Machine learning predictions
- **pandas**: Data manipulation
- **reportlab**: PDF generation

### Frontend
- **React**: UI framework
- **Tailwind CSS**: Styling
- **Recharts**: Data visualization
- **Axios**: HTTP client

## 📁 Project Structure

```
stock-dashboard/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js        # Main application
│   │   └── index.css     # Styles
│   ├── package.json      # Node dependencies
│   └── public/           # Static files
├── .gitignore            # Git ignore rules
└── README.md            # This file
```

## 🎯 Usage Examples

### Single Stock Analysis
1. Enter a stock ticker (e.g., AAPL, TSLA)
2. Select date range
3. Choose chart type (Line/Candlestick/Volume)
4. View predictions and trends

### Multi-Stock Comparison
1. Toggle to "Compare Stocks" mode
2. Add multiple tickers
3. Analyze performance side by side
4. Export comparison data

### Predictions
1. View ML-generated predictions
2. Compare actual vs predicted prices
3. Analyze daily/cumulative changes
4. View future forecasts

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
FLASK_DEBUG=True
FLASK_ENV=development
```

### Customization
- Modify `tailwind.config.js` for styling
- Adjust API endpoints in `App.js`
- Configure chart colors and themes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

**Proxy Errors**
- Ensure Flask server is running on port 5000
- Check firewall settings

**Module Not Found**
- Install backend dependencies: `pip install -r requirements.txt`
- Install frontend dependencies: `npm install`

**Data Not Loading**
- Verify internet connection
- Check if ticker symbols are valid
- Ensure yfinance is working properly

## 📧 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section
2. Search existing issues on GitHub
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- [yfinance](https://github.com/ranaroussi/yfinance) for stock data
- [Recharts](https://recharts.org/) for beautiful charts
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Flask](https://flask.palletsprojects.com/) for the backend framework
