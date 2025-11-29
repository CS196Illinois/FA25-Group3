
import { auth } from "../components/firebase-config";
import { deleteUser } from "firebase/auth";
import { useRouter} from "next/navigation"; 

import styles from "./DeleteAccount.module.css"
import Popup from "./ConfirmDeletePopUp";
import { useState } from 'react';

export default function DeleteAccount() {
    const router = useRouter();
    const handleDelete = async () => {
        const user = auth?.currentUser;
        try {
            await deleteUser(user);
            router.push("/login")
        }
        catch (error) {}
    }
   const [buttonPopup, setButtonPopup] = useState(false);
    return (
        <>
            <button className={styles.delete} onClick={() => setButtonPopup(true)}>Delete Account</button>
            <Popup trigger={buttonPopup} setTrigger={setButtonPopup}>
                <button className={styles.delete} onClick={handleDelete}>Confirm Delete</button>
            </Popup>
        </>
    );
}
