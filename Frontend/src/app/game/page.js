"use client"
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'

import styles from "./page.module.css";
import SettingsModal from '@/components/SettingsModal';
// import logo from "/logo.png";
// import font from "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400..800&display=swap"
let canvasMapWidth
let fillTicks = 0
let barInterval
let fillTicksAcc = 0
let effectiveScore
let maxRounds = 3
let timerSeconds
let round
let timerInterval

export default function Gameplay() {
    const [showScoreScreen, setShowScoreScreen] = useState(false)
    const [score, setScore] = useState()
    const [guessInfo, setGuessInfo] = useState()
    const [currentRound, setCurrentRound] = useState(1)
    const [timerContents, setTimerContents] = useState("2:00")
    const scorebarFillRef = useRef(null)
    const [timerSeconds, setTimerSeconds] = useState(119)
    const pano = useRef(null)


    useEffect(() => {
        console.log("useEffect runs")
        timerInterval = setInterval(() => {
            setTimerSeconds(timerSeconds - 1)
            console.log(timerSeconds)
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

    return (
        <div className={styles.umbrella} style={styles}>
            <div id={styles["pano"]} ref={pano}></div>
            <GuessOverlay></GuessOverlay>
            <UIOverlay></UIOverlay>
            <ControlOverlay></ControlOverlay>
            <ScoreScreen show={showScoreScreen}></ScoreScreen>
            <SettingsModal />
            <script src="project-scripts/test.js"></script>
            <script
                src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initialize2&v=weekly"
                defer></script>
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
    }
    function GuessOverlay() {
        return (
            <div id={styles["guessOverlay"]}>
                <div id={styles["guessMap"]}></div>
                <button onClick={() => { submitGuess() }}>Submit guess!</button>
            </div>
        )
    }
    function ScoreScreen({ show }) {
        if (!show) {
            return (<div style={{ visibility: "hidden" }}><canvas id={styles["fillScorebar"]} height="10" width="70" ref={scorebarFillRef}></canvas></div>)
        }
        return (
            <>
                <SettingsModal />

                <div id={styles.scoreScreen}>
                    <img src="./logo.png" style={{ maxHeight: "60px", marginRight: "calc(100% - 70px)" }} />
                    <div id={styles["roundInformation"]}></div>
                    <canvas id={styles["scoringMap"]}></canvas>
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
    function UIOverlay() {
        return (<div id={styles["overlay"]}>
            <Link href="./">
                <img src="./logo.png" style={{ maxHeight: "60px" }} />
            </Link>
            <div id={styles["timer"]}>{timerContents}</div>
            <div id={styles["roundCounter"]}>Round {currentRound}</div>
        </div>)
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

