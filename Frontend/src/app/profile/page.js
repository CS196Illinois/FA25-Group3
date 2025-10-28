// Profile Page
// Route: /profile

"use client"

import styles from "./page.module.css";
import Link from "next/link";
import React, { useState, useEffect } from 'react';

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
    <div className={styles.container}>
      <div>
        <Link href= "/">
          <img src="./logo.png" style={{ maxHeight: "60px" }} />
        </Link>
      </div>
      
      <div className={styles.profileContainer}>
        <img className={styles.img} src={profilePic} />
        <h1>{name}</h1>
        <h3>Email: {email}</h3>
      </div>

      <div className={styles.profileContainer2}>
        <h1>High Score: {}</h1>
        <h1>Total Points: {}</h1>
        <h1>Daily Streak: {}</h1>
      </div>
      
    </div>
  );
}