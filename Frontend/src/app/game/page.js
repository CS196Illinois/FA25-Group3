"use client"
import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
// import { APIProvider, Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import { GoogleMap, MarkerF, LoadScript, StreetViewPanorama, useJsApiLoader } from "@react-google-maps/api";
import { AdvancedMarker } from '@vis.gl/react-google-maps';

import styles from "./page.module.css";
import SettingsModal from '@/components/SettingsModal';
import { getRandomPoint } from "./test-scripts/randpoint.mjs";
// import logo from "/logo.png";
// import font from "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400..800&display=swap"
let canvasMapWidth
let fillTicks = 0
let barInterval
let fillTicksAcc = 0
let effectiveScore
let maxRounds = 3

let timerInterval

const center = {
    lat: 40.1106,
    lng: -88.2073
}

export default function Gameplay() {
    const [showScoreScreen, setShowScoreScreen] = useState(false)
    const [score, setScore] = useState()
    const [guessInfo, setGuessInfo] = useState()
    const [currentRound, setCurrentRound] = useState(1)
    const [timerContents, setTimerContents] = useState("2:00")
    const scorebarFillRef = useRef(null)
    const [timerSeconds, setTimerSeconds] = useState(119)
    const [goalPoint, setGoalPoint] = useState(getRandomPoint)
    const pano = useRef(null)

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyAsEYGOKBJHsMyWQ4QvAqAmI_BQm7vxpAk",
        libraries: ['places']
    })

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
        let point = getRandomPoint()
        console.log(point)
        const panorama = new window.google.maps.StreetViewPanorama(pano.current, {
            position: { lat: point.lat, lng: point.long, radius: 100 },
            pov: { heading: 100, pitch: 0 },
            zoom: 1,
            disableDefaultUI: true,
            enableCloseButton: false,
            addressControl: false,
            linksControl: true,
            panControl: false
        })
    }, [isLoaded])

    const GuessOverlay = useCallback(() => {
        {
            const [marker, setMarker] = useState(null);

            const handleMapClick = useCallback((event) => {
                const lat = event.latLng.lat();
                const lng = event.latLng.lng();
                setMarker({ lat, lng });
            }, []);
        }
        return (
            <div id={styles["guessOverlay"]}>
                {isLoaded ? (<GoogleMap
                    mapContainerStyle={{ width: '400px', height: '400px' }}
                    center={center}
                    zoom={16}
                    options={{
                        streetViewControl: false,
                    }}
                >      {marker && <MarkerF position={marker} title="You clicked here!" />}

                </GoogleMap>) : <></>}
                <button onClick={() => { submitGuess() }}>Submit guess!</button>
            </div>
        )
    }, [isLoaded, center])

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
            <SettingsModal />
            <GuessOverlay></GuessOverlay>
            <script src="project-scripts/test.js"></script>

        </div>
    )
    function submitGuess() {
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
        barInterval = setInterval(fillGuessBar, 1, scorebarFillRef)
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
        // // if (currentRound > maxRounds) {
        // //     finalScore()
        // //     return
        // // }
        // // timerSeconds = 121
        // // updateTimer()
        setTimerSeconds(119)
        setTimerContents("2:00")

        setShowScoreScreen(false)

        const pin = new google.maps.marker.PinElement();
        const marker = new google.maps.marker.AdvancedMarkerElement({
            position,
            map,
            title,
            content: pin.element,
            gmpClickable: true,
        });
    }

    function ScoreScreen({ show }) {
        if (!show) {
            return (<div style={{ visibility: "hidden", display: "none" }}><canvas id={styles["fillScorebar"]} height="10" width="70" ref={scorebarFillRef}></canvas></div>)
        }
        return (
            <>
                <SettingsModal />
                <div id={styles.scoreScreen}>
                    <img src="./logo.png" style={{ maxHeight: "60px", marginRight: "calc(100% - 70px)" }} />
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
function fillGuessBar(bar) {
    canvasMapWidth = window.innerWidth
    bar = bar.current.getContext("2d")
    if (fillTicks > ((((.8 * canvasMapWidth) / 3) * (effectiveScore / 5000)) - 30)) {
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