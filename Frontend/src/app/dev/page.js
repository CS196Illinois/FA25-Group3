"use client"
import { useEffect } from "react";
import { Loader } from "@googlemaps/js-api-loader";

function MyMap() {
  useEffect(() => {
    const loader = new Loader({
      apiKey: "AIzaSyAsEYGOKBJHsMyWQ4QvAqAmI_BQm7vxpAk",
      version: "weekly",
      libraries: ['maps'],
    });

    loader.load().then(() => {
      const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 12,
        mapId: "YOUR_MAP_ID", // needed for AdvancedMarkerElement
      });

      const position = { lat: 37.7749, lng: -122.4194 };
      const title = "San Francisco";
      const i = 0;

      const pin = new google.maps.marker.PinElement();

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map,
        title: `${i + 1}. ${title}`,
        content: pin.element,
        gmpClickable: true,
      });
    });
  }, []);

  return <div id="map" style={{ width: "100%", height: "500px" }} />;
}

export default MyMap;
