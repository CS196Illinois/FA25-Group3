import React from 'react'
import styles from "../components/PopUp.module.css"
function Popup(props) {
    return (props.trigger) ? (
        <div className={styles.popup}>
            <div className={styles["popup-inner"]}>
                <button className={styles["close-btn"]} onClick={() => props.setTrigger(false)}>close</button>
                {props.children}
            </div>
        </div>
    ) : "";
}

export default Popup