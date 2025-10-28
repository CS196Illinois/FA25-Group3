async function initialize2() {
    const location = { lat: getRandomPoint().lat, long: getRandomPoint().long }
    const ControlPosition = await google.maps.importLibrary("core")
    panorama = new google.maps.StreetViewPanorama(
        pano.current,
        {
            position: location,
            pov: {
                heading: 0,
                pitch: 0,
            },
            addressControl: false,
            fullscreenControl: false,
            showRoadLabels: false,
            zoomControl: false,
            panControl: false,
            linksControl: false
        },
    );
    startRound()
}
function test() {
    console.log("hi")
}