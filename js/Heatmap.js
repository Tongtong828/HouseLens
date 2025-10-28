let map;
let selectedBorough = null; // selected area
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

  // set tooltip content
  tooltip.innerHTML = `
    <strong style="font-size:16px;">${name}</strong><br>
    <span style="color:#4fb0ff; font-weight:600;">£${price.toLocaleString()}</span>
  `;
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



// Reset Map
function resetMap() {
  selectedBorough = null; // clear selected map
  map.data.revertStyle();
  map.setZoom(10);
  map.setCenter({ lat: 51.5, lng: -0.1 });
}

window.onload = initMap;
