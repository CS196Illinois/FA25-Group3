// Main Gameplay Page
// Route: /game
import styles from "./page.module.css";

export default function Gameplay() {

  let zoomTicks = 0
  let zoomInterval
  var timerInterval
  var timerSeconds
  var round = 0
  var maxRounds = 3
  let panorama
  let map;
  let canvasMapWidth
  let fillTicks
  let barInterval
  let fillTicksAcc
  let score
  // let bar = $("fillScorebar").getContext("2d")

  let currentRoundData = {
    point: {},
    guess: { lat: 0, long: 0 }
  }
  return (
    <div style={styles}>
      <div id="pano"></div>
      <GuessOverlay></GuessOverlay>
      <UIOverlay></UIOverlay>
      <ControlOverlay></ControlOverlay>
      <img class="hidden" id="map2d" src="img/map.png" />

      <ScoreScreen></ScoreScreen>

      <script src="test-scripts/randpoint.js"></script>
      <script src="project-scripts/play.js"></script>
      <script
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initialize2&v=weekly"
        defer></script>
    </div>
  );
}

function GuessOverlay() {
  return (
    <div id="guess-overlay">
      <div id="guessMap"></div>
      <button id="submitGuess" onClick={submitGuess()}>Submit guess!</button>
    </div>
  )
}

function UIOverlay() {
  return (<div id="overlay">
    <img src="img/logo.png" style="max-height: 60px;" />
    <div id="timer"></div>
    <div id="round-counter"></div>
  </div>)
}

function ScoreScreen() {
  return (
    <div id="scoreScreen">
      <img src="img/logo.png" style="max-height: 60px; margin-right: calc(100% - 70px);" />
      <div id="roundInformation"></div>
      <canvas id="scoringMap"></canvas>
      <div id="scoreBar">
        <div id="score"> </div>
        {/* <canvas id="fillScorebar" height="70" width="10"></canvas> */}
        <div id="guessInfo"></div>
        <button id="nextRound" onClick={startRound()}>Start next!</button>
      </div>
    </div>
  )
}

function ControlOverlay() {
  return (
    <div id="controlsOverlay">
      <button id="zoomIn" onClick={zoomIn()}>+</button>
      <button id="zoomOut" onClick={zoomOut()}>-</button>
      <button id="settings">*</button>
    </div>
  )
}
/*
<div id="pano"></div>
      <div id="guess-overlay">
        <div id="guessMap"></div>
        <button id="submitGuess" onclick="submitGuess()">Submit guess!</button>
      </div>

      <div id="overlay">
        <img src="img/logo.png" style="max-height: 60px;">
          <div id="timer"></div>
          <div id="round-counter"></div>
      </div>
      <div id="controlsOverlay">
        <button id="zoomIn" onclick="zoomIn()">+</button>
        <button id="zoomOut" onclick="zoomOut()">-</button>
        <button id="settings">*</button>
      </div>
      <img class="hidden" id="map2d" src="img/map.png">
        <div id="scoreScreen">
          <img src="img/logo.png" style="max-height: 60px; margin-right: calc(100% - 70px);">
            <div id="roundInformation"></div>
            <canvas id="scoringMap"></canvas>
            <div id="scoreBar">
              <div id="score"> </div>
              <canvas id="fillScorebar" height="70" width="10"></canvas>
              <div id="guessInfo"></div>
              <button id="nextRound" onclick="startRound()">Start next!</button>
            </div>
        </div>
      </body>
      <script src="test-scripts/randpoint.js"></script>
      <script src="project-scripts/play.js"></script>

      
      <script>(g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = { }); var d = b.maps || (b.maps = { }), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => {await(a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })
        ({key: "AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg", v: "weekly" });</script>
      */


async function initialize2() {
  const location = { lat: getRandomPoint().lat, long: getRandomPoint().long }
  const ControlPosition = await google.maps.importLibrary("core")
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
  startRound()
}// Initialize and add the map\


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

// 



function startRound() {
  document.getElementById("scoreScreen").style.visibility = "hidden"
  round++
  if (round > maxRounds) {
    finalScore()
    return
  }
  currentRoundData.point = getRandomPoint()
  console.log(currentRoundData.point)
  let success = false
  while (!success) {
    try {
      success = true
      panorama.setPosition({ lat: currentRoundData.point.lat, lng: currentRoundData.point.long })
    } catch (e) {

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
    submitGuess()
  }
}

//

function submitGuess() {
  //calculate score
  canvasMapWidth = window.innerWidth
  document.getElementById("fillScorebar").width = window.innerWidth

  let distance = Math.sqrt(Math.pow(currentRoundData.guess.lat - currentRoundData.point.lat, 2) + Math.pow(currentRoundData.guess.long - currentRoundData.point.long, 2))

  // score = 5000 * (1 - (Math.PI * distance * distance) / (1))
  score = 4700


  clearInterval(timerInterval)
  document.getElementById("scoreScreen").style.visibility = "visible"
  //display score screen
  document.getElementById("roundInformation").textContent = "Round " + round
  // document.getElementById
  //score screen has: 
  fillTicks = 0
  fillTicksAcc = 0
  barInterval = setInterval(fillGuessBar, 1000 / 300)
  document.getElementById("score").textContent = score + "pts"
  document.getElementById("guessInfo").textContent = "Your guess was " + distance.toString().substring(0, distance.toString().indexOf(".") + 3) + "km from the correct location!"
  /*
      -map showing distance between guess and real place
      -score (with slidy bar)
      -round number
      -button to start a new round
  */
}
/*
game process:
initialize round number to 1
 
load random lat / long
 
*/

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

function fillGuessBar() {
  if (fillTicks > ((((.8 * canvasMapWidth) / 3) * (score / 5000)) - 30)) {
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

function finalScore() {

}