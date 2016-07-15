'use strict'
const fs = require('fs');

let inputFile = 'citylots_merge.geojson',
    inputData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
let outputFile = "justGeo.geojson",
    outputData = {};

inputData.features.forEach(function(feature) {
  for (var prop in feature.properties) {
    if (prop != 'parcel_s')
      delete feature.properties[prop]
  }
})

writeToFile(inputData, outputFile);

function writeToFile(obj, filename){
  fs.writeFile(filename, JSON.stringify(obj), function(err) {
    if(err) {
      console.log('error saving document', err)
    } else {
      console.log('File saved as ' + filename)
    }
  })
}


