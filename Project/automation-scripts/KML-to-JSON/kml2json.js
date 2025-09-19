/*
* Using this program: 
* It assumes that you have an in/ and out/ folder, and its default state is to pull the KML data from in/project.kml.
* If you want to use a different KML file, use the command line argument -n with the name of the file.
* It will save to out/places.json with a JSON file containing an array of places with names, latitude and longitude.
* to use this program, run 'node kml2json.js [args]'
* that's it i guess
* uhhhhhhh
*/
const fs = require('fs')
const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");
const parser = new XMLParser()

let outputJSON = {}

let readFrom = "in/project.kml"

process.argv.forEach((val, index) => {
    if (val == "-n") {
        readFrom = process.argv[index + 1]
    }
});

let places = parser.parse(fs.readFileSync(readFrom)).kml.Document.Placemark

if (outputType = "list") {
    outputJSON = []
    for (let i of places) {
        outputJSON.push({
            name: i.name,
            latitude: i.LookAt.latitude,
            longitude: i.LookAt.longitude
        })
    }
}

fs.writeFileSync("out/places.json", JSON.stringify(outputJSON))