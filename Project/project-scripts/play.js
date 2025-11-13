import { database, auth, functions } from './firebase'; // Import auth and functions
import { httpsCallable } from "firebase/functions"; // Import httpsCallable for Cloud Functions
import { onAuthStateChanged } from "firebase/auth"; // For checking user login status

let text = {
    en_us: {

    }
}
let localization = "en_us"
let panorama
let currentRoundData = {
    point: {},
    guess: { lat: 0, long: 0 }
}

let gameSessionRounds = []; // Stores raw data for each round in a game session
let totalClientSideScore = 0; // For client-side display only, will be re-calculated by server


async function initialize2() {
    // We need to ensure the user is logged in before starting a game that saves scores
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User logged in:", user.uid);
            // Now you can proceed with game initialization, knowing the user is authenticated
            const location = { lat: getRandomPoint().lat, long: getRandomPoint().long }
            // ControlPosition is not directly used here, just the import
            google.maps.importLibrary("core"); // Ensure core library is imported
            panorama = new google.maps.StreetViewPanorama(
                document.getElementById("pano"),
                {
                    position: location,
                    pov: {
                        heading: 0,
                        pitch: 0,
                    },
                    addressControl: false,
                    fullscreenControl: false,
                    showRoadLabels: false,
                    zoomControl: false,
                    panControl: false,
                    linksControl: false
                },
            );
            startRound(); // Start the first round after auth check
        } else {
            console.log("No user signed in. Scores will not be saved.");
            alert("Please log in to save your high scores!");
            // Initialize game for anonymous play (scores won't be saved)
            const location = { lat: getRandomPoint().lat, long: getRandomPoint().long }
            google.maps.importLibrary("core");
            panorama = new google.maps.StreetViewPanorama(
                document.getElementById("pano"),
                {
                    position: location,
                    pov: {
                        heading: 0,
                        pitch: 0,
                    },
                    addressControl: false,
                    fullscreenControl: false,
                    showRoadLabels: false,
                    zoomControl: false,
                    panControl: false,
                    linksControl: false
                },
            );
            startRound(); // Still start the game, but it'll be a practice round.
        }
    });
}





let map;

async function initMap() {
    // The location of Uluru
    const position = { lat: -25.344, lng: 131.031 };
    // Request needed libraries.
    //@ts-ignore
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    // The map, centered at Uluru
    map = new google.maps.Map(
        document.getElementById("guessMap"), {
        zoom: 4,
        center: position,
        mapId: "DEMO_MAP_ID",
    });

    // The marker, positioned at Uluru
    const marker = new AdvancedMarkerElement({
        map: map,
        position: position,
        title: "Uluru",
    });
}

// A better way to ensure map loads after DOM and possibly auth:
window.addEventListener('load', () => {
    initMap();
    initialize2(); // Call your game initialization here
});


var timerInterval
var timerSeconds
var round = 0
var maxRounds = 3

function startRound() {
    if (round === 0) { // Reset for a new game session
    gameSessionRounds = [];
    totalClientSideScore = 0;
}

    
    document.getElementById("scoreScreen").style.visibility = "hidden"
    round++
    if (round > maxRounds) {
        finalScore()
        return
    }
currentRoundData.point = getRandomPoint()
console.log("Correct point for round", round, ":", currentRoundData.point)
let success = false
while (!success) {
    try {
        success = true
        panorama.setPosition({ lat: currentRoundData.point.lat, lng: currentRoundData.point.long })
    } catch (e) {
        console.error("Error setting panorama position, trying again:", e);
        // Try another random point if this one fails
        currentRoundData.point = getRandomPoint();
        success = false; // Reset success to retry
    }
}

    timerSeconds = 121
    updateTimer()
    timerInterval = setInterval(updateTimer, 1000)
    document.getElementById("round-counter").textContent = "Round " + round + "/" + maxRounds
}
function updateTimer() {
    timerSeconds--
    document.getElementById("timer").textContent = Math.floor(timerSeconds / 60) + ":" + ("" + (timerSeconds % 60)).padStart(2, "0")
    if (timerSeconds == 0) {
    clearInterval(timerInterval)
    // If timer runs out, still submit the guess, but with current guess
    submitGuess(true); // Indicate it was a timeout
}

}

