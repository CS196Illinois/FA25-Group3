// Profile Page
// Route: /profile

"use client"

import styles from "./page.module.css";
import signInWithGoogle  from "@/components/firebase-config";
import Link from "next/link";


export default function Profile() {
  return (
    <div className={styles.container}>
      <div>
        <Link href= "/">
          <img src="./logo.png" style={{ maxHeight: "60px" }} />
        </Link>
      </div>
      
      <div className={styles.profileContainer}>
        <img className={styles.img} src={localStorage.getItem("profilePic")} />
        <h1>{localStorage.getItem("name")}</h1>
        <h3>Email: {localStorage.getItem("email")}</h3>
      </div>

      <div className={styles.profileContainer2}>
        <h1>High Score: {}</h1>
        <h1>Total Points: {}</h1>
        <h1>Daily Streak: {}</h1>
      </div>
      
    </div>
  );
}