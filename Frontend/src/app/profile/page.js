// Profile Page
// Route: /profile

"use client"

import styles from "./page.module.css";
import Link from "next/link";
import React, { useState, useEffect } from 'react';
import SignOut from "@/components/SignoutButton";
import DeleteAccount from "@/components/DeleteAccountButton";

export default function Profile() {
  const [profilePic, setProfilePic] = useState();
  const [name, setName] = useState();
  const [email, setEmail] = useState();

  useEffect(() => {
    setProfilePic(localStorage.getItem("profilePic"));
    setName(localStorage.getItem("name"));
    setEmail(localStorage.getItem("email"));
  }, []);

  return (
    <div className={styles['container-with-background']}>
      
      <Link href= "/">
        <img className={styles.logo} src="./logo.png" />
      </Link>
    
      <div className={styles.container}>
        
        <div className={styles.profileContainer}>
          <img className={styles.img} referrerPolicy="no-referrer" src={profilePic} />
          <h1>{name}</h1>
          <h3>Email: {email}</h3>
        </div>

        <div className={styles.profileContainer2}>
          <h1>High Score: {}</h1>
          <h1>Total Points: {}</h1>
          <h1>Daily Streak: {}</h1>
          <br></br>
          <div className={styles['button-container']}>
            <SignOut/>
            <DeleteAccount/>
          </div>
        </div>
        
      </div>
    </div>
  );
}