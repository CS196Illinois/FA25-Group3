
"use client"
import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api"
import { getRandomPoint } from "./test-scripts/randpoint.js"
import styles from "./page.module.css"
import { useAudio } from '@/components/AudioProvider'

const CAMPUS_MAP_BOUNDS = {
    north: 40.1161,
    south: 40.0884,
    east: -88.2095,
    west: -88.2423
}
/*
topLongitude: -88.24238428986186, topLatitude: 40.11611769953682, bottomLongitude: -88.20952176360476, bottomLatitude: 40.08842958076448
*/

const MAP_CENTER = { lat: 40.108252, lng: -88.22699 }
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
    console.log(maxDistance)
    const normalizedDistance = distance / maxDistance
    console.log(normalizedDistance)
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
        : `You didn't place a guess - 0pts!`
}

function useStreetViewPanorama(isLoaded, panoramaRef) {
    const [goalPoint, setGoalPoint] = useState(null)
    const panoramaInstanceRef = useRef(null)

    const ensurePanoramaInitialized = useCallback(() => {
        if (panoramaInstanceRef.current) return true
        if (!window.google?.maps) return false

        const container = panoramaRef.current || document.querySelector('[data-panorama-container]')
        if (!container) return false

        try {
            panoramaInstanceRef.current = new window.google.maps.StreetViewPanorama(container)
            return true
        } catch (error) {
            console.error("Error initializing panorama:", error)
            return false
        }
    }, [panoramaRef])

    const findValidPanorama = useCallback((initialPoint) => {
        if (!window.google?.maps) return

        ensurePanoramaInitialized()
        const service = new window.google.maps.StreetViewService()

        const processPanorama = ({ data }) => {
            const isGoogleStreetView = data.copyright?.indexOf("Google") >= 0

            if (!isGoogleStreetView) {
                const randomPoint = getRandomPoint()
                const newPoint = createPosition(randomPoint.lat, randomPoint.long)
                setGoalPoint(newPoint)
                service.getPanorama({ location: newPoint, radius: 1000 }).then(processPanorama)
                return
            }

            const panoramaLocation = data.location.latLng
            const finalGoalPoint = createPosition(
                panoramaLocation.lat(),
                panoramaLocation.lng()
            )
            setGoalPoint(finalGoalPoint)

            const panorama = panoramaInstanceRef.current
            if (panorama && typeof panorama.setPano === 'function') {
                try {
                    panorama.setPano(data.location.pano)
                    panorama.setVisible(true)
                    panorama.setOptions({
                        zoomControl: true,
                        linksControl: true,
                        addressControl: false,
                        panControl: false,
                        showRoadLabels: false
                    })
                } catch (error) {
                    console.error("Error setting panorama:", error)
                }
            }
        }

        service.getPanorama({ location: initialPoint, radius: 1000 }).then(processPanorama)
    }, [ensurePanoramaInitialized])

    const adjustPanoramaZoom = useCallback((delta) => {
        const panorama = panoramaInstanceRef.current
        if (panorama && typeof panorama.getZoom === 'function') {
            panorama.setZoom(panorama.getZoom() + delta)
        }
    }, [])

    const zoomIn = useCallback(() => adjustPanoramaZoom(1), [adjustPanoramaZoom])
    const zoomOut = useCallback(() => adjustPanoramaZoom(-1), [adjustPanoramaZoom])

    useEffect(() => {
        if (!isLoaded || !window.google) return

        ensurePanoramaInitialized()
        const randomPoint = getRandomPoint()
        const point = createPosition(randomPoint.lat, randomPoint.long)
        setGoalPoint(point)
        findValidPanorama(point)
    }, [isLoaded, ensurePanoramaInitialized, findValidPanorama])

    return { goalPoint, findValidPanorama, zoomIn, zoomOut }
}

