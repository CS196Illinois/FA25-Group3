// functions/index.js (or index.ts if using TypeScript)
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(); // Initialize Firebase Admin SDK

// Utility function to calculate more accurate distance between two lat/long points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}


exports.submitGameScore = functions.https.onCall(async (data, context) => {
  // 1. Authenticate and authorize the request
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  const uid = context.auth.uid; // Get the user's UID from the authenticated context

  // 2. Validate the incoming data
  const gameType = data.gameType;
  const roundsData = data.roundsData;

  // Ensure data exists and is in the expected format
  if (!gameType || typeof gameType !== 'string' || !roundsData || !Array.isArray(roundsData)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a gameType (string) and an array of roundsData."
    );
  }

  // Basic validation for each round's data structure
  for (const round of roundsData) {
    if (
      !round.correctLocation || typeof round.correctLocation.lat !== 'number' || typeof round.correctLocation.long !== 'number' ||
      !round.playerGuess || typeof round.playerGuess.lat !== 'number' || typeof round.playerGuess.long !== 'number' ||
      typeof round.timeRemaining !== "number" || typeof round.isTimedOut !== "boolean" ||
      typeof round.round !== "number" || typeof round.timestamp !== "number"
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Each round must contain valid correctLocation, playerGuess, timeRemaining, isTimedOut, round, and timestamp."
      );
    }
    // More complex validation: check if lat/long are within plausible ranges
    if (round.correctLocation.lat < -90 || round.correctLocation.lat > 90 ||
        round.correctLocation.long < -180 || round.correctLocation.long > 180 ||
        round.playerGuess.lat < -90 || round.playerGuess.lat > 90 ||
        round.playerGuess.long < -180 || round.playerGuess.long > 180) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Latitude/Longitude values out of valid range."
      );
    }
    // You could also add checks for timeRemaining or round number sanity if needed.
  }

  // 3. SECURELY RE-CALCULATE THE SCORE ON THE SERVER
  let totalServerCalculatedScore = 0;
  const GAME_SCORE_MAX_POINTS_PER_ROUND = 5000;
  const DISTANCE_PENALTY_PER_KM = 100; // Example
  const TIMEOUT_PENALTY = 1000; // Example

  for (const round of roundsData) {
    const correctLat = round.correctLocation.lat;
    const correctLong = round.correctLocation.long;
    const guessLat = round.playerGuess.lat;
    const guessLong = round.playerGuess.long;
    const isTimedOut = round.isTimedOut;
    const timeRemaining = round.timeRemaining; // Can be used for bonus/penalty if desired

    // Re-calculate distance on the server using Haversine formula
    const serverCalculatedDistanceKm = calculateDistance(correctLat, correctLong, guessLat, guessLong);

    let roundScore = GAME_SCORE_MAX_POINTS_PER_ROUND;

    // Apply distance penalty
    roundScore -= (serverCalculatedDistanceKm * DISTANCE_PENALTY_PER_KM);

    // Apply timeout penalty
    if (isTimedOut) {
        roundScore -= TIMEOUT_PENALTY;
    }

    // Ensure score doesn't go below zero
    roundScore = Math.max(0, roundScore);

    totalServerCalculatedScore += roundScore;
  }

  // 4. Update the Realtime Database using the Admin SDK (bypasses security rules)
  const userRef = admin.database().ref(`users/${uid}`);
  const userGameHighScoreRef = userRef.child(`highScores/${gameType}`); // e.g., users/UID/highScores/StreetViewGuessing

  let newHighScore = totalServerCalculatedScore;
  let oldHighScore = 0;

  // Fetch current high score for this game type
  const snapshot = await userGameHighScoreRef.once("value");
  if (snapshot.exists()) {
    oldHighScore = snapshot.val();
  }

  // Only update if the newly calculated score is higher
  if (totalServerCalculatedScore > oldHighScore) {
    await userGameHighScoreRef.set(totalServerCalculatedScore);
  } else {
    newHighScore = oldHighScore; // Keep the old high score if it's better or equal
  }

  // 5. Update global high scores (more complex for a true leaderboard)
  // For a simple leaderboard where each user has one entry, we update if new score is higher
  const globalHighScoresRef = admin.database().ref(`globalHighScores/${gameType}`);
  const globalUserEntryRef = globalHighScoresRef.child(uid);
  const globalUserEntrySnapshot = await globalUserEntryRef.once("value");
  const currentGlobalScore = globalUserEntrySnapshot.exists() ? globalUserEntrySnapshot.val() : 0;

  if (totalServerCalculatedScore > currentGlobalScore) {
      await globalUserEntryRef.set(totalServerCalculatedScore);
  }


  // 6. Return a response to the client
  return {
    message: "Score submitted successfully!",
    totalScore: totalServerCalculatedScore,
    newHighScore: newHighScore,
    leaderboardUpdated: totalServerCalculatedScore > currentGlobalScore,
  };
});
