// Unit definitions
const units = {
  length: {
    name: 'Length',
    units: [
      { id: 'km', name: 'Kilometers', symbol: 'km', toBase: 1000 },
      { id: 'm', name: 'Meters', symbol: 'm', toBase: 1 },
      { id: 'cm', name: 'Centimeters', symbol: 'cm', toBase: 0.01 },
      { id: 'mm', name: 'Millimeters', symbol: 'mm', toBase: 0.001 },
      { id: 'mi', name: 'Miles', symbol: 'mi', toBase: 1609.344 },
      { id: 'yd', name: 'Yards', symbol: 'yd', toBase: 0.9144 },
      { id: 'ft', name: 'Feet', symbol: 'ft', toBase: 0.3048 },
      { id: 'in', name: 'Inches', symbol: 'in', toBase: 0.0254 },
    ]
  },
  weight: {
    name: 'Weight',
    units: [
      { id: 'kg', name: 'Kilograms', symbol: 'kg', toBase: 1 },
      { id: 'g', name: 'Grams', symbol: 'g', toBase: 0.001 },
      { id: 'mg', name: 'Milligrams', symbol: 'mg', toBase: 0.000001 },
      { id: 'lb', name: 'Pounds', symbol: 'lb', toBase: 0.453592 },
      { id: 'oz', name: 'Ounces', symbol: 'oz', toBase: 0.0283495 },
      { id: 'ton', name: 'Metric Tons', symbol: 't', toBase: 1000 },
    ]
  },
  temp: {
    name: 'Temperature',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C' },
      { id: 'f', name: 'Fahrenheit', symbol: '°F' },
      { id: 'k', name: 'Kelvin', symbol: 'K' },
    ],
    convert: (value, from, to) => {
      // Convert to Celsius first
      let celsius;
      if (from === 'c') celsius = value;
      else if (from === 'f') celsius = (value - 32) * 5/9;
      else if (from === 'k') celsius = value - 273.15;
      
      // Convert from Celsius to target
      if (to === 'c') return celsius;
      else if (to === 'f') return celsius * 9/5 + 32;
      else if (to === 'k') return celsius + 273.15;
    }
  },
  volume: {
    name: 'Volume',
    units: [
      { id: 'l', name: 'Liters', symbol: 'L', toBase: 1 },
      { id: 'ml', name: 'Milliliters', symbol: 'mL', toBase: 0.001 },
      { id: 'gal', name: 'Gallons (US)', symbol: 'gal', toBase: 3.78541 },
      { id: 'qt', name: 'Quarts (US)', symbol: 'qt', toBase: 0.946353 },
      { id: 'pt', name: 'Pints (US)', symbol: 'pt', toBase: 0.473176 },
      { id: 'cup', name: 'Cups (US)', symbol: 'cup', toBase: 0.236588 },
      { id: 'floz', name: 'Fluid Ounces', symbol: 'fl oz', toBase: 0.0295735 },
    ]
  },
  currency: {
    name: 'Currency',
    units: [
      { id: 'USD', name: 'US Dollar', symbol: '$' },
      { id: 'EUR', name: 'Euro', symbol: '€' },
      { id: 'GBP', name: 'British Pound', symbol: '£' },
      { id: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { id: 'KRW', name: 'Korean Won', symbol: '₩' },
      { id: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { id: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { id: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { id: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
      { id: 'MXN', name: 'Mexican Peso', symbol: '$' },
    ],
    rates: {} // Will be fetched
  }
};

// Current state
let currentCategory = 'length';
let exchangeRates = null;
let lastRateUpdate = null;

// DOM elements
const fromUnit = document.getElementById('from-unit');
const toUnit = document.getElementById('to-unit');
const fromValue = document.getElementById('from-value');
const toValue = document.getElementById('to-value');
const swapBtn = document.getElementById('swap-btn');
const quickGrid = document.getElementById('quick-grid');
const rateInfo = document.getElementById('rate-info');
const rateText = document.getElementById('rate-text');
const rateUpdate = document.getElementById('rate-update');

// Initialize tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelector('.tab.active').classList.remove('active');
    tab.classList.add('active');
    currentCategory = tab.dataset.category;
    loadCategory(currentCategory);
  });
});

