// Profile Page
// Route: /profile

"use client"
import styles from "./page.module.css";
import React, { useEffect, useState } from 'react';
import SignOut from "@/components/SignoutButton";
import DeleteAccount from "@/components/DeleteAccountButton";
import signInWithGoogle from "@/components/firebase-config";
import Link from "next/link";

export default function Profile() {
  return (
    <div className={styles.container}>

      <div className={styles.profileContainer}>
        <div>
          <Link href= "/">
            <img src="./logo.png" style={{ maxHeight: "60px" }} />
          </Link>
        </div>
        <img className={styles.img} src={localStorage.getItem("profilePic")} />
        <br />
        <h1>{localStorage.getItem("name")}</h1>
        <br />
        <h3>Email: {localStorage.getItem("email")}</h3>
        <br />
        <SignOut />
        <br />
        <DeleteAccount />

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