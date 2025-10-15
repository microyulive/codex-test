const form = document.getElementById('weather-form');
const cityInput = document.getElementById('city');
const statusEl = document.getElementById('status');
const resultSection = document.getElementById('result');
const resetBtn = document.getElementById('reset-btn');

const resultCity = document.getElementById('result-city');
const temperatureEl = document.getElementById('temperature');
const apparentTemperatureEl = document.getElementById('apparent-temperature');
const windSpeedEl = document.getElementById('wind-speed');
const windDirectionEl = document.getElementById('wind-direction');
const humidityEl = document.getElementById('humidity');
const weatherDescriptionEl = document.getElementById('weather-description');
const observationTimeEl = document.getElementById('observation-time');

const weatherCodeMap = new Map([
  [[0], '晴朗'],
  [[1, 2, 3], '多云'],
  [[45, 48], '有雾'],
  [[51, 53, 55], '毛毛雨'],
  [[56, 57], '冻雨'],
  [[61, 63, 65], '小到大雨'],
  [[66, 67], '冻雨'],
  [[71, 73, 75], '小到大雪'],
  [[77], '雪粒'],
  [[80, 81, 82], '阵雨'],
  [[85, 86], '阵雪'],
  [[95], '雷阵雨'],
  [[96, 99], '雷阵雨伴冰雹'],
]);

function getWeatherDescription(code) {
  for (const [codes, description] of weatherCodeMap.entries()) {
    if (codes.includes(code)) {
      return description;
    }
  }
  return '未知天气';
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function clearResult() {
  resultSection.hidden = true;
  resultCity.textContent = '';
  temperatureEl.textContent = '';
  apparentTemperatureEl.textContent = '';
  windSpeedEl.textContent = '';
  windDirectionEl.textContent = '';
  humidityEl.textContent = '';
  weatherDescriptionEl.textContent = '';
  observationTimeEl.textContent = '';
}

async function fetchWeather(city) {
  setStatus(`正在查询 “${city}” 的天气，请稍候...`);
  clearResult();

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`
    );

    if (!geoRes.ok) {
      throw new Error('地理编码服务暂时不可用');
    }

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      setStatus(`未找到 “${city}” 的相关城市，请尝试其他拼写。`, true);
      return;
    }

    const location = geoData.results[0];
    const { latitude, longitude, name, country, timezone } = location;

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto`
    );

    if (!weatherRes.ok) {
      throw new Error('天气服务暂时不可用');
    }

    const weatherData = await weatherRes.json();
    const { current } = weatherData;

    if (!current) {
      setStatus('未获取到天气数据，请稍后重试。', true);
      return;
    }

    temperatureEl.textContent = Math.round(current.temperature_2m);
    apparentTemperatureEl.textContent = Math.round(current.apparent_temperature);
    windSpeedEl.textContent = current.wind_speed_10m.toFixed(1);
    windDirectionEl.textContent = Math.round(current.wind_direction_10m);
    humidityEl.textContent = current.relative_humidity_2m;
    weatherDescriptionEl.textContent = getWeatherDescription(current.weather_code);

    const displayName = country ? `${name}, ${country}` : name;
    resultCity.textContent = displayName;

    const observedTime = new Date(current.time);
    observationTimeEl.textContent = observedTime.toLocaleString('zh-CN', {
      hour12: false,
      timeZone: timezone || weatherData.timezone,
    });

    resultSection.hidden = false;
    setStatus('查询成功！');
  } catch (error) {
    console.error(error);
    setStatus(error.message || '查询过程中出现问题，请稍后再试。', true);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    setStatus('请输入要查询的城市名称。', true);
    return;
  }
  fetchWeather(city);
});

resetBtn.addEventListener('click', () => {
  cityInput.value = '';
  cityInput.focus();
  setStatus('');
  clearResult();
});

cityInput.addEventListener('input', () => {
  if (statusEl.textContent) {
    setStatus('');
  }
});
