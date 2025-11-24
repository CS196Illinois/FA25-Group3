"use client"
import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api"
import { getRandomPoint } from "./test-scripts/randpoint.js"
import styles from "./page.module.css"
import { useAudio } from '@/components/AudioProvider'

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
    const [effectiveScore, setEffectiveScore] = useState(0)

    useEffect(() => {
        if (score && typeof score === 'string') {
            const scoreValue = parseInt(score.replace('pts', ''), 10) || 0
            setEffectiveScore(scoreValue)
        }
    }, [score])
    
    useEffect(() => {
        if (!show || !canvasRef.current || effectiveScore === 0) {
            if (!show && onComplete) onComplete()
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

        const drawFrame = () => {
            if (fillTicks > targetTicks) {
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
                    disableDoubleClickZoom: true
                }}
            />
            <button style={{ width: "400px", marginLeft: "200px" }} onClick={onSubmitGuess}>
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
                    options={{ streetViewControl: false }}
                >
                    <MarkerF 
                        position={goalPoint}
                        title="Correct Location"
                        icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
                    />
                    {guessPoint && !isDefaultPosition(guessPoint) && (
                        <>
                            <MarkerF 
                                position={guessPoint}
                                title="Your Guess"
                                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
                            />
                            <PolylineF
                                path={[goalPoint, guessPoint]}
                                geodesic={true}
                                options={{
                                    strokeColor: "#ff2527",
                                    strokeOpacity: 0.75,
                                    strokeWeight: 2
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
                    {isGameComplete ? "Return to profile page" : "Start next!"}
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
    const scoreAddStartedRef = useRef(false)

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES
    })

    const { playEffect, startMusic, ensureAudio, startScoreAdd, stopScoreAdd } = useAudio()

    useEffect(() => {
        ensureAudio()
        startMusic()
    }, [ensureAudio, startMusic])

    const { goalPoint, findValidPanorama, zoomIn, zoomOut } = useStreetViewPanorama(isLoaded, panoramaRef)
    const gameLogic = useGameLogic(goalPoint)
    const { seconds: timerSeconds, reset: resetTimer, formatted: timerText } = useTimer(
        INITIAL_TIMER_SECONDS, 
        () => handleSubmitGuess()
    )

    const stopScoreAudio = useCallback(() => {
        if (scoreAddStartedRef.current) {
            scoreAddStartedRef.current = false
            stopScoreAdd()
        }
    }, [stopScoreAdd])

    const handleSubmitGuess = useCallback(() => {
        playEffect("submit")
        gameLogic.submitGuess()
        setCurrentRound(prev => prev + 1)
        setShowScoreScreen(true)
        setTimeout(() => playEffect("score"), 100)
    }, [gameLogic, playEffect])

    const handleMapClick = useCallback((position) => {
        playEffect("place")
        gameLogic.setUserGuess(position)
    }, [gameLogic, playEffect])

    const handleScoreBarComplete = useCallback(() => {
        stopScoreAudio()
    }, [stopScoreAudio])

    const startRound = useCallback(() => {
        if (currentRound > MAX_ROUNDS) return

        stopScoreAudio()
        playEffect("place")
        const randomPoint = getRandomPoint()
        const newGoalPoint = createPosition(randomPoint.lat, randomPoint.long)
        
        gameLogic.resetGuess()
        setShowScoreScreen(false)
        resetTimer(INITIAL_TIMER_SECONDS)
        findValidPanorama(newGoalPoint)
    }, [currentRound, gameLogic, resetTimer, findValidPanorama, playEffect, stopScoreAudio])

    useEffect(() => {
        if (showScoreScreen && gameLogic.score) {
            stopScoreAdd()
            scoreAddStartedRef.current = true
            startScoreAdd()
        } else if (!showScoreScreen) {
            stopScoreAudio()
        }
    }, [showScoreScreen, gameLogic.score, startScoreAdd, stopScoreAdd, stopScoreAudio])

    useEffect(() => {
        if (showScoreScreen) return
        if (timerSeconds === TIMER_WARNING_SECONDS || (timerSeconds > 0 && timerSeconds <= TIMER_TICK_SECONDS)) {
            playEffect("tick")
        }
    }, [timerSeconds, showScoreScreen, playEffect])

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
