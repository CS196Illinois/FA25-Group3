"use client";
import "./googlebutton.css"
import { signInWithGoogle } from "./firebase-config";
export default function LoginButton() {
    return <button type="button" className="login-with-google-btn" onClick={signInWithGoogle}> Sign In With Google </button> 
} 