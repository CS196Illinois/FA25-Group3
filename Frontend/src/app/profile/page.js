// Profile Page
// Route: /profile

"use client"

import styles from "./page.module.css";
import signInWithGoogle  from "@/components/firebase-config";


export default function Profile() {
  return (
    <div className={styles.container}>

      <div className={styles.profileContainer}>
        <img src={localStorage.getItem("profilePic")} />
        <br />
        <br />
        <br />
        <h1>{localStorage.getItem("name")}</h1>
        <br />
        <h3>Email: {localStorage.getItem("email")}</h3>

      </div>

      <div className={styles.profileContainer2}>
        <h1>High Score: {}</h1>
        <br />
        <br />
        <h1>Total Points: {}</h1>
        <br />
        <br />
        <h1>Daily Streak: {}</h1>
      </div>
      
    </div>
  );
}