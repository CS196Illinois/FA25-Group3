"use client";
import "./googlebutton.css";

import React from "react";
import { signInWithGoogle } from "./firebase-config";

export default function LoginButton({ onLoginSuccess }) {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <button type="button" className="login-with-google-btn" onClick={handleLogin}>
      Login with Google
    </button>
  );
}
