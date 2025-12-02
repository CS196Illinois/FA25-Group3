"use client"
import { useRef, useState, useEffect, useCallback, React } from 'react'

let pArr = []
let SNOW_COLLECTING = false
let SNOW_FALLING = true
export default function Particles() {
    const [ticks, setTicks] = useState(0)
    const particleCanvas = useRef()
    let timerInterval


    useEffect(() => {
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
            return (<>
                <canvas style={{ zIndex: 15, position: "absolute", top: 0, pointerEvents: "none" }} ref={particleCanvas}></canvas>
            </>)
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
        var im = new Image()
        im.src = "snow.png"
        scrn.clearRect(0, 0, window.innerWidth, window.innerHeight)
        // scrn.drawImage(im, 0, 0, 15, 15)
        const SNOW_QUANTITY = 800
        if (pArr.length < SNOW_QUANTITY) {
            for (let i = pArr.length; i < SNOW_QUANTITY; i++) {
                pArr.push([(Math.random(0, 6) * (window.innerWidth + 90) - 100), Math.random() * window.innerHeight, 0, 0])
            }
        }
        for (let i = 0; i < SNOW_QUANTITY; i++) {
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
            let im2 = new Image()
            im2.src = "snowmound.png"
            scrn.drawImage(im2, 0, Math.max(-window.innerHeight, 300 - (ticks)))
        }
    }

}