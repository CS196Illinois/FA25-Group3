"use client"
import { useRef, useState, useEffect } from 'react'

let pArr = []
let SNOW_COLLECTING = false
let SNOW_FALLING = true
export default function Particles() {
    const [ticks, setTicks] = useState(0)
    const particleCanvas = useRef()
    const snowImgRef = useRef(null)
    const moundImgRef = useRef(null)
    let timerInterval


    useEffect(() => {
        // Preload images once
        if (!snowImgRef.current) {
            const img = new Image()
            img.src = "/snow.png"
            snowImgRef.current = img
        }
        if (!moundImgRef.current) {
            const img2 = new Image()
            img2.src = "/snowmound.png"
            moundImgRef.current = img2
        }
        timerInterval = setInterval(() => {
            setTicks(ticks + 1)
            updateCanvas()
        }, 30)
        return () => {
            clearInterval(timerInterval)
        }
    }, [ticks])

    if (true) { // add like a settings thing for this later maybe or we just don't use it idk
        if (SNOW_FALLING) { // add like a settings thing for this later maybe or we just don't use it idk
            return (
                <canvas
                    style={{ zIndex: 100, position: "fixed", top: 0, left: 0, pointerEvents: "none" }}
                    ref={particleCanvas}
                />
            )
        }
        return (<></>)
    }
    function updateCanvas() {
        // console.log(ticks)
        particleCanvas.current["width"] = window.innerWidth
        particleCanvas.current["height"] = window.innerHeight
        var scrn = particleCanvas.current.getContext("2d")
        // scrn.fillRect(0, 0, 100, 100)
        // console.log(particleCanvas.current)
        const im = snowImgRef.current
        if (!im || !im.complete) {
            return
        }
        scrn.clearRect(0, 0, window.innerWidth, window.innerHeight)
        // scrn.drawImage(im, 0, 0, 15, 15)
        // Read desired particle count from localStorage; prefer discrete snowLevel
        let desired = 800
        try {
            const lvl = parseInt(localStorage.getItem("snowLevel"), 10)
            if (!Number.isNaN(lvl)) {
                const levels = [0, 200, 600, 1200, 2000]
                desired = levels[Math.max(0, Math.min(4, lvl))]
            } else {
                const stored = parseInt(localStorage.getItem("snowParticles"), 10)
                if (!Number.isNaN(stored)) desired = Math.max(0, Math.min(3000, stored))
            }
        } catch {}
        if (pArr.length < desired) {
            for (let i = pArr.length; i < desired; i++) {
                pArr.push([(Math.random(0, 6) * (window.innerWidth + 90) - 100), Math.random() * window.innerHeight, 0, 0])
            }
        }
        if (pArr.length > desired) {
            pArr.length = desired
        }
        for (let i = 0; i < pArr.length; i++) {
            pArr[i][1] += Math.min(pArr[i][2], 5)
            pArr[i][0] += pArr[i][3]
            pArr[i][2] += (Math.random()) - .1
            pArr[i][3] += (Math.random() * .5) - .25
            scrn.drawImage(im, pArr[i][0], pArr[i][1], 15, 15)
            if (pArr[i][0] > window.innerWidth || pArr[i][1] > window.innerHeight || pArr[i][0] < -10 || pArr[i][1] < -10) {
                pArr[i] = [i * Math.random(0, 6) * 10, 0, 0, 0]
                pArr[i] = [i * Math.random(0, 6) * 10, - 8, 0, 0]
            }
        }
        if (SNOW_COLLECTING) {
            const im2 = moundImgRef.current
            if (im2 && im2.complete) {
                scrn.drawImage(im2, 0, Math.max(-window.innerHeight, 300 - (ticks)))
            }
        }
    }
}
