let map;
let selectedBorough = null; // selected area
let markers = [];
let boroughPrices = {};   // Store AvgPrice
let transactions = [];    // Store transactions data
let trendChart = null;
let allTransactionsLoaded = false;
let allTransactions = [];
let clusterer = null;

const londonBounds = {
  north: 51.75,
  south: 51.2,
  west: -0.6,
  east: 0.3
};

function norm(s) {
  return String(s || '').toUpperCase().replace(/\s+/g, ' ').trim();
}

function getBoroughKey(name) {
  const n = norm(name);
  if (n === "WESTMINSTER") return "CITY OF WESTMINSTER";
  return n;
}

async function loadPrices() {
  const res = await fetch("http://localhost:3001/api/borough-prices");
  const data = await res.json();

  data.forEach(item => {
    boroughPrices[norm(item.borough)] = Number(item.avg_price);
  });
  console.log("Loaded boroughs:", Object.keys(boroughPrices).length);
  updateMapColors();
}

async function loadTransactions(borough) {
  const res = await fetch(`http://localhost:3001/api/transactions/${borough}`);
  return await res.json();
}

async function loadBoroughTrend(borough) {
  const res = await fetch(`http://localhost:3001/api/borough-trend/${borough}`);
  return await res.json();
}
// colour list
function getColor(price) {
  return price > 800000 ? "#800026" :
    price > 650000 ? "#BD0026" :
      price > 550000 ? "#E31A1C" :
        price > 450000 ? "#FC4E2A" :
          price > 350000 ? "#FD8D3C" :
            price > 250000 ? "#FEB24C" :
              price > 150000 ? "#FED976" :
                "#FFEDA0";
}


function initMap() {
  map = new google.maps.Map(document.getElementById("map-canvas"), {
    center: { lat: 51.5, lng: -0.1 },
    zoom: 10,
    minZoom: 9,
    maxZoom: 18,
    restriction: { latLngBounds: londonBounds, strictBounds: false },
    styles: blueMap,
    mapTypeControl: false,
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
    scaleControl: true
  });

  // load GeoJSON Data
  map.data.loadGeoJson("./data/london_boroughs.json", null, features => {
    const boroughNames = [];
    features.forEach(f => {
      const name = f.getProperty("NAME") || f.getProperty("name");
      if (name) boroughNames.push(name);
    });

    // dropdown list
    const list = document.getElementById("boroughList");
    boroughNames.sort().forEach(name => {
      const li = document.createElement("li");
      li.innerHTML = `<a class="dropdown-item" href="#">${name}</a>`;
      li.onclick = () => focusBorough(name);
      list.appendChild(li);
    });
    loadPrices();
  });

  // Tooltip
  const tooltip = document.getElementById("map-tooltip");
  let mouseMoveListener = null; // activate mousemove 

  map.data.addListener("mouseover", event => {
    if (selectedBorough) return;

    // Get name price
    const name = event.feature.getProperty("name") || event.feature.getProperty("NAME");
    const price = boroughPrices[getBoroughKey(name)] || "No data";



    // Highlight borough
    map.data.overrideStyle(event.feature, {
      strokeWeight: 3,
      strokeColor: "#00ffff",
      fillOpacity: 0.9
    });

    // get tooltip content
    const tooltipTemplate = document.getElementById("tooltip-template");
    const tooltipContent = tooltipTemplate.content.cloneNode(true);
    tooltipContent.querySelector(".borough-name").textContent = name;
    tooltipContent.querySelector(".borough-price").textContent = "£" + price.toLocaleString();

    // Clear tooltip
    tooltip.innerHTML = "";
    tooltip.appendChild(tooltipContent);

    // show tooltip
    tooltip.style.display = "block";

    tooltip.style.display = "block";

    if (event.domEvent) {
      const startX = event.domEvent.pageX + 15;
      const startY = event.domEvent.pageY + 15;
      tooltip.style.left = startX + "px";
      tooltip.style.top = startY + "px";
    }

    // avoid repeat listener
    if (mouseMoveListener) {
      google.maps.event.removeListener(mouseMoveListener);
      mouseMoveListener = null;
    }
    // let tooltip follow mouse
    mouseMoveListener = map.addListener("mousemove", e => {
      const offsetX = 15;
      const offsetY = 15;

      // tooltip size
      const tooltipWidth = 180;
      const tooltipHeight = 70;

      let x = e.domEvent.pageX + offsetX;
      let y = e.domEvent.pageY + offsetY;

      // too R/L, move to high left
      if (x + tooltipWidth > window.innerWidth) {
        x = e.domEvent.pageX - tooltipWidth - offsetX;
      }
      if (y + tooltipHeight > window.innerHeight) {
        y = e.domEvent.pageY - tooltipHeight - offsetY;
      }

      tooltip.style.left = x + "px";
      tooltip.style.top = y + "px";
    });
  });

  // Click to load marker
  map.data.addListener("click", event => {
    const name = event.feature.getProperty("name") || event.feature.getProperty("NAME");
    if (!name) return;

    focusBorough(name);  // Automatic load markers + panel
  });

  map.data.addListener("mouseout", event => {
    // reset style
    if (!selectedBorough) {
      map.data.revertStyle(event.feature);
    }

    // Hide tooltip
    tooltip.style.display = "none";

    // remove
    if (mouseMoveListener) {
      google.maps.event.removeListener(mouseMoveListener);
      mouseMoveListener = null;
    }
  });


  // Store all marker
  markers = [];

  google.maps.event.addListenerOnce(map.data, "addfeature", () => {
    updateMapColors();
  });

  map.addListener("zoom_changed", async () => {
    const z = map.getZoom();

    if (z >= 15) {
      // Load all markers once
      if (!allTransactionsLoaded) {
        const res = await fetch("http://localhost:3001/api/transactions");
        allTransactions = await res.json();
        allTransactionsLoaded = true;

        // Show all markers on map
        transactions = allTransactions;
        showLocationMarkers();
      } else {
        // markers already loaded, just show them
        markers.forEach(m => m.setMap(map));
      }
    } else {
      // Zoom out -> hide markers unless borough selected
      if (!selectedBorough) {
        markers.forEach(m => m.setMap(null));
      }
    }
  });
// Ensure legend is visible
document.getElementById("legend").style.display = "block";
document.getElementById("goHomeBtn").addEventListener("click", () => {
  window.location.href = "Homepage.html";
});


}


