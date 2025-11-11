let map;
let selectedBorough = null; //Search within a designated area on the webpage （Cannot occur simultaneously with activePriceRange）
let markers = [];
let boroughPrices = {};
let transactions = [];
let trendChart = null;
let allTransactionsLoaded = false;
let allTransactions = [];
let clusterer = null;
let activePriceRange = null; // Search by price range on the webpage（Cannot occur simultaneously with selectedBorough）



//Map display area      
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

const API_BASE = "http://10.129.111.8:3001";

//Retrieve the average property prices for all boroughs from the database
async function loadPrices() {
  const res = await fetch("http://10.129.111.8:3001/api/borough-prices");
  const data = await res.json();
  data.forEach(item => {
    boroughPrices[norm(item.borough)] = Number(item.avg_price);
  });
  updateMapColors();
}



//Load a single transaction for the specified borough
async function loadTransactions(borough) {
  const res = await fetch(`http://10.129.111.8:3001/api/transactions/${borough}`);
  return await res.json();
}


//Load the five-year price trend for a specified borough
async function loadBoroughTrend(borough) {
  const res = await fetch(`http://10.129.111.8:3001/api/borough-trend/${borough}`);
  return await res.json();
}

//Set heatmap colours for different price ranges
function getColor(price) {
  return price > 800000 ? "#800026" :
    price > 650000 ? "#BD0026" :
      price > 550000 ? "#E31A1C" :
        price > 450000 ? "#FC4E2A" :
          "#FD8D3C";
}


