/*
TO DO FOR ME:
MAKE THE ZOOM WORK

*/






"use client"
import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { GoogleMap, MarkerF, LoadScript, StreetViewPanorama, useJsApiLoader } from "@react-google-maps/api"

import { getRandomPoint } from "./test-scripts/randpoint.js"
import styles from "./page.module.css";
import { useAudio } from '@/components/AudioProvider';
let canvasMapWidth
let panorama
let fillTicks = 0
let barInterval
let fillTicksAcc = 0
let effectiveScore
let maxRounds = 3
let pinPosition = {
    lat: 0,
    lng: 0
}

const CAMPUS_MAP_BOUNDS = {
    north: 40.2,
    south: 40.0,
    east: -88.1,
    west: -88.3
}

const MAP_CENTER = { lat: 40.1106, lng: -88.2073 }
const MAX_ROUNDS = 3
const MAX_SCORE = 5000
const INITIAL_TIMER_SECONDS = 119
const GOOGLE_MAPS_LIBRARIES = ['places']
const GOOGLE_MAPS_API_KEY = "AIzaSyAsEYGOKBJHsMyWQ4QvAqAmI_BQm7vxpAk"

const SCORE_BAR_CONFIG = {
    LINE_WIDTH: 50,
    LINE_Y: 35,
    LEFT_MARGIN: 0.1,
    RIGHT_MARGIN: 0.9,
    TICK_MULTIPLIER: 3,
    ACCELERATION: 0.01,
    WIDTH_RATIO: 0.8,
    OFFSET: 30
}

const SCORE_BAR_COLORS = {
    background: "#3e5ab3",
    track: "#5b6369",
    fill: "#cd870e"
}

const DEFAULT_POSITION = { lat: 0, lng: 0 }
const TIMER_WARNING_SECONDS = 30
const TIMER_TICK_SECONDS = 10

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + 
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const MAX_DISTANCE_IN_BOUNDS = calculateDistance(
    CAMPUS_MAP_BOUNDS.south, CAMPUS_MAP_BOUNDS.west,
    CAMPUS_MAP_BOUNDS.north, CAMPUS_MAP_BOUNDS.east
)

function formatTimer(seconds) {
    const minutes = Math.floor(seconds / 60)
    const secs = (seconds % 60).toString().padStart(2, "0")
    return `${minutes}:${secs}`
}

function calculateScore(distance, maxDistance = MAX_DISTANCE_IN_BOUNDS) {
    const normalizedDistance = Math.min(distance / maxDistance, 1)
    return Math.max(0, Math.floor(MAX_SCORE * (1 - normalizedDistance)))
}

function getMapZoom(distance) {
    if (distance > 5) return 12
    if (distance > 1) return 14
    return 16
}

function getMapCenter(goalPoint, guessPoint) {
    const hasValidGuess = guessPoint && !isDefaultPosition(guessPoint)
    if (!hasValidGuess) return goalPoint || MAP_CENTER
    
    return {
        lat: (goalPoint.lat + guessPoint.lat) / 2,
        lng: (goalPoint.lng + guessPoint.lng) / 2
    }
}

function isDefaultPosition(position) {
    return position?.lat === 0 && position?.lng === 0
}

function createPosition(lat, lng) {
    return { lat, lng }
}

function formatDistanceText(distance, hasGuess) {
    const distanceStr = distance.toFixed(2)
    return hasGuess 
        ? `Your guess was ${distanceStr}km from the correct location!`
        : `No guess placed! Distance: ${distanceStr}km`
}