function updateMapColors() {
  map.data.setStyle(feature => {
    const name = feature.getProperty("NAME") || feature.getProperty("name");
    const price = boroughPrices[getBoroughKey(name)] || 0;

    return {
      fillColor: getColor(price),
      fillOpacity: 0.75,
      strokeColor: "#ffffff",
      strokeWeight: 1.2
    };
  });
}



// Highlight selected area
function focusBorough(name) {
  selectedBorough = name;
  let selectedFeature = null;

  // Reset map
  map.data.forEach(feature => {
    const fName = feature.getProperty("NAME") || feature.getProperty("name");
    const price = boroughPrices[getBoroughKey(fName)] || 200000;


    if (fName === name) {
      selectedFeature = feature;
      map.data.overrideStyle(feature, {
        fillColor: getColor(price),
        fillOpacity: 0.9,
        strokeColor: "#00ffff",
        strokeWeight: 3
      });
    } else {
      map.data.overrideStyle(feature, {
        fillColor: getColor(price),
        fillOpacity: 0.2,
        strokeColor: "#333",
        strokeWeight: 0.5
      });
    }
  });
  if (selectedFeature) {
    const bounds = new google.maps.LatLngBounds();
    processGeometry(selectedFeature.getGeometry(), bounds);
    map.setOptions({ restriction: null });
    map.fitBounds(bounds, { top: 30, bottom: 30, left: 30, right: 30 });
    setTimeout(() => {
      map.panTo(bounds.getCenter());
      map.setOptions({
        restriction: { latLngBounds: londonBounds, strictBounds: false }
      });
    }, 800);
  }
  markers.forEach(m => m.setMap(null));
  // Only show seleted icon
  markers.forEach(m => {
    if (m.borough === name) {
      m.setMap(map);
    } else {
      m.setMap(null);
    }
  });
  openInfoPanel(name);

  loadTransactions(name).then(data => {
    transactions = Array.isArray(data) ? data : [];
    showLocationMarkers();
  });

  loadBoroughTrend(name).then(data => {
    updateTrendChart(data);
  });
}

// Analysis GeoJSON 
function processGeometry(geometry, bounds) {
  if (geometry.getType() === "Polygon") {
    geometry.getArray().forEach(path => {
      path.getArray().forEach(latlng => bounds.extend(latlng));
    });
  } else if (geometry.getType() === "MultiPolygon") {
    geometry.getArray().forEach(polygon => processGeometry(polygon, bounds));
  } else if (geometry.getType() === "GeometryCollection") {
    geometry.getArray().forEach(g => processGeometry(g, bounds));
  }
}

// Price Filter
const priceFilterButtons = document.querySelectorAll(".price-filter");

priceFilterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const min = Number(btn.dataset.min);
    const max = Number(btn.dataset.max);

    // Clear Selected borough
    selectedBorough = null;
    // map.data.revertStyle();

    // Hide panel
    panel.classList.add("collapsed");
    expandBtn.style.display = "block";

    // Hight selected borough
    map.data.setStyle(feature => {
      const name = feature.getProperty("NAME") || feature.getProperty("name");
      const price = boroughPrices[getBoroughKey(name)] || 0;
      const match = price >= min && price <= max;

      return {
        fillColor: getColor(price),
        fillOpacity: match ? 0.9 : 0.15,
        strokeColor: match ? "#00ffff" : "#333",
        strokeWeight: match ? 3 : 1
      };
    });
    // Show markers that match price
    markers.forEach(marker => {
      marker.setMap(marker.price >= min && marker.price <= max ? map : null);
    });
  });
});

function updateTrendChart(data) {
  if (!trendChart) return;

  const years = data.map(item => item.year);
  const prices = data.map(item => Number(item.avg_price));

  trendChart.data.labels = years;
  trendChart.data.datasets[0].data = prices;
  trendChart.update();
}


// Open Panel
function openInfoPanel(boroughName) {
  const panel = document.getElementById("info-panel");
  const boroughEl = document.getElementById("panel-borough");
  const priceEl = document.getElementById("panel-price");

  // Change
  panel.classList.remove("collapsed");
  toggleBtn.textContent = "⮜";
  toggleBtn.title = "Close Panel";

  // Update title and average price
  boroughEl.textContent = boroughName;
  const avgPrice = boroughPrices[getBoroughKey(boroughName)] || "N/A";

  priceEl.textContent = "£" + avgPrice.toLocaleString();


  // Get canvas
  const canvas = document.getElementById("priceChart");
  const ctx = canvas.getContext("2d");

  // Clear last chart
  if (window.priceChart && typeof window.priceChart.destroy === "function") {
    window.priceChart.destroy();
  }

  // Destroy previous chart
  if (trendChart) trendChart.destroy();

  // Create empty chart first, real data will fill after API returns
  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Average Price (£)",
        data: [],
        borderColor: "#007bff",
        backgroundColor: "rgba(0,123,255,0.2)",
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: false,
          ticks: { callback: v => "£" + v.toLocaleString() }
        }
      }
    }
  });

}

// Left info panel
const panel = document.getElementById("info-panel");
const toggleBtn = document.getElementById("toggle-panel");
const expandBtn = document.getElementById("expand-btn");

// Click to close button
toggleBtn.addEventListener("click", () => {
  panel.classList.add("collapsed");
  toggleBtn.textContent = "⮞";
  toggleBtn.title = "Open Panel";
  expandBtn.style.display = "block";
});

// Click to open button
expandBtn.addEventListener("click", () => {
  panel.classList.remove("collapsed");
  toggleBtn.textContent = "⮜";
  toggleBtn.title = "Close Panel";
  expandBtn.style.display = "none"; // Close button
});

function showLocationMarkers() {
  // Clear old marker
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  transactions.forEach(item => {
    if (!item.latitude || !item.longitude) return;

    const dateStr = item.date ? item.date.split(/[ T]/)[0] : "N/A";

    const marker = new google.maps.Marker({
      position: { lat: Number(item.latitude), lng: Number(item.longitude) },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5,
        fillColor: "#ff4d4d",
        strokeColor: "#ffffff",
        strokeWeight: 1,
        fillOpacity: 0.9
      }
    });

const typeMap = {
  D: "Detached ",
  S: "Semi-detached ",
  T: "Terraced ",
  F: "Flat ",
  O: "Other "
};
const typeLabel = typeMap[item.property_type] || item.property_type || "Unknown";

    const info = `
  <div style="color:black; font-size:14px; line-height:1.4;">
    <b>£${Number(item.price).toLocaleString()}</b><br>
    🏠 ${typeLabel}<br>
    📍 ${item.street || ""}, ${item.postcode}<br>
    🕒 ${dateStr}
  </div>
`;

    const popup = new google.maps.InfoWindow({ content: info });
    marker.addListener("click", () => popup.open(map, marker));

    marker.borough = selectedBorough;
    markers.push(marker);

  });
}
function resetMap() {
  selectedBorough = null;

  map.data.revertStyle();
  updateMapColors();

  map.setZoom(10);
  map.setCenter({ lat: 51.5, lng: -0.1 });

  markers.forEach(m => m.setMap(null));

  transactions = [];

  panel.classList.add("collapsed");
  expandBtn.style.display = "block";
  toggleBtn.textContent = "⮞";
}


window.onload = initMap;
