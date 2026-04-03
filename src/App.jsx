import { useState, useEffect } from 'react';
import Page1 from './Page1';
import Page2 from './Page2';
import './App.css';

function App() {
  const [activePage, setActivePage] = useState('page1');
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Loading...');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(loc);
          // Try to get location name
          try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${loc.lat}&longitude=${loc.lon}&localityLanguage=en`);
            const data = await response.json();
            setLocationName(`${data.city || data.locality || 'Unknown'}, ${data.countryName || ''}`);
          } catch {
            setLocationName('Your Location');
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation({ lat: 28.6139, lon: 77.2090 }); // Default to Delhi
          setLocationName('Delhi, India');
        }
      );
    } else {
      setLocation({ lat: 28.6139, lon: 77.2090 });
      setLocationName('Delhi, India');
    }
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="app-title">🌤️ Weather Dashboard</h1>
          <div className="location-info">
            <span className="location-icon">📍</span>
            <span>{locationName}</span>
          </div>
        </div>
      </header>
      
      <nav className="dashboard-nav">
        <div className="nav-container">
          <button
            className={`nav-button ${activePage === 'page1' ? 'active' : ''}`}
            onClick={() => setActivePage('page1')}
          >
            <span className="nav-icon">📊</span>
            Current Weather
          </button>
          <button
            className={`nav-button ${activePage === 'page2' ? 'active' : ''}`}
            onClick={() => setActivePage('page2')}
          >
            <span className="nav-icon">📈</span>
            Historical Data
          </button>
        </div>
      </nav>
      
      <main className="dashboard-main">
        {location ? (
          activePage === 'page1' ? (
            <Page1 location={location} />
          ) : (
            <Page2 location={location} />
          )
        ) : (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Getting your location...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;