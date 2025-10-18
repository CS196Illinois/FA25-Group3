import styles from "./page.module.css";
import LoginButton from "../../components/LoginButton.js";
// import { signInWithGoogle } from "./firebase-config";
function Login() {
  return (
    <div className={styles.App}>
      <header className={styles["App-header"]}>
        <p className={styles["App-para"]}>
          Welcome to
        </p>
        <img src="/geouiuc_logo.png" className={styles["App-logo"]} alt="logo" />
        <p>
        </p>
        <LoginButton />
      </header>
    </div>
  );
}
export default Login;