//Call Google Maps
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

  //The boundaries established in accordance with the official administrative divisions of London
  map.data.loadGeoJson("./data/london_boroughs.json", null, features => {
    const boroughNames = [];
    features.forEach(f => {
      const name = f.getProperty("NAME") || f.getProperty("name");
      if (name) boroughNames.push(name);
    });



    //Borough filter
    const list = document.getElementById("boroughList");
    boroughNames.sort().forEach(name => {
      const li = document.createElement("li");
      li.innerHTML = `<a class="dropdown-item borough-item" href="#">${name}</a>`;
      li.querySelector("a").addEventListener("click", (e) => {
        e.preventDefault();
        //When selecting by borough, clear the output of the price filter.
        clearPriceFilterLabel();
        activePriceRange = null;
        focusBorough(name);
        setBoroughDropdownLabel(name);
      });
      list.appendChild(li);
    });


    //Price filter
    document.querySelectorAll(".price-filter").forEach(el => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const min = Number(el.dataset.min);
        const max = Number(el.dataset.max);
        applyPriceFilter(min, max, el.textContent.trim());
      });
    });

    loadPrices();
  });

  //Display borough name and averageprice when hovering over with mouse
  const tooltip = document.getElementById("map-tooltip");
  let mouseMoveListener = null;

  map.data.addListener("mouseover", event => {

    if (selectedBorough) return;

    const name = event.feature.getProperty("name") || event.feature.getProperty("NAME");
    const key = getBoroughKey(name);
    const price = boroughPrices[key];

    //In price filter mode, the area will only be outlined in bold if it falls within the specified price range.
    let doHover = true;
    if (activePriceRange) {
      if (!(typeof price === "number" && price >= activePriceRange.min && price <= activePriceRange.max)) {
        doHover = false;
      }
    }

    if (doHover) {
      map.data.overrideStyle(event.feature, {
        strokeWeight: 3,
        strokeColor: "#00ffff",
        fillOpacity: 0.9
      });
    }

    //Display borough name and averageprice when hovering over with mouse
    const tooltipTemplate = document.getElementById("tooltip-template");
    const tooltipContent = tooltipTemplate.content.cloneNode(true);
    tooltipContent.querySelector(".borough-name").textContent = name;
    tooltipContent.querySelector(".borough-price").textContent =
      typeof price === "number" ? "£" + price.toLocaleString() : "No data";

    tooltip.innerHTML = "";
    tooltip.appendChild(tooltipContent);
    tooltip.style.display = "block";

    if (event.domEvent) {
      const startX = event.domEvent.pageX + 15;
      const startY = event.domEvent.pageY + 15;
      tooltip.style.left = startX + "px";
      tooltip.style.top = startY + "px";
    }

    //Ensure the tooltip refreshes and follows the mouse movement.

    if (mouseMoveListener) {
      google.maps.event.removeListener(mouseMoveListener);
      mouseMoveListener = null;
    }
    mouseMoveListener = map.addListener("mousemove", e => {
      const offsetX = 15, offsetY = 15, tooltipWidth = 180, tooltipHeight = 70;
      let x = e.domEvent.pageX + offsetX;
      let y = e.domEvent.pageY + offsetY;
      if (x + tooltipWidth > window.innerWidth) x = e.domEvent.pageX - tooltipWidth - offsetX;
      if (y + tooltipHeight > window.innerHeight) y = e.domEvent.pageY - tooltipHeight - offsetY;
      tooltip.style.left = x + "px";
      tooltip.style.top = y + "px";
    });
  });

  map.data.addListener("mouseout", event => {
    if (!selectedBorough) map.data.revertStyle(event.feature);
    tooltip.style.display = "none";
  });

  //Select the borough directly on the map and clear the results of the price filter.
  map.data.addListener("click", event => {
    const name = event.feature.getProperty("name") || event.feature.getProperty("NAME");
    if (!name) return;
    activePriceRange = null;
    clearPriceFilterLabel();
    focusBorough(name);
    setBoroughDropdownLabel(name);
  });

  google.maps.event.addListenerOnce(map.data, "addfeature", () => {
    updateMapColors();
  });

  document.getElementById("legend").style.display = "block";
  document.getElementById("goHomeBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

//Uniformly update styles based on the current state (no filtering, price filter, borough filter).
function updateMapColors() {
  map.data.setStyle(feature => {
    const name = feature.getProperty("NAME") || feature.getProperty("name");
    const key = getBoroughKey(name);
    const price = boroughPrices[key] || 0;


    let style = {
      fillColor: getColor(price),
      fillOpacity: 0.75,
      strokeColor: "#ffffff",
      strokeWeight: 1.2
    };

    //In the price filter mode, only boroughs within the specified price range are highlighted.
    if (activePriceRange && !selectedBorough) {
      const inRange = typeof price === "number" &&
        price >= activePriceRange.min && price <= activePriceRange.max;
      style.fillOpacity = inRange ? 0.9 : 0.1;
      style.strokeColor = inRange ? "#00ffff" : "#444";
      style.strokeWeight = inRange ? 2 : 0.5;
    }

    return style;
  });
}

//After selecting a borough: Highlight, zoom in and load transaction points and trend data.
function focusBorough(name) {
  selectedBorough = name;
  let selectedFeature = null;

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

  // Open the left information panel & initialise the chart
  openInfoPanel(name);

  //Move the selected borough to the centre of the right half of the screen.
  if (selectedFeature) {
    const bounds = new google.maps.LatLngBounds();
    processGeometry(selectedFeature.getGeometry(), bounds);

    map.setOptions({ restriction: null });

    setTimeout(() => {
      const infoPanel = document.getElementById("info-panel");
      const panelWidth =
        infoPanel && !infoPanel.classList.contains("collapsed")
          ? infoPanel.offsetWidth
          : 0;

      map.fitBounds(bounds, { top: 40, bottom: 40, left: 40 + panelWidth, right: 40 });

      const maxZoom = 12;
      google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        if (map.getZoom() > maxZoom) map.setZoom(maxZoom);
      });

      const relaxedBounds = { ...londonBounds };
      if (panelWidth > 0) relaxedBounds.west = londonBounds.west - 0.8;

      map.setOptions({ restriction: { latLngBounds: relaxedBounds, strictBounds: false } });
    }, 200);
  }

  // Request backend data
  const apiName = getBoroughKey(name);


  loadTransactions(apiName).then(data => {
    transactions = Array.isArray(data) ? data : [];
    showLocationMarkers();
  });


  loadBoroughTrend(apiName).then(data => {
    updateTrendChart(data);
  });
}


//Reconstruct the shape of the selected borough
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

//The UI interface of the left-hand side panel
const panel = document.getElementById("info-panel");
const toggleBtn = document.getElementById("toggle-panel");
const expandBtn = document.getElementById("expand-btn");

toggleBtn.addEventListener("click", () => {
  panel.classList.add("collapsed");
  toggleBtn.textContent = "→";
  toggleBtn.title = "Open Panel";
  expandBtn.style.display = "block";
});

