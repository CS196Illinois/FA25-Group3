
"use client"
import { useRef, useState, useEffect, useCallback, React } from 'react'

import Link from 'next/link'
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api"

import { getRandomPoint } from "./test-scripts/randpoint.js"
import styles from "./page.module.css";
// useAudio gives us simple helpers to play short sounds
import { useAudio } from '@/components/AudioProvider';
// import logo from "/logo.png";
// import font from "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400..800&display=swap"
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
    south: -89, east: 40, north: -88, west: 41
}

let timerInterval

const center = {
    lat: 40.1106,
    lng: -88.2073
}

export default function Gameplay() {
    // Pull in audio helpers
    const { playEffect, startMusic, ensureAudio, startScoreAdd, stopScoreAdd } = useAudio();
    const [showScoreScreen, setShowScoreScreen] = useState(false)
    const [score, setScore] = useState()
    const [guessInfo, setGuessInfo] = useState()
    const [currentRound, setCurrentRound] = useState(1)
    const [timerContents, setTimerContents] = useState("2:00")
    const scorebarFillRef = useRef(null)
    const [timerSeconds, setTimerSeconds] = useState(119)
    const [goalPoint, setGoalPoint] = useState(null)
    const [userGuessPosition, setUserGuessPosition] = useState({ lat: 0, lng: 0 })
    const pano = useRef(null)
    const [mapCenter, setMapCenter] = useState(center)
    const [mapZoom, setMapZoom] = useState(16)
    
    const [hasGuessed, setHasGuessed] = useState(false)

    const [map, setMap] = useState(undefined)
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

    useEffect(() => {
        // Do not schedule timer ticks while the score screen is visible
        if (showScoreScreen) return;
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
    }, [timerSeconds, showScoreScreen])
    useEffect(() => {
        if (!isLoaded || !window.google) return
        let point = { lat: getRandomPoint().lat, lng: getRandomPoint().long }
        
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

            if (data.copyright.indexOf("Google") < 1) {
                point = { lat: getRandomPoint().lat, lng: getRandomPoint().long }
                setGoalPoint(point)
                service.getPanorama({ location: point, radius: 1000 }).then(processData)
            }
            setGoalPoint({ lat: data.location.latLng.lat(), lng: data.location.latLng.lng() })
            panorama.setPano(data.location.pano);
            panorama.setVisible(true);
            panorama.setOptions({ zoomControl: true, linksControl: true, addressControl: false, panControl: false, showRoadLabels: false })
        }

    }, [isLoaded])
    // Removed countdown sounds and banner to simplify
    const GuessOverlay = useCallback(() => {
        function handleZoomChanged() {
            setMapZoom(this.getZoom())
        }
        function handlePosChange() {
            setMapCenter({ lat: this.getCenter().lat(), lng: this.getCenter().lng() })
        }
        return (
            <div id={styles["guessOverlay"]}>
                {isLoaded ? (<GoogleMap
                    mapContainerStyle={{ width: '600px', height: '400px', marginBottom: "15px" }}
                    center={mapCenter}
                    zoom={mapZoom}
                    onClick={doThing}
                    onMouseUp={doStupidMapCenterMoveThing}
                    onLoad={(e) => {
                        if (typeof map == "undefined") {
                            setMap(e)
                        }
                    }}
                    onZoomChanged={handleZoomChanged}
                    // onCenterChanged={handlePosChange}
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
                <button style={{ width: "400px", marginLeft: "200px" }} onClick={() => { submitGuess() }}>Submit guess!</button>
            </div >
        )
    }, [isLoaded, userGuessPosition, mapZoom, mapCenter, map])
    function doThing(e) {
        setHasGuessed(true)
        console.log({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        })
        // Play a beep when the player places a guess on the small map
        playEffect()
        // console.log(e)
        setUserGuessPosition({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        })

    }
    function doStupidMapCenterMoveThing(e) {
        console.log({ lat: map.center.lat(), lng: map.center.lng() })
        setHasGuessed(true)

        setMapCenter({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        })
        setUserGuessPosition({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        })
        // Also beep on mouse up in case onClick didn't fire (drag/drop)
        playEffect()
    }
    const UIOverlay = useCallback(() => {
        return (
            <div id={styles["overlay"]}>
                <Link href="/lobby">
                    <img src="./logo.png" style={{ maxHeight: "60px" }} />
                </Link>
                <div id={styles["timer"]}>{timerContents}</div>
                <div id={styles["roundCounter"]}>Round {currentRound}</div>
            </div>
        )
    }, [timerContents, currentRound])

    return (

        <div className={styles.umbrella} style={styles}>
            <div ref={pano} style={{
                width: "100vw",
                height: "100vh"
            }}></div>
            <UIOverlay></UIOverlay>
            <ControlOverlay></ControlOverlay>
            <ScoreScreen show={showScoreScreen}></ScoreScreen>
            <GuessOverlay></GuessOverlay>
            <script src="project-scripts/test.js"></script>

        </div>
    )
    function submitGuess() {
        // Play a beep when submitting a guess
        playEffect()
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
        // Animate score bar + play fill sound
        startScoreAdd()
        barInterval = setInterval(fillGuessBar, 1, scorebarFillRef, stopScoreAdd)
        setScore(effectiveScore + "pts")
        setGuessInfo("You didn't guess!")
        if (hasGuessed) {
            setGuessInfo("Your guess was " + distance.toString().substring(0, distance.toString().indexOf(".") + 3) + "km from the correct location!")
        }

        /*
            -map showing distance between guess and real place
            -score (with slidy bar)
            -round number
            -button to start a new round
        */
    }
    function startRound() {
        // Play a beep when starting the next round
        playEffect()
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
                return
            }
            setGoalPoint({ lat: data.location.latLng.lat(), lng: data.location.latLng.lng() })
            panorama.setPano(data.location.pano);
            panorama.setVisible(true);
            panorama.setOptions({ zoomControl: true, linksControl: true, addressControl: false, panControl: false })
        }
    }

    function ScoreScreen({ show }) {
        if (!show) {
            return (<div style={{ visibility: "hidden", display: "none" }}><canvas id={styles["fillScorebar"]} height="10" width="70" ref={scorebarFillRef}></canvas></div>)
        }
        console.log(goalPoint)
        return (
            <>
                <div id={styles.scoreScreen}>

                    <img src="./logo.png" style={{ maxHeight: "60px", marginRight: "calc(100% - 70px)" }} />
                    {isLoaded ? (<GoogleMap
                        mapContainerStyle={{ width: '75vw', height: '400px', marginLeft: "12.5vw", marginBottom: "10px" }}
                        center={{ lat: (goalPoint.lat + userGuessPosition.lat) / 2, lng: (goalPoint.lng + userGuessPosition.lng) / 2 }}
                        zoom={14}
                        options={{
                            streetViewControl: false,
                        }}
                    >
                        <MarkerF title="HELLO" position={goalPoint}>The place you were supposed to be!</MarkerF>
                        <MarkerF position={userGuessPosition}>Guess position</MarkerF>
                        <PolylineF
                            path={[goalPoint, userGuessPosition]}
                            geodesic={true}
                            options={{
                                strokeColor: "#ff2527",
                                strokeOpacity: 0.75,
                                strokeWeight: 2,

                            }}
                        />
                    </GoogleMap>) : <></>}
                    <div id={styles["roundInformation"]}></div>

                    <div id={styles["scoreBar"]}>
                        <div id={styles["score"]}>{score}</div>
                        <canvas id={styles["fillScorebar"]} height="70" width={window.innerWidth} ref={scorebarFillRef}></canvas>
                        <div id={styles["guessInfo"]}>{guessInfo}</div>
                        <button onClick={startRound}>Start next!</button>
                    </div>
                </div>
            </>
        )
    }
    function zoomIn() {

        if (panorama != undefined) {
            panorama.setZoom(panorama.getZoom() + 1)
        }
    }

    function zoomOut() {
        if (panorama != undefined) {
            panorama.setZoom(panorama.getZoom() - 1)
        }
    }

    function ControlOverlay() {

        return (
            <div id={styles.controlsOverlay}>
                <button id={styles["zoomIn"]} onClick={zoomIn}>+</button>
                <button id={styles["zoomOut"]} onClick={zoomOut}>-</button>
            </div>
        )
    }



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
