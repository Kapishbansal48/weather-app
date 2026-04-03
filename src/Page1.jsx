import { useState, useEffect, useRef } from 'react';
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

function Page1({ location }) {
  const [currentData, setCurrentData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [hourlyData, setHourlyData] = useState(null);
  const chartRefs = useRef([]);

  useEffect(() => {
    fetchCurrentData();
  }, [location]);

  const fetchCurrentData = async () => {
    const { lat, lon } = location;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation,visibility,wind_speed_10m,pm10,pm2_5&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max,uv_index_max,precipitation_probability_max&timezone=IST`;
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,carbon_monoxide,carbon_dioxide,nitrogen_dioxide,sulphur_dioxide&timezone=IST`;

    try {
      const [weatherRes, airRes] = await Promise.all([fetch(url), fetch(airQualityUrl)]);
      const weatherData = await weatherRes.json();
      const airData = await airRes.json();
      setCurrentData({ weather: weatherData, air: airData });
    } catch (error) {
      console.error('Error fetching current data:', error);
    }
  };

  const loadHourlyData = async () => {
    const { lat, lon } = location;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${selectedDate}&end_date=${selectedDate}&hourly=temperature_2m,relative_humidity_2m,precipitation,visibility,wind_speed_10m,pm10,pm2_5&timezone=IST`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      setHourlyData(data.hourly);
    } catch (error) {
      console.error('Error fetching hourly data:', error);
    }
  };

  if (!currentData) return <p>Loading current weather...</p>;

  const { weather, air } = currentData;
  const daily = weather.daily;
  const current = weather.current_weather;
  const todayIndex = 0;
  const tempMin = daily.temperature_2m_min[todayIndex];
  const tempMax = daily.temperature_2m_max[todayIndex];
  const tempCurrent = current.temperature;
  const precipitation = daily.precipitation_sum[todayIndex];
  const sunrise = new Date(daily.sunrise[todayIndex]).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  const sunset = new Date(daily.sunset[todayIndex]).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  const windMax = daily.wind_speed_10m_max[todayIndex];
  const humidity = daily.relative_humidity_2m_max[todayIndex];
  const uv = daily.uv_index_max[todayIndex];
  const precipProb = daily.precipitation_probability_max[todayIndex];

  const now = new Date();
  const hour = now.getHours();
  const pm10 = air?.hourly?.pm10?.[hour] ?? 'N/A';
  const pm25 = air?.hourly?.pm2_5?.[hour] ?? 'N/A';
  const co = air?.hourly?.carbon_monoxide?.[hour] ?? 'N/A';
  const co2 = air?.hourly?.carbon_dioxide?.[hour] ?? 'N/A';
  const no2 = air?.hourly?.nitrogen_dioxide?.[hour] ?? 'N/A';
  const so2 = air?.hourly?.sulphur_dioxide?.[hour] ?? 'N/A';

  const weatherItems = [
    `Temperature: Min ${tempMin}°C, Max ${tempMax}°C, Current ${tempCurrent}°C`,
    `Precipitation: ${precipitation} mm`,
    `Sunrise: ${sunrise}`,
    `Sunset: ${sunset}`,
    `Max Wind Speed: ${windMax} km/h`,
    `Relative Humidity: ${humidity}%`,
    `UV Index: ${uv}`,
    `Precipitation Probability Max: ${precipProb}%`,
    ...(pm10 !== 'N/A' ? [`PM10: ${pm10} µg/m³`] : []),
    ...(pm25 !== 'N/A' ? [`PM2.5: ${pm25} µg/m³`] : []),
    ...(co !== 'N/A' ? [`CO: ${co} µg/m³`] : []),
    ...(co2 !== 'N/A' ? [`CO2: ${co2} ppm`] : []),
    ...(no2 !== 'N/A' ? [`NO2: ${no2} µg/m³`] : []),
    ...(so2 !== 'N/A' ? [`SO2: ${so2} µg/m³`] : []),
  ];

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
          unit: 'hour',
          displayFormats: {
            hour: window.innerWidth < 768 ? 'HH:mm' : 'MMM dd, HH:mm',
          },
        },
        ticks: {
          maxTicksLimit: window.innerWidth < 768 ? 6 : 12,
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
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  const charts = hourlyData ? [
    {
      title: 'Temperature (°C)',
      component: Line,
      data: {
        labels: hourlyData.time.map(t => new Date(t)),
        datasets: [{ label: 'Temperature', data: hourlyData.temperature_2m, borderColor: 'rgba(75,192,192,1)', backgroundColor: 'rgba(75,192,192,0.2)' }],
      },
    },
    {
      title: 'Relative Humidity (%)',
      component: Line,
      data: {
        labels: hourlyData.time.map(t => new Date(t)),
        datasets: [{ label: 'Humidity', data: hourlyData.relative_humidity_2m, borderColor: 'rgba(255,99,132,1)', backgroundColor: 'rgba(255,99,132,0.2)' }],
      },
    },
    {
      title: 'Precipitation (mm)',
      component: Bar,
      data: {
        labels: hourlyData.time.map(t => new Date(t)),
        datasets: [{ label: 'Precipitation', data: hourlyData.precipitation, backgroundColor: 'rgba(54,162,235,0.2)', borderColor: 'rgba(54,162,235,1)' }],
      },
    },
    {
      title: 'Visibility (m)',
      component: Line,
      data: {
        labels: hourlyData.time.map(t => new Date(t)),
        datasets: [{ label: 'Visibility', data: hourlyData.visibility, borderColor: 'rgba(153,102,255,1)', backgroundColor: 'rgba(153,102,255,0.2)' }],
      },
    },
    {
      title: 'Wind Speed (km/h)',
      component: Line,
      data: {
        labels: hourlyData.time.map(t => new Date(t)),
        datasets: [{ label: 'Wind Speed', data: hourlyData.wind_speed_10m, borderColor: 'rgba(255,206,86,1)', backgroundColor: 'rgba(255,206,86,0.2)' }],
      },
    },
    ...(hourlyData.pm10 ? [{
      title: 'PM10 (µg/m³)',
      component: Line,
      data: {
        labels: hourlyData.time.map(t => new Date(t)),
        datasets: [{ label: 'PM10', data: hourlyData.pm10, borderColor: 'rgba(75,192,192,1)', backgroundColor: 'rgba(75,192,192,0.2)' }],
      },
    }] : []),
    ...(hourlyData.pm2_5 ? [{
      title: 'PM2.5 (µg/m³)',
      component: Line,
      data: {
        labels: hourlyData.time.map(t => new Date(t)),
        datasets: [{ label: 'PM2.5', data: hourlyData.pm2_5, borderColor: 'rgba(255,99,132,1)', backgroundColor: 'rgba(255,99,132,0.2)' }],
      },
    }] : []),
  ] : [];

  return (
    <div className="page-container">
      <h1 className="page-title">🌤️ Current Weather</h1>
      
      <div className="weather-info">
        <div className="weather-item">
          <div className="weather-item-label">Temperature</div>
          <div className="weather-item-value">{tempCurrent}°C</div>
          <div className="weather-item-unit">Min: {tempMin}°C | Max: {tempMax}°C</div>
        </div>
        
        <div className="weather-item">
          <div className="weather-item-label">Precipitation</div>
          <div className="weather-item-value">{precipitation}</div>
          <div className="weather-item-unit">mm</div>
        </div>
        
        <div className="weather-item">
          <div className="weather-item-label">Sunrise</div>
          <div className="weather-item-value">{sunrise}</div>
        </div>
        
        <div className="weather-item">
          <div className="weather-item-label">Sunset</div>
          <div className="weather-item-value">{sunset}</div>
        </div>
        
        <div className="weather-item">
          <div className="weather-item-label">Wind Speed</div>
          <div className="weather-item-value">{windMax}</div>
          <div className="weather-item-unit">km/h</div>
        </div>
        
        <div className="weather-item">
          <div className="weather-item-label">Humidity</div>
          <div className="weather-item-value">{humidity}</div>
          <div className="weather-item-unit">%</div>
        </div>
        
        <div className="weather-item">
          <div className="weather-item-label">UV Index</div>
          <div className="weather-item-value">{uv}</div>
        </div>
        
        <div className="weather-item">
          <div className="weather-item-label">Precipitation Probability</div>
          <div className="weather-item-value">{precipProb}</div>
          <div className="weather-item-unit">%</div>
        </div>
        
        {pm10 !== 'N/A' && (
          <div className="weather-item">
            <div className="weather-item-label">PM10</div>
            <div className="weather-item-value">{pm10}</div>
            <div className="weather-item-unit">µg/m³</div>
          </div>
        )}
        
        {pm25 !== 'N/A' && (
          <div className="weather-item">
            <div className="weather-item-label">PM2.5</div>
            <div className="weather-item-value">{pm25}</div>
            <div className="weather-item-unit">µg/m³</div>
          </div>
        )}
        
        {co !== 'N/A' && (
          <div className="weather-item">
            <div className="weather-item-label">CO</div>
            <div className="weather-item-value">{co}</div>
            <div className="weather-item-unit">µg/m³</div>
          </div>
        )}
        
        {co2 !== 'N/A' && (
          <div className="weather-item">
            <div className="weather-item-label">CO2</div>
            <div className="weather-item-value">{co2}</div>
            <div className="weather-item-unit">ppm</div>
          </div>
        )}
        
        {no2 !== 'N/A' && (
          <div className="weather-item">
            <div className="weather-item-label">NO2</div>
            <div className="weather-item-value">{no2}</div>
            <div className="weather-item-unit">µg/m³</div>
          </div>
        )}
        
        {so2 !== 'N/A' && (
          <div className="weather-item">
            <div className="weather-item-label">SO2</div>
            <div className="weather-item-value">{so2}</div>
            <div className="weather-item-unit">µg/m³</div>
          </div>
        )}
      </div>
      
      <div className="date-picker">
        <label htmlFor="date-select">📅 Select Date for Hourly Data:</label>
        <input
          type="date"
          id="date-select"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button onClick={loadHourlyData}>📊 Load Hourly Data</button>
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

export default Page1;