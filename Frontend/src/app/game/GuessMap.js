
"use client"
import { useRef, useEffect, useCallback, useMemo } from 'react'
import { GoogleMap } from "@react-google-maps/api"
import styles from "./page.module.css"
const MAP_CENTER = { lat: 40.108252, lng: -88.22699 }

export default function GuessMap({
    isLoaded,
    userGuess,
    onMapClick,
    isExpanded,
    onToggleExpand,
    onSubmitGuess
}) {
    const mapInstanceRef = useRef(null)
    const { updateMarker } = useMapMarker(mapInstanceRef)

    const mapContainerStyle = useMemo(() => ({
        width: isExpanded ? '600px' : '400px',
        height: isExpanded ? '600px' : '400px',
        marginLeft: "200px",
        marginBottom: "15px",
        transition: 'width 0.3s ease, height 0.3s ease'
    }), [isExpanded])

    const buttonStyle = useMemo(() => ({
        width: isExpanded ? '600px' : '400px',
        marginLeft: '200px',
        float: "right",
        transition: "0.3s ease"
    }), [isExpanded])

    const handleMapLoad = useCallback((map) => {
        mapInstanceRef.current = map
        map.setCenter(MAP_CENTER)
        map.setZoom(16)
    }, [])

    const handleMapClick = useCallback((e) => {
        const position = createPosition(e.latLng.lat(), e.latLng.lng())
        updateMarker(position, true)
        onMapClick(position)
    }, [updateMarker, onMapClick])

    useEffect(() => {
        if (mapInstanceRef.current && userGuess) {
            updateMarker(userGuess, false)
        }
    }, [userGuess, updateMarker])

    useEffect(() => {
        if (mapInstanceRef.current) {
            setTimeout(() => {
                window.google?.maps?.event?.trigger(mapInstanceRef.current, 'resize')
            }, 50)
        }
    }, [isExpanded])

    if (!isLoaded) {
        return (
            <div id={styles["guessOverlay"]}>
                <div>Loading map...</div>
                <button onClick={onSubmitGuess}>Submit guess!</button>
            </div>
        )
    }

    return (
        <div id={styles["guessOverlay"]}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                defaultCenter={MAP_CENTER}
                defaultZoom={16}
                onClick={handleMapClick}
                onLoad={handleMapLoad}
                onDblClick={onToggleExpand}
                options={{
                    streetViewControl: false,
                    disableDoubleClickZoom: true,
                    disableDefaultUI: true
                }}
            />
            <button style={buttonStyle} onClick={onSubmitGuess}>
                Submit guess!
            </button>
        </div>
    )
}
function useMapMarker(mapInstanceRef) {
    const markerInstanceRef = useRef(null)

    const updateMarker = useCallback((position, shouldPan = true) => {
        if (!mapInstanceRef.current || !window.google?.maps) return

        if (markerInstanceRef.current) {
            markerInstanceRef.current.setMap(null)
            markerInstanceRef.current = null
        }

        if (position && !isDefaultPosition(position)) {
            markerInstanceRef.current = new window.google.maps.Marker({
                position,
                map: mapInstanceRef.current,
                title: 'Guess position',
                animation: window.google.maps.Animation.DROP
            })

            if (shouldPan) {
                mapInstanceRef.current.panTo(position)
                mapInstanceRef.current.setZoom(18)
            }
        }
    }, [mapInstanceRef])

    return { updateMarker }
}
function createPosition(lat, lng) {
    return { lat, lng }
}

function isDefaultPosition(position) {
    return position?.lat === 0 && position?.lng === 0
}
