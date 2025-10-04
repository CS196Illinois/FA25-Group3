import "./page.module.css";
import LoginButton from "../../components/LoginButton";
// import { signInWithGoogle } from "./firebase-config";
function Login() {
  return (
    <div className="App"> 
     <LoginButton />
    </div>
  );
}

export default Login;