// Load category
function loadCategory(category) {
  const cat = units[category];
  
  // Clear and populate selects
  fromUnit.innerHTML = '';
  toUnit.innerHTML = '';
  
  cat.units.forEach((unit, i) => {
    const opt1 = new Option(`${unit.name} (${unit.symbol})`, unit.id);
    const opt2 = new Option(`${unit.name} (${unit.symbol})`, unit.id);
    fromUnit.add(opt1);
    toUnit.add(opt2);
  });
  
  // Default selections
  if (cat.units.length >= 2) {
    fromUnit.value = cat.units[0].id;
    toUnit.value = cat.units[1].id;
  }
  
  // Load saved selections
  const saved = localStorage.getItem(`converter_${category}`);
  if (saved) {
    const { from, to } = JSON.parse(saved);
    if (from) fromUnit.value = from;
    if (to) toUnit.value = to;
  }
  
  // Show/hide rate info
  rateInfo.style.display = category === 'currency' ? 'block' : 'none';
  
  // Fetch exchange rates if needed
  if (category === 'currency' && !exchangeRates) {
    fetchExchangeRates();
  }
  
  // Clear values and update
  fromValue.value = '';
  toValue.value = '';
  updateQuickGrid();
}

// Convert value
function convert() {
  const value = parseFloat(fromValue.value);
  if (isNaN(value)) {
    toValue.value = '';
    return;
  }
  
  const from = fromUnit.value;
  const to = toUnit.value;
  const cat = units[currentCategory];
  
  let result;
  
  if (currentCategory === 'temp') {
    result = cat.convert(value, from, to);
  } else if (currentCategory === 'currency') {
    if (!exchangeRates) {
      toValue.value = 'Loading...';
      return;
    }
    const fromRate = exchangeRates[from];
    const toRate = exchangeRates[to];
    result = (value / fromRate) * toRate;
  } else {
    const fromDef = cat.units.find(u => u.id === from);
    const toDef = cat.units.find(u => u.id === to);
    const baseValue = value * fromDef.toBase;
    result = baseValue / toDef.toBase;
  }
  
  // Format result
  if (Math.abs(result) >= 1000000) {
    toValue.value = result.toExponential(4);
  } else if (Math.abs(result) < 0.0001 && result !== 0) {
    toValue.value = result.toExponential(4);
  } else {
    toValue.value = parseFloat(result.toPrecision(8));
  }
  
  // Save selections
  localStorage.setItem(`converter_${currentCategory}`, JSON.stringify({
    from: fromUnit.value,
    to: toUnit.value
  }));
  
  updateQuickGrid();
}

// Fetch exchange rates
async function fetchExchangeRates() {
  try {
    rateText.textContent = 'Loading rates...';
    
    const response = await fetch('https://api.frankfurter.app/latest?from=USD');
    const data = await response.json();
    
    exchangeRates = { USD: 1, ...data.rates };
    lastRateUpdate = new Date();
    
    updateRateInfo();
    convert();
  } catch (error) {
    console.error('Failed to fetch rates:', error);
    rateText.textContent = 'Failed to load rates';
  }
}

// Update rate info
function updateRateInfo() {
  if (!exchangeRates) return;
  
  const from = fromUnit.value;
  const to = toUnit.value;
  const rate = (exchangeRates[to] / exchangeRates[from]).toFixed(4);
  
  rateText.textContent = `1 ${from} = ${rate} ${to}`;
  rateUpdate.textContent = `Updated: ${lastRateUpdate.toLocaleTimeString()}`;
}

// Update quick grid
function updateQuickGrid() {
  const value = parseFloat(fromValue.value) || 1;
  const from = fromUnit.value;
  const cat = units[currentCategory];
  
  // Get 4 common conversions
  const quickUnits = cat.units.filter(u => u.id !== from).slice(0, 4);
  
  quickGrid.innerHTML = quickUnits.map(unit => {
    let result;
    
    if (currentCategory === 'temp') {
      result = cat.convert(value, from, unit.id);
    } else if (currentCategory === 'currency') {
      if (!exchangeRates) return '';
      const fromRate = exchangeRates[from];
      const toRate = exchangeRates[unit.id];
      result = (value / fromRate) * toRate;
    } else {
      const fromDef = cat.units.find(u => u.id === from);
      const baseValue = value * fromDef.toBase;
      result = baseValue / unit.toBase;
    }
    
    const formatted = Math.abs(result) >= 10000 
      ? result.toExponential(2) 
      : parseFloat(result.toPrecision(6));
    
    return `
      <div class="quick-item">
        <div class="quick-label">${unit.symbol}</div>
        <div class="quick-value">${formatted}</div>
      </div>
    `;
  }).join('');
}

// Swap units
swapBtn.addEventListener('click', () => {
  const tempUnit = fromUnit.value;
  const tempValue = toValue.value;
  
  fromUnit.value = toUnit.value;
  toUnit.value = tempUnit;
  fromValue.value = tempValue;
  
  convert();
});

// Event listeners
fromValue.addEventListener('input', convert);
fromUnit.addEventListener('change', () => {
  convert();
  if (currentCategory === 'currency') updateRateInfo();
});
toUnit.addEventListener('change', () => {
  convert();
  if (currentCategory === 'currency') updateRateInfo();
});

// Initialize
loadCategory('length');

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('SW registered'))
    .catch(err => console.log('SW failed:', err));
}
