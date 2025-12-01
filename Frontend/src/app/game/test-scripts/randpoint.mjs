/*  This takes the perimeter of a polygon surrounding campus (defined by the perimeter variable defined below, outlined on Google Earth) and constructs as series of line segments from poinst.
It then creates a rectangle that surrounds that polygon entirely.

The getRandomPoint() function will repeatedly find a random point within that rectangle (lat/long) and then uses the even/odd rule to see if it is inside or outside of the polygon (essentially, how many times does it intersect the lines making up the polygon; if that's an even number, then you're outside, but if it's odd you're inside)

If it is, then it returns that lat/long point, otherwise it tries again.
I tested this with ~200 randomly generated points and they all were within the bounds of the polygon.

yay!
This should be reasonably easy to implement in the API call shown by google where you put in a lat and long to get a street view sphere thing

*/

let perimeter = [-88.22890608313011, 40.11628634808123, -88.22891244184002, 40.11034654381944, -88.23359201253385, 40.1102963974153, -88.23347059805408, 40.10542714838154, -88.23869368049655, 40.1054234572026, -88.24153454063733, 40.10537880417714, -88.24142112908335, 40.09442913338193, -88.23316532260186, 40.09449349111972, -88.22377233222194, 40.09457680061792, -88.21902433737426, 40.0945958373946, -88.21900309632787, 40.09082864149104, -88.21424489065865, 40.09094484330869, -88.21426804467058, 40.08855464696899, -88.20946518144682, 40.08851363540236, -88.2096394677189, 40.09837330686159, -88.21905997811407, 40.09820789899142, -88.21918599523089, 40.10425849262996, -88.21931193198679, 40.11091015340119, -88.21931973263258, 40.11295445208442, -88.22404263441631, 40.11281434241015, -88.22411159462452, 40.11634457296581, -88.22890608313011, 40.11628634808123]

let lineSegments = []

for (let i = 0; i < perimeter.length - 2; i += 2) {
    lineSegments.push({ start: { long: perimeter[i], lat: perimeter[i + 1] }, end: { long: perimeter[i + 2], lat: perimeter[i + 3] } })
}
// console.log(lineSegments)

//top left: 40°06'58"N 88°14'32"W
//bottom right: 40°05'18"N 88°12'34"W
//bot

let boundingData = { topLongitude: -88.24238428986186, topLatitude: 40.11611769953682, bottomLongitude: -88.20952176360476, bottomLatitude: 40.08842958076448 }

export function getRandomPoint() {
    let randomPoint
    let WARN = 0
    while (WARN < 1000) {
        randomPoint = {
            lat: (Math.random() * (boundingData.bottomLatitude - boundingData.topLatitude)) + boundingData.topLatitude,
            long: (Math.random() * (boundingData.topLongitude - boundingData.bottomLongitude)) + boundingData.bottomLongitude
        }
        //test point to see if it is within the polygon as described by lineSegments.
        //Draw a straight line from randomPoint to topLongitude, point's latitude.
        //Test to see how many times it intersects with a line segment in lineSegments
        //if odd, inside, return
        //if even, outside, keep going

        //from https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Given_two_points_on_each_line_segment
        let numIntersections = 0
        for (let i = 0; i < lineSegments.length; i++) {
            let x1 = randomPoint.long
            let x2 = boundingData.topLongitude
            let x3 = lineSegments[i].start.long
            let x4 = lineSegments[i].end.long
            let y1 = randomPoint.lat
            let y2 = boundingData.topLatitude
            let y3 = lineSegments[i].start.lat
            let y4 = lineSegments[i].end.lat
            let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4))

            let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4))

            if ((t >= 0 && t <= 1) && (0 <= u && u <= 1)) {
                numIntersections++
            }

        }
        if (numIntersections % 2 == 1) {
            return randomPoint
        }
        WARN++
    }
    if (WARN > 999) {
        console.log("uh-oh :(")
    }
    return randomPoint
}

for (let i = 0; i < 100; i++) {
    let p = getRandomPoint()
    console.log(p.lat.toString().substring(0, 6) + ", " + p.long.toString().substring(0, 7))
}

//when making the random point fit for consumption, please refer to https://xkcd.com/2170 :D