expandBtn.addEventListener("click", () => {
  panel.classList.remove("collapsed");
  toggleBtn.textContent = "←";
  toggleBtn.title = "Close Panel";
  expandBtn.style.display = "none";
});


//Plot past transaction points on the map
function showLocationMarkers() {

  markers.forEach(marker => marker.setMap(null));
  markers = [];

  transactions.forEach(item => {
    if (!item.latitude || !item.longitude) return;

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

    const typeMap = { D: "Detached", S: "Semi-detached", T: "Terraced", F: "Flat", O: "Other" };
    const typeLabel = typeMap[item.property_type] || item.property_type || "Unknown";


    // Transaction Point Details
    const info = `
      <div style="color:black; font-size:14px; line-height:1.4;">
        <b>£${Number(item.price).toLocaleString()}</b><br>
        Housing Type：  ${typeLabel}<br>
        Location：  ${item.street || ""}, ${item.postcode || ""}<br>
        Date：  ${item.date ? item.date.split(/[ T]/)[0] : "N/A"}
      </div>
    `;
    const popup = new google.maps.InfoWindow({ content: info });
    marker.addListener("click", () => popup.open(map, marker));
    markers.push(marker);
  });
}

//Open the left-hand information panel
function openInfoPanel(boroughName) {
  panel.classList.remove("collapsed");
  toggleBtn.textContent = "←";
  toggleBtn.title = "Close Panel";
  expandBtn.style.display = "none";

  const boroughEl = document.getElementById("panel-borough");
  const priceEl = document.getElementById("panel-price");
  boroughEl.textContent = boroughName;
  const avgPrice = boroughPrices[getBoroughKey(boroughName)] || "N/A";
  priceEl.textContent =
    typeof avgPrice === "number" ? "£" + avgPrice.toLocaleString() : avgPrice;

  const canvas = document.getElementById("priceChart");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    if (trendChart) trendChart.destroy();
    //Initialise trend chart 
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
          fill: true,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: v => "£" + Number(v).toLocaleString() } }
        }
      }
    });
  }
}

//Update Trend Chart (with data)
function updateTrendChart(data) {
  if (!trendChart) return;
  const years = data.map(item => item.year ?? item.Year);
  const prices = data.map(item => Number(item.avg_price ?? item.average_price ?? item.price ?? 0));
  trendChart.data.labels = years;
  trendChart.data.datasets[0].data = prices;
  trendChart.update();
}


function applyPriceFilter(min, max, labelText) {
  map.data.revertStyle();

  activePriceRange = { min, max };

  //Apply price filter, exit Borough mode and close the panel
  selectedBorough = null;
  panel.classList.add("collapsed");
  expandBtn.style.display = "block";
  toggleBtn.textContent = "→";
  markers.forEach(m => m.setMap(null));
  transactions = [];


  setPriceDropdownLabel(labelText);
  clearBoroughDropdownLabel();

  //Return to the original page size
  map.setOptions({ restriction: { latLngBounds: londonBounds, strictBounds: false } });
  map.setZoom(10);
  map.setCenter({ lat: 51.5, lng: -0.1 });


  updateMapColors();
}

//Reset
function resetMap() {
  selectedBorough = null;
  activePriceRange = null;

  map.data.revertStyle();
  updateMapColors();

  map.setZoom(10);
  map.setCenter({ lat: 51.5, lng: -0.1 });

  markers.forEach(m => m.setMap(null));
  transactions = [];

  panel.classList.add("collapsed");
  expandBtn.style.display = "block";
  toggleBtn.textContent = "→";

  map.setOptions({
    restriction: { latLngBounds: londonBounds, strictBounds: false }
  });

  //Clear map status
  clearBoroughDropdownLabel();
  clearPriceFilterLabel();
}



//Dropdown list
function setBoroughDropdownLabel(name) {
  const btn = document.getElementById("boroughDropdown");
  if (btn) btn.textContent = `Borough: ${name}`;
}
function clearBoroughDropdownLabel() {
  const btn = document.getElementById("boroughDropdown");
  if (btn) btn.textContent = "Filter by Borough";
}
function setPriceDropdownLabel(text) {
  const btn = document.getElementById("priceDropdown");
  if (btn) btn.textContent = `Price: ${text}`;
}
function clearPriceFilterLabel() {
  const btn = document.getElementById("priceDropdown");
  if (btn) btn.textContent = "Filter by Price";
}

window.onload = initMap;
