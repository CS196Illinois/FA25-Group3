"use client"
import { useRef, useState, useEffect, useCallback, React } from 'react'

import Link from 'next/link'
import { GoogleMap, MarkerF, LoadScript, StreetViewPanorama, useJsApiLoader } from "@react-google-maps/api"

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
let affectCenter = true
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
            return (<div style={{ visibility: "hidden", display: "none" }}><canvas id={styles["fillScorebar"]} height="10" width="70" ref={scorebarFillRef}></canvas></div>)
        }
        console.log(goalPoint)
        return (
            <>
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
                        <canvas id={styles["fillScorebar"]} height="70" width={window.innerWidth} ref={scorebarFillRef}></canvas>
                        <div id={styles["guessInfo"]}>{guessInfo}</div>
                        <button onClick={startRound}>Start next!</button>
                    </div>
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
