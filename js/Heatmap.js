let map;
const londonBounds = {
    north: 51.7,
    south: 51.3,
    west: -0.5,
    east: 0.2
};

// test data
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
    // 
};

//  Colour stage 
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
        streetViewControl: false
    });

    //  Loading Borough GeoJSON
    map.data.loadGeoJson("./data/london_boroughs.json");

    // Set corlour
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

    // init mouse info window
    const infoWindow = new google.maps.InfoWindow();

    map.data.addListener("mouseover", event => {
        const name = event.feature.getProperty("NAME");
        const price = boroughPrices[name] || "No data";

        // Hightlight boundary
        map.data.overrideStyle(event.feature, {
            strokeWeight: 3,
            fillOpacity: 0.9
        });

        // info window
        infoWindow.setContent(`
    <div style="color:#000; font-size:14px; font-weight:bold;">
      ${name}<br>Price: £${price.toLocaleString()}
    </div>
  `);
        infoWindow.setPosition(event.latLng);
        infoWindow.open(map);
    });

    map.data.addListener("mouseout", event => {
        map.data.revertStyle();
        infoWindow.close();
    });

}

window.onload = initMap;