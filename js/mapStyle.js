var greyMap = [
    {

        "featureType": "poi",
        "elementType": "all",
        "stylers": [
            {
                "hue": "#000000"
            },
            {
                "saturation": -100
            },
            {
                "lightness": -100
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "all",
        "stylers": [
            {
                "hue": "#000000"
            },
            {
                "saturation": -100
            },
            {
                "lightness": -100
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "all",
        "stylers": [
            {
                "hue": "#000000"
            },
            {
                "saturation": 0
            },
            {
                "lightness": -100
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [
            {
                "hue": "#ffffff"
            },
            {
                "saturation": -100
            },
            {
                "lightness": 100
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels",
        "stylers": [
            {
                "hue": "#000000"
            },
            {
                "saturation": -100
            },
            {
                "lightness": -100
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "all",
        "stylers": [
            {
                "hue": "#ffffff"
            },
            {
                "saturation": -100
            },
            {
                "lightness": 100
            },
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "hue": "#ffffff"
            },
            {
                "saturation": -100
            },
            {
                "lightness": 100
            },
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "labels",
        "stylers": [
            {
                "hue": "#000000"
            },
            {
                "saturation": 0
            },
            {
                "lightness": -100
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "labels",
        "stylers": [
            {
                "hue": "#000000"
            },
            {
                "saturation": -100
            },
            {
                "lightness": -100
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            {
                "hue": "#bbbbbb"
            },
            {
                "saturation": -100
            },
            {
                "lightness": 26
            },
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [
            {
                "hue": "#dddddd"
            },
            {
                "saturation": -100
            },
            {
                "lightness": -3
            },
            {
                "visibility": "on"
            }
        ]
    }
];

var darkMap = [
    {
        "featureType": "all",
        "elementType": "all",
        "stylers": [
            {
                "invert_lightness": true
            },
            {
                "hue": "#ff1a00"
            },
            {
                "saturation": -100
            },
            {
                "lightness": 33
            },
            {
                "gamma": 0.5
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#2D333C"
            }
        ]
    },
    {
        "elementType": "labels.text",
        "stylers": [
            { "visibility": "off" }
        ]
    },
    {
        "elementType": "labels.icon",
        "stylers": [
            { "visibility": "off" }
        ]
    }
]
var blueMap = [
  { elementType: "geometry", stylers: [{ color: "#0f1c2c" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f1c2c" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a8dadc" }] },

  // road
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a3a50" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#324a6b" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#3b5a7d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ac8ff" }] },

//    Water
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#1b263b" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#8ec1f3" }] },

  // Park
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e3b2f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#66cdaa" }] },

  // Special Place
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#203040" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#9bd1ff" }] },
  { featureType: "poi.school", stylers: [{ visibility: "on" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "on" }] },
  { featureType: "poi.business", stylers: [{ visibility: "on" }] },

  // boundary
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#385b7b" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#d1e4ff" }] },

  // transport
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#28486a" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#a0c4ff" }] },

  // keep SP
  { featureType: "poi", stylers: [{ visibility: "on" }] }
];
