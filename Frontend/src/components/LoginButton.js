"use client";
import "./googlebutton.css"
import { signInWithGoogle } from "./firebase-config";
import { useRouter } from 'next/navigation';

export default function LoginButton() {
    const router = useRouter();

    const handleSignIn = async () => {
        try {
            await signInWithGoogle();
            // Redirect to home page after successful sign-in
            router.push('/');
        } catch (err) {
            console.error('Sign-in failed', err);
        }
    }

    return <button type="button" className="login-with-google-btn" onClick={handleSignIn}> Sign In With Google </button>
}