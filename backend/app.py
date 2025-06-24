from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd
import csv
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline

app = Flask(__name__)
CORS(app)

@app.route('/api/stock/<ticker>')
def get_stock_data(ticker):
    try:
        # Get date range from query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        else:
            # Default to 1-month data
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
        
        stock = yf.Ticker(ticker)
        data = stock.history(start=start_date, end=end_date)
        
        if data.empty:
            return jsonify({'error': f'No data found for ticker {ticker}'}), 404
        
        # Process data - include all OHLC + Volume
        stock_data = []
        for date, row in data.iterrows():
            stock_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'open': round(row['Open'], 2),
                'high': round(row['High'], 2),
                'low': round(row['Low'], 2),
                'close': round(row['Close'], 2),
                'volume': int(row['Volume'])
            })
        
        return jsonify({
            'ticker': ticker.upper(),
            'data': stock_data,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/stock/<ticker>/export/<format>')
def export_stock_data(ticker, format):
    try:
        # Get date range from query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        else:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
        
        stock = yf.Ticker(ticker)
        data = stock.history(start=start_date, end=end_date)
        
        if data.empty:
            return jsonify({'error': f'No data found for ticker {ticker}'}), 404
        
        if format.lower() == 'csv':
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(['Date', 'Open', 'High', 'Low', 'Close', 'Volume'])
            
            for date, row in data.iterrows():
                writer.writerow([
                    date.strftime('%Y-%m-%d'),
                    round(row['Open'], 2),
                    round(row['High'], 2),
                    round(row['Low'], 2),
                    round(row['Close'], 2),
                    int(row['Volume'])
                ])
            
            output.seek(0)
            return send_file(
                io.BytesIO(output.getvalue().encode()),
                mimetype='text/csv',
                as_attachment=True,
                download_name=f'{ticker}_stock_data.csv'
            )
        
        elif format.lower() == 'pdf':
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            
            # Prepare data for table
            table_data = [['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
            for date, row in data.iterrows():
                table_data.append([
                    date.strftime('%Y-%m-%d'),
                    f"${round(row['Open'], 2)}",
                    f"${round(row['High'], 2)}",
                    f"${round(row['Low'], 2)}",
                    f"${round(row['Close'], 2)}",
                    f"{int(row['Volume']):,}"
                ])
            
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            doc.build([table])
            buffer.seek(0)
            
            return send_file(
                buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f'{ticker}_stock_data.pdf'
            )
        
        else:
            return jsonify({'error': 'Invalid format. Use csv or pdf'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/stock/<ticker>/info')
def get_stock_info(ticker):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        return jsonify({
            'ticker': ticker.upper(),
            'company_name': info.get('longName', 'N/A'),
            'market_cap': info.get('marketCap', 0),
            'sector': info.get('sector', 'N/A'),
            'industry': info.get('industry', 'N/A'),
            'current_price': info.get('currentPrice', 0),
            'previous_close': info.get('previousClose', 0),
            'day_high': info.get('dayHigh', 0),
            'day_low': info.get('dayLow', 0),
            'volume': info.get('volume', 0),
            'pe_ratio': info.get('trailingPE', 0),
            'dividend_yield': info.get('dividendYield', 0)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/stock')
def get_default_stock():
    return get_stock_data('AAPL')

@app.route('/api/stocks/compare')
def compare_stocks():
    try:
        # Get tickers from query parameters (comma-separated)
        tickers_str = request.args.get('tickers', 'AAPL,GOOGL,MSFT')
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        tickers = [ticker.strip().upper() for ticker in tickers_str.split(',')]
        
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        else:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
        
        comparison_data = []
        stock_info = {}
        
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                data = stock.history(start=start_date, end=end_date)
                info = stock.info
                
                if not data.empty:
                    # Store stock info
                    stock_info[ticker] = {
                        'company_name': info.get('longName', ticker),
                        'current_price': info.get('currentPrice', 0),
                        'market_cap': info.get('marketCap', 0)
                    }
                    
                    # Process price data for comparison
                    for date, row in data.iterrows():
                        # Find existing date entry or create new one
                        date_str = date.strftime('%Y-%m-%d')
                        date_entry = next((item for item in comparison_data if item['date'] == date_str), None)
                        
                        if not date_entry:
                            date_entry = {'date': date_str}
                            comparison_data.append(date_entry)
                        
                        date_entry[f'{ticker}_close'] = round(row['Close'], 2)
                        date_entry[f'{ticker}_volume'] = int(row['Volume'])
                        
            except Exception as e:
                print(f"Error fetching data for {ticker}: {str(e)}")
                continue
        
        # Sort by date
        comparison_data.sort(key=lambda x: x['date'])
        
        # Calculate relative performance (normalized to first day = 100)
        if comparison_data:
            first_day = comparison_data[0]
            for ticker in tickers:
                close_key = f'{ticker}_close'
                if close_key in first_day:
                    base_price = first_day[close_key]
                    for day in comparison_data:
                        if close_key in day:
                            day[f'{ticker}_relative'] = round((day[close_key] / base_price) * 100, 2)
        
        return jsonify({
            'tickers': tickers,
            'data': comparison_data,
            'stock_info': stock_info,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/stock/<ticker>/predictions')
def get_stock_predictions(ticker):
    try:
        # Get date range from query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        else:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=90)  # 3 months for better prediction
        
        stock = yf.Ticker(ticker)
        data = stock.history(start=start_date, end=end_date)
        
        if data.empty or len(data) < 10:
            return jsonify({'error': f'Insufficient data for predictions for {ticker}'}), 404
        
        # Prepare data for ML
        dates = np.array(range(len(data))).reshape(-1, 1)
        prices = data['Close'].values
        
        # Linear regression
        linear_model = LinearRegression()
        linear_model.fit(dates, prices)
        linear_predictions = linear_model.predict(dates)
        
        # Polynomial regression (degree 2)
        poly_model = Pipeline([
            ('poly', PolynomialFeatures(degree=2)),
            ('linear', LinearRegression())
        ])
        poly_model.fit(dates, prices)
        poly_predictions = poly_model.predict(dates)
        
        # Future predictions (next 7 days)
        future_dates = np.array(range(len(data), len(data) + 7)).reshape(-1, 1)
        future_linear = linear_model.predict(future_dates)
        future_poly = poly_model.predict(future_dates)
        
        # Calculate percentage changes
        daily_change = data['Close'].pct_change().fillna(0) * 100
        cumulative_change = ((data['Close'] / data['Close'].iloc[0]) - 1) * 100
        
        # Prepare response data
        predictions_data = []
        for i, (date, row) in enumerate(data.iterrows()):
            predictions_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'actual': round(row['Close'], 2),
                'linear_pred': round(linear_predictions[i], 2),
                'poly_pred': round(poly_predictions[i], 2),
                'daily_change': round(daily_change.iloc[i], 2),
                'cumulative_change': round(cumulative_change.iloc[i], 2),
                'volume': int(row['Volume'])
            })
        
        # Future predictions
        future_data = []
        for i, future_date in enumerate(future_dates.flatten()):
            pred_date = end_date + timedelta(days=i+1)
            future_data.append({
                'date': pred_date.strftime('%Y-%m-%d'),
                'linear_pred': round(future_linear[i], 2),
                'poly_pred': round(future_poly[i], 2)
            })
        
        return jsonify({
            'ticker': ticker.upper(),
            'historical_data': predictions_data,
            'future_predictions': future_data,
            'model_stats': {
                'linear_r2': round(linear_model.score(dates, prices), 3),
                'data_points': len(data),
                'prediction_days': 7
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Prediction analysis failed: {str(e)}'}), 500

if __name__ == '__main__':
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