function useTimer(initialSeconds, onTimeout) {
    const [seconds, setSeconds] = useState(initialSeconds)
    const onTimeoutRef = useRef(onTimeout)

    useEffect(() => {
        onTimeoutRef.current = onTimeout
    }, [onTimeout])

    useEffect(() => {
        if (seconds <= 0) {
            onTimeoutRef.current()
            return
        }

        const interval = setInterval(() => {
            setSeconds(prev => prev <= 1 ? 0 : prev - 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [seconds])

    const reset = useCallback((newSeconds = initialSeconds) => {
        setSeconds(newSeconds)
    }, [initialSeconds])

    return { seconds, reset, formatted: formatTimer(seconds) }
}

function useScoreBarAnimation(show, score, onComplete) {
    const canvasRef = useRef(null)
    const [effectiveScore, setEffectiveScore] = useState(score)

    useEffect(() => {
        if (score && typeof score === 'string') {
            const scoreValue = parseInt(score.replace('pts', ''), 10) || 0
            setEffectiveScore(scoreValue)
        }
    }, [score])

    useEffect(() => {
        if (!show || !canvasRef.current) {
            if (!show && onComplete) onComplete()
            return
        }
        if (effectiveScore === 0) {
            if (onComplete) onComplete()
            return
        }

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        const canvasWidth = window.innerWidth
        canvas.width = canvasWidth

        let fillTicks = 0
        let fillTicksAcc = 0
        let completed = false
        const { WIDTH_RATIO, TICK_MULTIPLIER, OFFSET, LINE_WIDTH, LINE_Y, LEFT_MARGIN, RIGHT_MARGIN, ACCELERATION } = SCORE_BAR_CONFIG
        const targetTicks = ((WIDTH_RATIO * canvasWidth) / TICK_MULTIPLIER) *
            (effectiveScore / MAX_SCORE) - OFFSET
        const startX = LEFT_MARGIN * canvasWidth
        const endX = RIGHT_MARGIN * canvasWidth
        ctx.fillStyle = SCORE_BAR_COLORS.background
        ctx.fillRect(0, 0, canvasWidth, 50)

        ctx.beginPath()
        ctx.lineWidth = LINE_WIDTH
        ctx.strokeStyle = SCORE_BAR_COLORS.track
        ctx.lineCap = "round"
        ctx.moveTo(startX, LINE_Y)
        ctx.lineTo(endX, LINE_Y)
        ctx.stroke()
        const drawFrame = () => {
            if (fillTicks > targetTicks) {
                fillTicks = targetTicks
                if (!completed && onComplete) {
                    completed = true
                    onComplete()
                }
                return false
            }

            fillTicks += 1 + fillTicksAcc
            fillTicksAcc += ACCELERATION

            ctx.fillStyle = SCORE_BAR_COLORS.background
            ctx.fillRect(0, 0, canvasWidth, 50)

            ctx.beginPath()
            ctx.lineWidth = LINE_WIDTH
            ctx.strokeStyle = SCORE_BAR_COLORS.track
            ctx.lineCap = "round"
            ctx.moveTo(startX, LINE_Y)
            ctx.lineTo(endX, LINE_Y)
            ctx.stroke()

            ctx.beginPath()
            ctx.lineWidth = LINE_WIDTH
            ctx.strokeStyle = SCORE_BAR_COLORS.fill
            ctx.lineCap = "round"
            ctx.moveTo(startX, LINE_Y)
            ctx.lineTo(startX + (fillTicks * TICK_MULTIPLIER), LINE_Y)
            ctx.stroke()

            return true
        }

        const interval = setInterval(() => {
            if (!drawFrame()) {
                clearInterval(interval)
            }
        }, 1)

        return () => {
            clearInterval(interval)
            if (!completed && onComplete) onComplete()
        }
    }, [show, effectiveScore, onComplete])

    return canvasRef
}

function useGameLogic(goalPoint) {
    const [userGuess, setUserGuess] = useState(DEFAULT_POSITION)
    const [submittedGuess, setSubmittedGuess] = useState(null)
    const [submittedGoal, setSubmittedGoal] = useState(null)
    const [score, setScore] = useState(null)
    const [guessInfo, setGuessInfo] = useState(null)

    const submitGuess = useCallback(() => {
        if (!goalPoint) {
            console.error("Goal point not set")
            return
        }

        const hasGuess = !isDefaultPosition(userGuess)
        const guessPosition = hasGuess ? userGuess : null
        const distance = guessPosition
            ? calculateDistance(
                guessPosition.lat, guessPosition.lng,
                goalPoint.lat, goalPoint.lng
            )
            : MAX_DISTANCE_IN_BOUNDS

        const calculatedScore = calculateScore(distance)
        setScore(`${calculatedScore}pts`)
        setGuessInfo(formatDistanceText(distance, hasGuess))
        setSubmittedGoal(goalPoint)
        setSubmittedGuess(guessPosition || DEFAULT_POSITION)
    }, [goalPoint, userGuess])

    const resetGuess = useCallback(() => {
        setUserGuess(DEFAULT_POSITION)
        setSubmittedGuess(null)
        setSubmittedGoal(null)
        setScore(null)
        setGuessInfo(null)
    }, [])

    return {
        userGuess,
        submittedGuess,
        submittedGoal,
        score,
        guessInfo,
        setUserGuess,
        submitGuess,
        resetGuess
    }
}

function UIOverlay({ timerText, currentRound }) {
    return (
        <div id={styles["overlay"]}>
            <Link href="/lobby">
                <img src="./logo.png" style={{ maxHeight: "60px" }} alt="Logo" />
            </Link>
            <div id={styles["timer"]}>{timerText}</div>
            <div id={styles["roundCounter"]}>Round {currentRound}</div>
        </div>
    )
}

function ControlOverlay({ onZoomIn, onZoomOut }) {
    return (
        <div id={styles.controlsOverlay}>
            <button id={styles["zoomIn"]} onClick={onZoomIn}>+</button>
            <button id={styles["zoomOut"]} onClick={onZoomOut}>-</button>
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

function GuessMap({
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

function ScoreScreen({
    show,
    score,
    guessInfo,
    goalPoint,
    guessPoint,
    isLoaded,
    onNextRound,
    onScoreBarComplete,
    currentRound
}) {
    const router = useRouter()
    const isGameComplete = currentRound > MAX_ROUNDS
    const scorebarRef = useScoreBarAnimation(show, score, onScoreBarComplete)

    const handleButtonClick = useCallback(() => {
        if (isGameComplete) {
            router.push('/profile')
        } else {
            onNextRound()
        }
    }, [isGameComplete, router, onNextRound])

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
    const userIcon = {
        url: calculateDataURL(),
        scaledSize: new google.maps.Size(50, 50)
    }
    const flagIcon = {
        url: "flag.png",
        scaledSize: new google.maps.Size(65, 50)
    }

    return (
        <div id={styles.scoreScreen}>
            <img
                src="./logo.png"
                style={{ maxHeight: "60px", marginRight: "calc(100% - 70px)" }}
                alt="Logo"
            />
            {isLoaded && goalPoint && (
                <GoogleMap
                    mapContainerStyle={{
                        width: '75vw',
                        height: '400px',
                        marginLeft: "12.5vw",
                        marginBottom: "10px"
                    }}
                    center={mapCenter}
                    zoom={mapZoom}
                    options={{
                        disableDefaultUI: true,
                        streetViewControl: false,
                        disableDoubleClickZoom: true
                    }}
                >
                    <MarkerF
                        position={goalPoint}
                        title="Correct Location"
                        icon={flagIcon}
                    />
                    {guessPoint && !isDefaultPosition(guessPoint) && (
                        <>
                            <MarkerF
                                position={guessPoint}
                                title="Your Guess"
                                icon={userIcon}
                            />
                            <PolylineF
                                path={[goalPoint, guessPoint]}
                                // geodesic={true}
                                options={{
                                    strokeColor: "#cc860e",
                                    strokeOpacity: 0.75,
                                    strokeWeight: 4,
                                }}
                            />
                        </>
                    )}
                </GoogleMap>
            )}
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
                    {isGameComplete ? "Game over - return to profile page" : "Start next!"}
                </button>
            </div>
        </div>
    )
}

export default function Gameplay() {
    const [showScoreScreen, setShowScoreScreen] = useState(false)
    const [currentRound, setCurrentRound] = useState(1)
    const [isMapExpanded, setIsMapExpanded] = useState(false)
    const panoramaRef = useRef(null)
    

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES
    })

    const { playEffect, startScoreAdd, stopScoreAdd } = useAudio()

    const { goalPoint, findValidPanorama, zoomIn, zoomOut } = useStreetViewPanorama(isLoaded, panoramaRef)
    const gameLogic = useGameLogic(goalPoint)
    const { seconds: timerSeconds, reset: resetTimer, formatted: timerText } = useTimer(
        INITIAL_TIMER_SECONDS,
        () => handleSubmitGuess()
    )

    // No audio stop helper needed; no score-fill audio

    const handleSubmitGuess = useCallback(() => {
        gameLogic.submitGuess()
        setCurrentRound(prev => prev + 1)
        setShowScoreScreen(true)
        // Restart and slightly delay score-fill sound to avoid race with UI updates
        try { stopScoreAdd() } catch {}
        setTimeout(() => { try { startScoreAdd() } catch {} }, 60)
    }, [gameLogic, startScoreAdd, stopScoreAdd])

    const handleMapClick = useCallback((position) => {
        playEffect()
        gameLogic.setUserGuess(position)
    }, [gameLogic, playEffect])

    const handleScoreBarComplete = useCallback(() => {
        // Stop score-fill audio when the bar completes
        try { stopScoreAdd() } catch {}
    }, [stopScoreAdd])

    const startRound = useCallback(() => {
        if (currentRound > MAX_ROUNDS) return

        playEffect()
        const randomPoint = getRandomPoint()
        const newGoalPoint = createPosition(randomPoint.lat, randomPoint.long)

        gameLogic.resetGuess()
        setShowScoreScreen(false)
        resetTimer(INITIAL_TIMER_SECONDS)
        findValidPanorama(newGoalPoint)
    }, [currentRound, gameLogic, resetTimer, findValidPanorama, playEffect])


    return (
        <div className={styles.umbrella} style={styles}>
            <div
                data-panorama-container
                ref={panoramaRef}
                style={{ width: "100vw", height: "100vh" }}
            />
            <UIOverlay timerText={timerText} currentRound={currentRound} />
            <ControlOverlay onZoomIn={zoomIn} onZoomOut={zoomOut} />
            {!showScoreScreen && (
                <GuessMap
                    isLoaded={isLoaded}
                    userGuess={gameLogic.userGuess}
                    onMapClick={handleMapClick}
                    isExpanded={isMapExpanded}
                    onToggleExpand={() => setIsMapExpanded(prev => !prev)}
                    onSubmitGuess={handleSubmitGuess}
                    options={{ disableDefaultUI: true }}
                />
            )}
            <ScoreScreen
                show={showScoreScreen}
                score={gameLogic.score}
                guessInfo={gameLogic.guessInfo}
                goalPoint={gameLogic.submittedGoal}
                guessPoint={gameLogic.submittedGuess}
                isLoaded={isLoaded}
                onNextRound={startRound}
                onScoreBarComplete={handleScoreBarComplete}
                currentRound={currentRound}
            />
        </div>
    )
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
    // console.log(im)
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



    // console.log(canvas)

    let dataURL = canvas.toDataURL()

    // console.log(scrn)
    return dataURL
    // return `data:image/png;base64,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`
}
