"use client";


import styles from "../lobby/page.module.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";


function StartButton() {
 const router = useRouter();


 return (
   <button
     className={styles.startButton}
     onClick={() => router.push("/game")}
   >
     <div className={styles.buttonText}>Start Game!</div>
   </button>
 );
}


export default function Lobby() {
   const router = useRouter();
 const handleLoginSuccess = () => router.push("/lobby");


 const videos = [
   "/BGvideo1.mp4",
   "/BGvideo2.mp4",
   "/BGvideo3.mp4",
   "/BGvideo4.mp4",
   "/BGvideo5.mp4",
   "/BGvideo6.mp4",
   "/BGvideo7.mp4",
   "/BGvideo8.mp4",
   "/BGvideo9.mp4",
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
  <header className={styles["App-header"]}>
    <div className={styles["score"]}>
      <img
        src="/trophy.png"
        className={styles["trophy"]}
        alt="trophy"
      />
      <span>2100</span>
    </div>

    <img
      src="/geouiuc_logo.png"
      className={styles["App-logo"]}
      alt="logo"
    />

    <p className={styles["App-para"]}>Game Mode: Outdoor</p>
  </header>
</div>


     <div className={styles.logoContainer}>
         <StartButton />
       </div>
   </div>
   );
}
