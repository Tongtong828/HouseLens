let map;
let selectedBorough = null; // selected area
let markers = []; 
const londonBounds = {
  north: 51.75,
  south: 51.2,
  west: -0.6,
  east: 0.3
};

// test price
const boroughPrices = {
  "Camden": 650000,
  "Islington": 610000,
  "Hackney": 580000,
  "Newham": 460000,
  "Bexley": 370000,
  "Croydon": 400000,
  "Ealing": 520000,
  "Kensington and Chelsea": 1000000,
  "Westminster": 950000,
  "Bromley": 450000
};


// Test deal
const transactions = [
  {
    id: 1,
    borough: "Camden",
    lat: 51.529,
    lng: -0.125,
    price: 650000,
    date: "2023-06-10",
    type: "Flat",
    postcode: "NW1 8YJ"
  },
  {
    id: 2,
    borough: "Croydon",
    lat: 51.372,
    lng: -0.102,
    price: 450000,
    date: "2023-05-25",
    type: "Semi-Detached",
    postcode: "CR0 6SD"
  },
  {
    id: 3,
    borough: "Ealing",
    lat: 51.512,
    lng: -0.305,
    price: 520000,
    date: "2023-08-12",
    type: "Detached",
    postcode: "W5 3TA"
  },
  {
    id: 4,
    borough: "Islington",
    lat: 51.545,
    lng: -0.105,
    price: 610000,
    date: "2023-07-15",
    type: "Terraced",
    postcode: "N1 2TP"
  }
];
// ===========================
// 📊 信息栏控制逻辑
// ===========================

// 假设有历史价格数据（未来你可以接数据库）
const boroughTrends = {
  "Camden": [520000, 540000, 570000, 600000, 650000],
  "Islington": [480000, 500000, 530000, 560000, 610000],
  "Hackney": [420000, 450000, 490000, 540000, 580000],
  "Croydon": [320000, 340000, 370000, 400000, 450000],
  "Ealing": [400000, 430000, 460000, 490000, 520000],
  "Westminster": [820000, 860000, 890000, 920000, 950000]
};

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
  });

  // couloured area
  map.data.setStyle(feature => {
    const name = feature.getProperty("name") || feature.getProperty("NAME");
    const price = boroughPrices[name] || 200000;
    return {
      fillColor: getColor(price),
      fillOpacity: 0.75,
      strokeColor: "#ffffff",
      strokeWeight: 1.2
    };
  });

  // Tooltip
  const tooltip = document.getElementById("map-tooltip");
  let mouseMoveListener = null; // activate mousemove 

  map.data.addListener("mouseover", event => {
    if (selectedBorough) return;

    // Get name price
    const name = event.feature.getProperty("name") || event.feature.getProperty("NAME");
    const price = boroughPrices[name] || "No data";

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

  // transaction icon
  const infoWindow = new google.maps.InfoWindow();

  // Store all marker
  // const markers = [];
  markers = [];

  // Iteration + add marker
  transactions.forEach((item) => {
    const marker = new google.maps.Marker({
      position: { lat: item.lat, lng: item.lng },
      map: map,
      title: item.borough,
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        scaledSize: new google.maps.Size(30, 30)
      }
    });

    // record Borough
    marker.borough = item.borough;
    markers.push(marker);

    // Icon Info window
    marker.addListener("click", () => {
      const template = document.getElementById("info-template");
      const content = template.content.cloneNode(true);

      // Get data(test)
      content.querySelector(".borough").textContent = item.borough;
      content.querySelector(".type").textContent = item.type;
      content.querySelector(".price").textContent = item.price.toLocaleString();
      content.querySelector(".date").textContent = item.date;
      content.querySelector(".postcode").textContent = item.postcode;

      const wrapper = document.createElement("div");
      wrapper.appendChild(content);

      infoWindow.setContent(wrapper.innerHTML);
      infoWindow.open({
        anchor: marker,
        map,
        shouldFocus: false
      });
    });

  });


}

// Highlight selected area
function focusBorough(name) {
  selectedBorough = name;
  let selectedFeature = null;

  // Reset map
  map.data.forEach(feature => {
    const fName = feature.getProperty("NAME") || feature.getProperty("name");
    const price = boroughPrices[fName] || 200000;

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

  // Only show seleted icon
  markers.forEach(m => {
    if (m.borough === name) {
      m.setMap(map);
    } else {
      m.setMap(null);
    }
  });
  openInfoPanel(name);

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
  const avgPrice = boroughPrices[boroughName] || "N/A";
  priceEl.textContent = "£" + avgPrice.toLocaleString();

  // Open Panel
  panel.classList.add("open");

  // Get canvas
  const canvas = document.getElementById("priceChart");
  const ctx = canvas.getContext("2d");

  // Clear last chart
  if (window.priceChart && typeof window.priceChart.destroy === "function") {
    window.priceChart.destroy();
  }

  // Change
  const years = ["2019", "2020", "2021", "2022", "2023"];
  const trend = boroughTrends[boroughName] || [0, 0, 0, 0, 0];

  //Create new line chart
  window.priceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: years,
      datasets: [{
        label: "Average Price (£)",
        data: trend,
        borderColor: "#007bff",
        backgroundColor: "rgba(0,123,255,0.2)",
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
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


function resetMap() {
  selectedBorough = null;
  map.data.revertStyle();
  map.setZoom(10);
  map.setCenter({ lat: 51.5, lng: -0.1 });
  markers.forEach(m => m.setMap(map));
  closeInfoPanel();
  panel.classList.add("collapsed");
  expandBtn.style.display = "block";
  toggleBtn.textContent = "⮞";
  toggleBtn.title = "Open Panel";

}

window.onload = initMap;
