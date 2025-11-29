import styles from "./Signout.module.css"
import { useRouter} from "next/navigation";

export default function SignOut() {
    const router = useRouter();
    const handleSignOut = async () => {
        try {
        await signOut(auth);
        } catch {}
        // Optional: clear any stored profile data
        try {
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        localStorage.removeItem("profilePic");
        router.push("/login")
        } catch {}
        setTimeout(() => router.push("/login"), 200);
    };
    return (
        <button className={styles.signout} onClick = {handleSignOut} >Sign Out</button>
    );
}