"use client";


import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";
import LoginButton from "../../components/LoginButton.js";
import { useRouter } from "next/navigation";


export default function Login() {
 const router = useRouter();
 const handleLoginSuccess = () => router.push("/lobby");


 const videos = [
   "/BGvideo1.mp4",
    "/BGvideo2.mp4",
    "/BGvideo3.mp4",
 ];


 const [index, setIndex] = useState(0);
 const [active, setActive] = useState(true);
 const videoARef = useRef(null);
 const videoBRef = useRef(null);


 useEffect(() => {
   const currentVideo = active ? videoARef.current : videoBRef.current;
   const nextVideo = active ? videoBRef.current : videoARef.current;


   const handleEnded = () => {
     const nextIndex = (index + 1) % videos.length;
     nextVideo.src = videos[nextIndex];
     nextVideo.load();
     nextVideo.play();


     setActive((prev) => !prev);
     setIndex(nextIndex);
   };


   currentVideo.addEventListener("ended", handleEnded);
   return () => currentVideo.removeEventListener("ended", handleEnded);
 }, [index, active]);


 return (
   <div className={styles.App}>
     <div className={styles.videoBackground}>
       <video
         ref={videoARef}
         src={videos[0]}
         autoPlay
         muted
         playsInline
         style={{ display: active ? "block" : "none" }}
       />
       <video
         ref={videoBRef}
         muted
         playsInline
         style={{ display: active ? "none" : "block" }}
       />
     </div>


     <div className={styles.content}>
       <div className={styles.rectangleWrapper}>
         <header className={styles["App-header"]}>
           <p className={styles["App-para"]}>Welcome to</p>
           <img
             src="/geouiuc_logo.png"
             className={styles["App-logo"]}
             alt="logo"
           />
           <LoginButton onLoginSuccess={handleLoginSuccess} />
         </header>
       </div>
     </div>
   </div>
 );
}