function useStreetViewPanorama(isLoaded, panoramaRef) {
    const [goalPoint, setGoalPoint] = useState(null)
    const [userGuessPosition, setUserGuessPosition] = useState({ lat: 0, lng: 0 })
    const pano = useRef(null)
    const [visible, setVisible] = useState(false)
    const [mapCenter, setMapCenter] = useState(center)
    const [map, setMap] = useState()
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyAsEYGOKBJHsMyWQ4QvAqAmI_BQm7vxpAk",
        libraries: ['places']
    })
    useEffect(() => {
        // Initialize audio and attempt to start background music
        ensureAudio();
        startMusic();
    }, [ensureAudio, startMusic]);
    // Keep a stable ref to playEffect so using it doesn't affect effects' deps
    const playEffectRef = useRef(playEffect)
    useEffect(() => { playEffectRef.current = playEffect }, [playEffect])

    useEffect(() => {
        timerInterval = setInterval(() => {
            setTimerSeconds(timerSeconds - 1)
            setTimerContents(Math.floor(timerSeconds / 60) + ":" + ("" + (timerSeconds % 60)).padStart(2, "0"))
            if (timerSeconds == 0) {
                clearInterval(timerInterval)
                submitGuess()
            }
        }, 1000)

        return () => {
            clearInterval(timerInterval)
        }
    }, [timerSeconds])
    useEffect(() => {
        if (!isLoaded || !window.google) return
        let point = { lat: getRandomPoint().lat, lng: getRandomPoint().long }
        console.log(point)
        setGoalPoint(point)

        panorama = new window.google.maps.StreetViewPanorama(pano.current)
        const service = new google.maps.StreetViewService()
        service.getPanorama({ location: point, radius: 1000 }).then(processData)


        /*, {
            position: { lat: point.lat, lng: point.long },
            pov: { heading: 100, pitch: 0 },
            zoom: 1,
            // preference: StreetViewPreference.NEAREST,
            disableDefaultUI: true,
            enableCloseButton: false,
            addressControl: false,
            radius: 100}0,
            linksControl: true,
            panControl: false,
        }) */
        function processData({ data }) {
            console.log(data)

            if (data.copyright.indexOf("Google") < 1) {
                point = { lat: getRandomPoint().lat, lng: getRandomPoint().long }
                setGoalPoint(point)
                service.getPanorama({ location: point, radius: 1000 }).then(processData)
            }
            panorama.setPano(data.location.pano);
            panorama.setVisible(true);
            panorama.setOptions({ zoomControl: false, linksControl: true, addressControl: false, panControl: false, showRoadLabels: false })
        }

    }, [isLoaded])
    // Play a soft tick each second during the last 10 seconds
    useEffect(() => {
        if (showScoreScreen) return; // no ticking once guess submitted
        if (timerSeconds > 0 && timerSeconds <= 10) {
            playEffectRef.current?.("tick")
        }
    }, [timerSeconds, showScoreScreen])
    // One-time warning tick at 30 seconds remaining
    useEffect(() => {
        if (showScoreScreen) return;
        if (timerSeconds === 30) {
            playEffectRef.current?.("tick")
        }
    }, [timerSeconds, showScoreScreen])
    const GuessOverlay = useCallback(() => {
        return (
            <div id={styles["guessOverlay"]}>
                {isLoaded ? (<GoogleMap
                    mapContainerStyle={{ width: '400px', height: '400px', marginBottom: "15px" }}
                    center={mapCenter}
                    zoom={16}
                    onClick={doThing}
                    onLoad={(e) => {
                        if (!map) {
                            setMap(e)
                        }
                    }}
                    onCenterChanged={() => {
                        if (typeof map == "undefined") {
                            setMapCenter(center)
                            return
                        }
                        setMapCenter({ lat: map.getCenter().lat(), lng: map.getCenter().lng() })
                    }}
                    options={{
                        streetViewControl: false,
                        // restriction: {
                        //     latLngBounds: CAMPUS_MAP_BOUNDS,
                        //     strictBounds: false,
                        // }
                    }}
                ><MarkerF position={userGuessPosition}>Guess position</MarkerF>
                </GoogleMap>) : <></>
                }
                <button onClick={() => { submitGuess() }}>Submit guess!</button>
            </div >
        )
    }, [isLoaded, userGuessPosition, affectCenter])
    function doThing(e) {
        // Play a beep when the player places a guess on the small map
        playEffect("place")
        // console.log(e)
        setUserGuessPosition({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        })
        setVisible(true)
        setMapCenter({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        })
    }
    const UIOverlay = useCallback(() => {
        return (<div id={styles["overlay"]}>
            <Link href="./">
                <img src="./logo.png" style={{ maxHeight: "60px" }} />
            </Link>
            <div id={styles["timer"]}>{timerContents}</div>
            <div id={styles["roundCounter"]}>Round {currentRound}</div>
        </div>)
    }, [timerContents, currentRound])

