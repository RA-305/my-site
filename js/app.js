// Weather widget: uses Open-Meteo API (no API key required)
(function () {
  const el = document.getElementById('weather');

  function emojiForCode(code) {
    // Map Open-Meteo weather codes to emojis
    if (code === 0) return '☀️';
    if ([1,2].includes(code)) return '🌤️';
    if (code === 3) return '☁️';
    if ([45,48].includes(code)) return '🌫️';
    if ([51,53,55,56,57].includes(code)) return '🌦️';
    if ([61,63,65,80,81,82].includes(code)) return '🌧️';
    if ([66,67].includes(code)) return '🌨️';
    if ([71,73,75,77,85,86].includes(code)) return '❄️';
    if ([95,96,99].includes(code)) return '⛈️';
    return '🌈';
  }

  function render(current, daily) {
    const emoji = emojiForCode(current.weathercode);
    const temp = Math.round(current.temperature);
    const desc = (current.weathercode === 0) ? 'Clear' : 'Current';

    // Build 5-day forecast HTML
    let forecastHTML = '';
    if (daily && daily.time && daily.time.length) {
      const count = Math.min(5, daily.time.length);
      for (let i = 0; i < count; i++) {
        const date = new Date(daily.time[i]);
        const day = date.toLocaleDateString(undefined, { weekday: 'short' });
        const wcode = daily.weathercode ? daily.weathercode[i] : null;
        const em = wcode != null ? emojiForCode(wcode) : '•';
        const tmax = daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[i]) : '';
        const tmin = daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[i]) : '';
        forecastHTML += `
          <div class="forecast-day">
            <div class="fd-day">${day}</div>
            <div class="fd-emoji">${em}</div>
            <div class="fd-temps">${tmax}° / ${tmin}°</div>
          </div>
        `;
      }
    }

    el.innerHTML = `
      <div class="weather-top">
        <div style="display:inline-flex;gap:.9rem;align-items:center;">
          <span class="weather-emoji">${emoji}</span>
          <span class="weather-temp">
            <span>${temp}°F</span>
            <span class="weather-desc">${desc}</span>
          </span>
        </div>
        <div class="separator" aria-hidden="true"></div>
        <div class="forecast" aria-hidden="false">${forecastHTML}</div>
      </div>
    `;
  }

  function showError(msg) {
    el.innerHTML = `<span style="opacity:.9">${msg}</span>`;
  }

  function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`;
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('Weather fetch failed');
        return r.json();
      })
      .then(json => {
        if (json && json.current_weather) {
          render(json.current_weather, json.daily);
        } else {
          showError('No weather data');
        }
      })
      .catch(() => showError('Weather unavailable'));
  }

  // Fallback: approximate location from IP when geolocation is unavailable/denied
  function fetchByIP() {
    fetch('https://ipapi.co/json/')
      .then(r => {
        if (!r.ok) throw new Error('IP lookup failed');
        return r.json();
      })
      .then(json => {
        if (json && json.latitude != null && json.longitude != null) {
          fetchWeather(json.latitude, json.longitude);
        } else {
          showError('Weather unavailable');
        }
      })
      .catch(() => showError('Weather unavailable'));
  }

  if (!navigator.geolocation) {
    fetchByIP();
  } else {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        fetchWeather(latitude, longitude);
      },
      () => {
        // Permission denied, blocked (e.g. file://), or timed out — use IP fallback
        fetchByIP();
      },
      { maximumAge: 10 * 60 * 1000, timeout: 10000 }
    );
  }
})();
