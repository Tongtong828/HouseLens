// START Button interation
document.addEventListener("DOMContentLoaded", () => {
    initMap();
    const startBtn = document.getElementById("startBtn");
    const logo = document.querySelector(".Logo");
    startBtn.addEventListener("click", () => {
        document.getElementById("intro").style.display = "none";
        startBtn.style.display = "none";   // Hide Button
        logo.style.display = "none";
        window.location.href = "./heatmap.html";
        addMarkers();
    });
});

// Only London
function initMap() {
    const londonBounds = {
        north: 51.7,
        south: 51.3,
        west: -0.5,
        east: 0.2
    };

    var mapOptions = {
        center: { lat: 51.5, lng: -0.00 },
        zoom: 9,
        maxZoom: 18,   // Don't forget the comma on this line
        restriction: { latLngBounds: londonBounds, strictBounds: false },
        styles: blueMap
        // center: new google.maps.LatLng(51.514756, -0.104345),
        // zoom: 14			
    };

    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
}