function ControlOverlay({ onZoomIn, onZoomOut }) {
    return (
        <div id={styles.controlsOverlay}>
            <button id={styles["zoomIn"]} onClick={onZoomIn}>+</button>
            <button id={styles["zoomOut"]} onClick={onZoomOut}>-</button>
        </div>
    )
    function submitGuess() {
        // Play a beep when submitting a guess
        playEffect("submit")
        setShowScoreScreen(true)
        //calculate score
        canvasMapWidth = window.innerWidth
        scorebarFillRef.current["width"] = window.innerWidth
        let distance = 0
        // let distance = Math.sqrt(Math.pow(currentRoundData.guess.lat - currentRoundData.point.lat, 2) + Math.pow(currentRoundData.guess.long - currentRoundData.point.long, 2))

        // score = 5000 * (1 - (Math.PI * distance * distance) / (1))
        effectiveScore = 4700


        clearInterval(timerInterval)
        clearInterval(barInterval)
        //display score screen
        setCurrentRound(currentRound + 1)
        // document.getElementById
        //score screen has: 
        fillTicks = 0
        fillTicksAcc = 0
        // Start score counting sfx and animate score bar
        startScoreAdd()
        barInterval = setInterval(fillGuessBar, 1, scorebarFillRef, stopScoreAdd)
        setScore(effectiveScore + "pts")
        setGuessInfo("Your guess was " + distance.toString().substring(0, distance.toString().indexOf(".") + 3) + "km from the correct location!")
        /*
            -map showing distance between guess and real place
            -score (with slidy bar)
            -round number
            -button to start a new round
        */
    }
    function startRound() {
        // Play a beep when starting the next round
        playEffect("place")
        // // if (currentRound > maxRounds) {
        // //     finalScore()
        // //     return
        // // }
        // // timerSeconds = 121
        let pt = { lat: getRandomPoint().lat, lng: getRandomPoint().long }

        setGoalPoint(pt)
        console.log("Goal Point: " + goalPoint)
        const service = new google.maps.StreetViewService()
        service.getPanorama({ location: pt, radius: 1000 }).then(processData)
        // // updateTimer()
        setTimerSeconds(119)
        setTimerContents("2:00")

        setShowScoreScreen(false)
        function processData({ data }) {
            console.log(data)
            pt = { lat: getRandomPoint().lat, lng: getRandomPoint().long }

            if (data.copyright.indexOf("Google") < 1) {
                service.getPanorama({ location: pt, radius: 1000 }).then(processData)
            }
            setGoalPoint(pt)
            panorama.setPano(data.location.pano);
            panorama.setVisible(true);
            panorama.setOptions({ zoomControl: false, linksControl: true, addressControl: false, panControl: false })
        }
    }

    function ScoreScreen({ show }) {
        // When the score screen becomes visible, play a short chime
        useEffect(() => {
            if (show) {
                playEffect("score");
            }
        }, [show]);
        if (!show) {
        return (
            <div style={{ visibility: "hidden", display: "none" }}>
                <canvas 
                    id={styles["fillScorebar"]} 
                    height="10" 
                    width="70" 
                    ref={scorebarRef}
                />
            </div>
        )
        }
        
    const distance = guessPoint && !isDefaultPosition(guessPoint)
        ? calculateDistance(guessPoint.lat, guessPoint.lng, goalPoint.lat, goalPoint.lng)
        : 0

    const mapCenter = getMapCenter(goalPoint, guessPoint)
    const mapZoom = getMapZoom(distance)
        
        return (
                <div id={styles.scoreScreen}>

                    <img src="./logo.png" style={{ maxHeight: "60px", marginRight: "calc(100% - 70px)" }} />
                    {isLoaded ? (<GoogleMap
                        mapContainerStyle={{ width: '75vw', height: '400px', marginLeft: "12.5vw", marginBottom: "10px" }}
                        center={center}
                        zoom={16}
                        options={{
                            streetViewControl: false,
                        }}
                    >
                        <MarkerF title="HELLO" position={goalPoint}>The place you were supposed to be!</MarkerF>
                        <MarkerF position={userGuessPosition}>Guess position</MarkerF>
                    </GoogleMap>) : <></>}
                    <div id={styles["roundInformation"]}></div>
                    <div id={styles["scoreBar"]}>
                        <div id={styles["score"]}>{score}</div>
                <canvas 
                    id={styles["fillScorebar"]} 
                    height="70" 
                    width={window.innerWidth} 
                    ref={scorebarRef}
                />
                        <div id={styles["guessInfo"]}>{guessInfo}</div>
                <button onClick={handleButtonClick}>
                    {isGameComplete ? "Return to profile page" : "Start next!"}
                </button>
                </div>
            </>
        )
    }



}


function ControlOverlay() {
    return (
        <div id={styles.controlsOverlay}>
            <button id={styles["zoomIn"]} onClick={zoomIn()}>+</button>
            <button id={styles["zoomOut"]} onClick={zoomOut()}>-</button>
        </div>
    )
}

function zoomIn() {

}

function zoomOut() {

}

function pano() {

}
function fillGuessBar(bar, stopScoreAddFn) {
    canvasMapWidth = window.innerWidth
    bar = bar.current.getContext("2d")
    if (fillTicks > ((((.8 * canvasMapWidth) / 3) * (effectiveScore / 5000)) - 30)) {
        try { if (typeof stopScoreAddFn === 'function') stopScoreAddFn() } catch {}
        clearInterval(barInterval)
    }
    fillTicks += 1 + fillTicksAcc
    fillTicksAcc += 0.01
    bar.fillStyle = "#3e5ab3"
    bar.fillRect(0, 0, canvasMapWidth, 50)

    bar.beginPath()
    bar.lineWidth = 50
    bar.strokeStyle = "#5b6369"
    bar.lineCap = "round"
    bar.moveTo((.1 * canvasMapWidth), 35)
    bar.lineTo((.9 * canvasMapWidth), 35)
    bar.stroke()


    bar.beginPath()
    bar.lineWidth = 50
    bar.strokeStyle = "#cd870e"
    bar.lineCap = "round"
    bar.moveTo(.1 * canvasMapWidth, 35)
    bar.lineTo((.1 * canvasMapWidth) + (fillTicks * 3), 35)
    bar.stroke()

}
