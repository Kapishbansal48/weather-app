import { useState, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin
);

function Page2({ location }) {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [historicalData, setHistoricalData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const chartRefs = useRef([]);

  const loadHistoricalData = async () => {
    const { lat, lon } = location;
    const weatherUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant&timezone=IST`;
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=pm10,pm2_5&timezone=IST`;

    try {
      const [weatherRes, airRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(airQualityUrl)
      ]);
      const weatherData = await weatherRes.json();
      const airData = await airRes.json();
      
      setHistoricalData(weatherData.daily);
      setAirQualityData(airData.daily);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: window.innerWidth < 768 ? 12 : 14,
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        titleFont: {
          size: window.innerWidth < 768 ? 14 : 16,
        },
        bodyFont: {
          size: window.innerWidth < 768 ? 12 : 14,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          threshold: 10,
          modifierKey: null, // Allow pan without modifier key
        },
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1,
          },
          pinch: {
            enabled: true, // Enable pinch-to-zoom for mobile
          },
          drag: {
            enabled: true,
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderColor: 'rgba(54, 162, 235, 0.3)',
            borderWidth: 1,
          },
          mode: 'x',
          limits: {
            x: { min: 'original', max: 'original' },
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: window.innerWidth < 768 ? 'MMM dd' : 'MMM dd, yyyy',
          },
        },
        ticks: {
          maxTicksLimit: window.innerWidth < 768 ? 5 : 10,
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        beginAtZero: false,
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    elements: {
      point: {
        radius: window.innerWidth < 768 ? 2 : 3,
        hoverRadius: window.innerWidth < 768 ? 4 : 6,
      },
      line: {
        borderWidth: window.innerWidth < 768 ? 1.5 : 2,
      },
      bar: {
        borderWidth: window.innerWidth < 768 ? 1 : 2,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  const charts = historicalData ? [
    {
      title: 'Temperature (°C)',
      component: Line,
      data: {
        labels: historicalData.time.map(t => new Date(t)),
        datasets: [
          { label: 'Mean Temp', data: historicalData.temperature_2m_mean, borderColor: 'rgba(75,192,192,1)', backgroundColor: 'rgba(75,192,192,0.2)' },
          { label: 'Max Temp', data: historicalData.temperature_2m_max, borderColor: 'rgba(255,99,132,1)', backgroundColor: 'rgba(255,99,132,0.2)' },
          { label: 'Min Temp', data: historicalData.temperature_2m_min, borderColor: 'rgba(54,162,235,1)', backgroundColor: 'rgba(54,162,235,0.2)' },
        ],
      },
    },
    {
      title: 'Sunrise & Sunset (Hours)',
      component: Line,
      data: {
        labels: historicalData.time.map(t => new Date(t)),
        datasets: [
          { label: 'Sunrise', data: historicalData.sunrise.map(t => { const d = new Date(t); return d.getHours() + d.getMinutes() / 60; }), borderColor: 'rgba(255,206,86,1)', backgroundColor: 'rgba(255,206,86,0.2)' },
          { label: 'Sunset', data: historicalData.sunset.map(t => { const d = new Date(t); return d.getHours() + d.getMinutes() / 60; }), borderColor: 'rgba(153,102,255,1)', backgroundColor: 'rgba(153,102,255,0.2)' },
        ],
      },
    },
    {
      title: 'Precipitation (mm)',
      component: Bar,
      data: {
        labels: historicalData.time.map(t => new Date(t)),
        datasets: [{ label: 'Precipitation', data: historicalData.precipitation_sum, backgroundColor: 'rgba(54,162,235,0.2)', borderColor: 'rgba(54,162,235,1)' }],
      },
    },
    {
      title: 'Wind',
      component: Line,
      data: {
        labels: historicalData.time.map(t => new Date(t)),
        datasets: [
          { label: 'Max Wind Speed', data: historicalData.wind_speed_10m_max, borderColor: 'rgba(75,192,192,1)', backgroundColor: 'rgba(75,192,192,0.2)' },
          { label: 'Dominant Wind Direction', data: historicalData.wind_direction_10m_dominant, borderColor: 'rgba(255,99,132,1)', backgroundColor: 'rgba(255,99,132,0.2)' },
        ],
      },
    },
    ...(airQualityData ? [{
      title: 'Air Quality',
      component: Line,
      data: {
        labels: airQualityData.time.map(t => new Date(t)),
        datasets: [
          { label: 'PM10', data: airQualityData.pm10, borderColor: 'rgba(75,192,192,1)', backgroundColor: 'rgba(75,192,192,0.2)' },
          { label: 'PM2.5', data: airQualityData.pm2_5, borderColor: 'rgba(255,99,132,1)', backgroundColor: 'rgba(255,99,132,0.2)' },
        ],
      },
    }] : [])
  ] : [];

  return (
    <div className="page-container">
      <h1 className="page-title">📈 Historical Weather Data</h1>
      
      <div className="date-picker">
        <label htmlFor="start-date">📅 Start Date:</label>
        <input
          type="date"
          id="start-date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label htmlFor="end-date">📅 End Date:</label>
        <input
          type="date"
          id="end-date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button onClick={loadHistoricalData}>📊 Load Historical Data</button>
      </div>
      
      <div className="charts">
        {charts.map((chart, index) => (
          <div key={index} className="chart-container">
            <div className="chart-header">
              <h3>{chart.title}</h3>
              <div className="chart-controls">
                <button
                  className="zoom-reset-btn"
                  onClick={() => {
                    const chartRef = chartRefs.current[index];
                    if (chartRef && chartRef.chartInstance) {
                      chartRef.chartInstance.resetZoom();
                    }
                  }}
                  title="Reset Zoom"
                >
                  🔄 Reset
                </button>
              </div>
            </div>
            <div className="chart-wrapper">
              <chart.component
                ref={(ref) => {
                  if (ref) {
                    chartRefs.current[index] = ref;
                  }
                }}
                data={chart.data}
                options={chartOptions}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Page2;