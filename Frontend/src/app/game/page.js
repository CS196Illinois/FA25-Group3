
"use client"
import { useRef, useState, useEffect, useCallback, React } from 'react'

import Link from 'next/link'
import { GoogleMap, MarkerF, LoadScript, StreetViewPanorama, PolylineF, useJsApiLoader } from "@react-google-maps/api"

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
    const [mapZoom, setMapZoom] = useState(16)
    const [streetviewZoom, setStreetviewZoom] = useState(10)
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
    // Keep a stable ref to playEffect so using it doesn't affect effects' deps
    const playEffectRef = useRef(playEffect)
    useEffect(() => { playEffectRef.current = playEffect }, [playEffect])

    useEffect(() => {
        timerInterval = setInterval(() => {
            setTimerSeconds(timerSeconds - 1)
            setTimerContents(Math.floor(timerSeconds / 60) + ":" + ("" + (timerSeconds % 60)).padStart(2, "0"))
            // console.log("the object 'map':")
            // console.log(map)
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
            // console.log(data)

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
        function handleZoomChanged() {
            setMapZoom(this.getZoom())
        }
        function handlePosChange() {
            setMapCenter({ lat: this.getCenter().lat(), lng: this.getCenter().lng() })
            console.log(mapCenter)
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
    }, [isLoaded, userGuessPosition, affectCenter, mapZoom, mapCenter, map])
    function doThing(e) {
        setHasGuessed(true)
        console.log({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        })
        // Play a beep when the player places a guess on the small map
        playEffect("place")
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
    }
    const UIOverlay = useCallback(() => {
        return (<div id={styles["overlay"]}>
            <Link href="\lobby">
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
            {/* <script src="project-scripts/test.js"></script> */}

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
                return
            }
            setGoalPoint({ lat: data.location.latLng.lat(), lng: data.location.latLng.lng() })
            panorama.setPano(data.location.pano);
            panorama.setVisible(true);
            panorama.setOptions({ zoomControl: true, linksControl: true, addressControl: false, panControl: false })
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

        const userIcon = {
            url: calculateDataURL(),
            scaledSize: new google.maps.Size(50, 50)
        }
        const flagIcon = {
            url: "flag.png",
            scaledSize: new google.maps.Size(65, 50)
        }
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
                        <MarkerF title="" position={goalPoint} icon={flagIcon}></MarkerF>
                        <MarkerF position={userGuessPosition} icon={userIcon}>Guess position</MarkerF>
                        <PolylineF
                            path={[goalPoint, userGuessPosition]}
                            geodesic={true}
                            options={{
                                strokeColor: "#cc860e",
                                strokeOpacity: 0.75,
                                strokeWeight: 4,

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
                </div >
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





function pano() {

}
function fillGuessBar(bar, stopScoreAddFn) {
    canvasMapWidth = window.innerWidth
    bar = bar.current.getContext("2d")
    if (fillTicks > ((((.8 * canvasMapWidth) / 3) * (effectiveScore / 5000)) - 30)) {
        try { if (typeof stopScoreAddFn === 'function') stopScoreAddFn() } catch { }
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

function calculateDataURL() {
    let canvas = document.body.appendChild(document.createElement("canvas"))
    let scrn = canvas.getContext("2d")
    let im = document.body.appendChild(document.createElement("img"))
    im.crossOrigin = "anonymous"
    // im.src = "flag.png"

    im.src = localStorage.getItem("profilePic")

    canvas.width = 100
    canvas.height = 100
    console.log(im)
    scrn.fillStyle = "#3e5ab3"
    scrn.beginPath()
    scrn.ellipse(50, 50, 30, 30, Math.PI, 0, Math.PI * 2)
    scrn.closePath()
    scrn.fill()
    scrn.beginPath()
    scrn.moveTo(20, 55)
    scrn.bezierCurveTo(40, 105, 60, 105, 80, 55)
    scrn.closePath()
    scrn.fill()

    scrn.beginPath()
    scrn.ellipse(50, 50, 25, 25, Math.PI, 0, Math.PI * 2)
    scrn.closePath()
    scrn.clip("nonzero")
    scrn.drawImage(im, 25, 25, 50, 50)
    scrn.closePath()



    console.log(canvas)

    let dataURL = canvas.toDataURL()

    console.log(scrn)
    return dataURL
    // return `data:image/png;base64,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`
}