//
let canvasMapWidth
let fillTicks
let barInterval
let fillTicksAcc
let currentRoundScore; // Score for the current round (client-side calculation)
function submitGuess(timedOut = false) {
    clearInterval(timerInterval)
    document.getElementById("scoreScreen").style.visibility = "visible"

    // --- CLIENT-SIDE SCORE CALCULATION & DISPLAY (for user feedback) ---
    // This is not the score that will be saved to the database.
    // The Cloud Function will recalculate this for security.
    const distance = Math.sqrt(
        Math.pow(currentRoundData.guess.lat - currentRoundData.point.lat, 2) +
        Math.pow(currentRoundData.guess.long - currentRoundData.point.long, 2)
    );

    // Your scoring logic (client-side for display)
    // You'll want to use distance and timerSeconds here. The `score = 4700` is a placeholder.
    currentRoundScore = Math.max(0, 5000 - (distance * 100) - (timedOut ? 1000 : 0)); // Example scoring
    totalClientSideScore += currentRoundScore;

    document.getElementById("roundInformation").textContent = "Round " + round;
    document.getElementById("score").textContent = currentRoundScore + "pts";
    document.getElementById("guessInfo").textContent =
        `Your guess was ${distance.toFixed(2)} km from the correct location!`;
    // Make sure you have an element with ID "totalScoreDisplay" in your HTML
    document.getElementById("totalScoreDisplay").textContent = `Total Score: ${totalClientSideScore} pts`;

    // Store raw data for this round
    gameSessionRounds.push({
        round: round,
        correctLocation: currentRoundData.point,
        playerGuess: currentRoundData.guess,
        timeRemaining: timerSeconds, // How much time was left when submitted
        distanceCalculated: distance, // This is a raw result, will be re-calculated by server
        isTimedOut: timedOut,
        timestamp: Date.now() // Record when the round ended
    });

    // Animate score bar
    canvasMapWidth = window.innerWidth
    document.getElementById("fillScorebar").width = window.innerWidth
    fillTicks = 0
    fillTicksAcc = 0
    barInterval = setInterval(fillGuessBar, 1000 / 300)

    // After displaying, if it's not the final round, allow next round
    if (round < maxRounds) {
        // You'll need a button or mechanism to start the next round
        // Example: document.getElementById("nextRoundButton").onclick = startRound;
    } else {
        // All rounds are done, the finalScore() function will handle submission
    }
}

/*
game process:
initialize round number to 1

load random lat / long

*/
let zoomTicks = 0
let zoomInterval
function zoomIn() {
    clearInterval(zoomInterval)
    zoomTicks = 0
    zoomInterval = setInterval(() => {
        panorama.setZoom(panorama.getZoom() + .01)
        if (zoomTicks > 50) {
            clearInterval(zoomInterval)
        }
        zoomTicks++
    }, 10)
}
function zoomOut() {
    clearInterval(zoomInterval)
    zoomTicks = 0
    zoomInterval = setInterval(() => {
        panorama.setZoom(panorama.getZoom() - .01)
        if (zoomTicks > 50) {
            clearInterval(zoomInterval)
        }
        zoomTicks++
    }, 10)
}
let bar = document.getElementById("fillScorebar").getContext("2d")

function fillGuessBar() {
    if (fillTicks > ((((.8 * canvasMapWidth) / 3) * (currentRoundScore / 5000)) - 30)) {
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

async function finalScore() {
    console.log("Game Over! Submitting scores...");
    const user = auth.currentUser;

    if (!user) {
        console.warn("No user logged in, cannot save high score.");
        alert("Your high score could not be saved. Please log in!");
        return;
    }

    // Prepare data to send to the Cloud Function
    // 'submitGameScore' is the name of your Cloud Function
    const submitGameScore = httpsCallable(functions, 'submitGameScore');

    try {
        const result = await submitGameScore({
            gameType: "StreetViewGuessing", // Or whatever game name you use
            roundsData: gameSessionRounds,
            // playerUid: user.uid // UID is automatically passed in context by httpsCallable
        });

        console.log("High score submission successful:", result.data);
        alert(`Your game total: ${result.data.totalScore}. Your new high score is: ${result.data.newHighScore}`);
        // Optionally, reset gameSessionRounds, totalClientSideScore, etc.
        gameSessionRounds = [];
        totalClientSideScore = 0;
        round = 0; // Reset for a new game
        // ... update UI to show leaderboard or restart game ...

    } catch (error) {
        console.error("Error submitting high score:", error);
        alert("Failed to submit high score. Please try again: " + error.message);
    }
}

