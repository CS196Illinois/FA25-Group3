// Profile Page
// Route: /profile
import styles from "./page.module.css";

export default function Profile() {
  return (
    <div className={styles.container}>

      <div className={styles.profileContainer}>
        <h1>[Username]</h1>
        <h3>Email: {}</h3>
      </div>

      <div className={styles.profileContainer2}>
        <h1>High Score: {}</h1>
        <h1>Total Points: {}</h1>
        <h1>Daily Streak: {}</h1>
      </div>
      
    </div>
  );
}