"use strict";

//TODO: CHANGE limit on returned properties in function propertyTypeQuery()
const DATASOURCE = 'j2j3-acqj'
const METRICS = ['benchmark','energy_star_score','site_eui_kbtu_ft2','source_eui_kbtu_ft2','percent_better_than_national_median_site_eui','percent_better_than_national_median_source_eui','total_ghg_emissions_metric_tons_co2e','total_ghg_emissions_intensity_kgco2e_ft2','weather_normalized_site_eui_kbtu_ft2','weather_normalized_source_eui_kbtu_ft2']
const BLK = /(.+)\//
const LOT = /[\/\.](.+)/

/* use soda-js to query */
let consumer = new soda.Consumer('data.sfgov.org')

// /* Storing parcel data globally */
let returnedApiData = []

// singleBuildingQuery({ parcel_s: '0267/009' });
// propertyTypeQuery( {property_type_self_selected: "Office"} )

/**
* singleBuildingQuery - query for a single parcel
* @param {object} params - query params, generally of the form {parcel_s: "####/###"}
*/
function singleBuildingQuery(params) {
  consumer.query()
    .withDataset(DATASOURCE)
    .limit(1)
    .where(params)
    .getRows()
      // this might be starting down the road to callback hell
      .on('success', handleSingleBuildingResponse)
      .on('error', function(error) { console.error(error); });
}

/**
* handleSingleBuildingResponse - do something with the returned data
* @param {array} rows - returned from consumer.query.getRows
*/
function handleSingleBuildingResponse(rows) {
  console.log(rows[0]);
}


/**
* propertyTypeQuery - query all parcels with a certain property type
* @param {object} params - query params, generally of the form {property_type_self_selected: "string"}
*/
function propertyTypeQuery(params) {
  consumer.query(params)
    .withDataset(DATASOURCE)
    .limit(10) //arbitrary, but bigger than the number of buildings as of 2017-02-11
    .where(params)
    .getRows()
      // this might be starting down the road to callback hell
      .on('success', handlePropertyTypeResponse)
      .on('error', function(error) { console.error(error); });
}

/**
* handlePropertyTypeResponse - do something with the returned data
* @param {array} rows - returned from consumer.query.getRows
*/
function handlePropertyTypeResponse(rows) {
  console.log(rows);
}

let testJSON = JSON.parse('[{"_2010_reason_for_exemption":"Exempt - SqFt Not Subject This Year","_2011_reason_for_exemption":"Exempt - SqFt Not Subject This Year","_2014_energy_star_score":"16","_2014_percent_better_than_national_median_site_eui":"49.6","_2014_percent_better_than_national_median_source_eui":"49.6","_2014_site_eui_kbtu_ft2":"108","_2014_source_eui_kbtu_ft2":"189.2","_2014_total_ghg_emissions_intensity_kgco2e_ft2":"6.8","_2014_total_ghg_emissions_metric_tons_co2e":"95.4","_2014_weather_normalized_site_eui_kbtu_ft2":"110.1","_2014_weather_normalized_source_eui_kbtu_ft2":"191.4","_2015_energy_star_score":"27","_2015_percent_better_than_national_median_site_eui":"28","_2015_percentage_better_than_national_median_source_eui":"28","_2015_site_eui_kbtu_ft2":"95.4","_2015_source_eui_kbtu_ft2":"165","_2015_total_ghg_emissions_intensity_kgco2e_ft2":"6","_2015_total_ghg_emissions_metric_tons_co2e":"83.9","_2015_weather_normalized_site_eui_kbtu_ft2":"95.4","_2015_weather_normalized_source_eui_kbtu_ft2":"165","benchmark_2010_status":"Exempt","benchmark_2011_status":"Exempt","benchmark_2012_status":"Complied","benchmark_2013_status":"Violation - Did Not Report","benchmark_2014_status":"Complied","benchmark_2015_status":"Complied","building_address":"130 BUSH ST","building_name":"The Heineman Building (130 Bush St)","energy_audit_due_date":"4/1/2013","energy_audit_status":"Complied","floor_area":"14100","full_address":{"type":"Point","coordinates":[-122.400143,37.791259]},"full_address_address":"130 BUSH ST","full_address_city":"San Francisco","full_address_state":"CA","full_address_zip":"94104","parcel_s":"0267/009","pim_link":"http://propertymap.sfplanning.org/?&search=0267/009","postal_code":"94104","property_type_self_selected":"Office"}]');


console.log( parseSingleRecord(testJSON[0]) )

function parseSingleRecord(record){
  if (record.parcel_s === undefined) {return null}
  if (! record.hasOwnProperty('property_type_self_selected') ) { record.property_type_self_selected = 'N/A'}
  record.parcel1 = BLK.exec(record.parcel_s)[1]
  record.parcel2 = LOT.exec(record.parcel_s)[1]
  record.blklot = '' + record.parcel1 + record.parcel2
  record.ID = '' + record.blklot
  METRICS.forEach(function (metric) {
    record = latest(metric, record)
  })
  return record
}

function latest (metric, entry) {
  var years = [2011,2012,2013,2014,2015]
  if (metric === 'benchmark') years.unshift(2010)
  var yearTest = years.map(function(d){
    if (metric === 'benchmark') return 'benchmark_' + d + '_status'
    else return '_' + d + '_' + metric
  })
  yearTest.forEach(function(year,i){
    if (entry[year] != null){
      entry['latest_'+metric] = entry[year]
      entry['latest_'+metric+'_year'] = years[i]
    }
    else {
      entry['latest_'+metric] = entry['latest_'+metric] || 'N/A'
      entry['latest_'+metric+'_year'] = entry['latest_'+metric+'_year'] || 'N/A'
    }
  })
  return entry
}

// function apiDataToArray (prop, categoryFilter) {
//   var arr = returnedApiData
//   if (categoryFilter && categoryFilter !== 'All') {
//     arr = arr.filter(function(parcel){
//       return parcel.property_type_self_selected === categoryFilter
//     })
//   }
//   arr = arr.map(function (parcel) {
//     // if ( typeof parcel != 'object' || parcel === 'null' ) continue
//     var onlyNumbers = (typeof parseInt(parcel[prop]) === 'number' && !isNaN(parcel[prop])) ? parseInt(parcel[prop]) : -1
//     return {id: parcel.ID, value: onlyNumbers}
//   })
//   return arr
// }

// function digestData (categoryFilter) {
//   var arr = returnedApiData
//   if (categoryFilter && categoryFilter !== 'All') {
//     arr = arr.filter(function(parcel){
//       return parcel.property_type_self_selected === categoryFilter
//     })
//   }
//   var result = arr.reduce(function (prev, curr) {
//     // # of Properties
//     // SF of floor area
//     // Energy Like for Like 2013-2014 (418 properties)
//     // Total GHG Emissions (MT CO2e)
//     // Compliance Rate
//     return {
//       count: prev.count + 1,
//       floor_area: prev.floor_area + +curr.floor_area,
//       total_ghg: (isNaN(+curr.latest_total_ghg_emissions_metric_tons_co2e)) ? prev.total_ghg : prev.total_ghg + +curr.latest_total_ghg_emissions_metric_tons_co2e,
//       compliance: (curr.latest_benchmark === 'Complied') ? prev.compliance + 1 : prev.compliance
//     }
//   }, {count:0,floor_area:0,total_ghg:0,compliance:0})
//   result.compliance = roundToTenth(100*(result.compliance/result.count))
//   result.total_ghg = roundToTenth(result.total_ghg)
//   result.type = categoryFilter
//   return result
// }

function onlyNumbers (val) {
  return (typeof parseInt(val) === 'number' && !isNaN(val)) ? parseInt(val) : -1
}

function objArrayToSortedNumArray (objArray) {
  return objArray.map(function (el){ return el.value }).sort(function (a,b) { return a - b })
}

function anyPropNA (obj) {
  var result = false
  for (var prop in obj) {
    if (obj[prop] === "N/A") result = true
  }
  return result
}

function sortNumber (a,b) {
  return a - b;
}

function roundToTenth (num){
  return Math.round(10*num)/10
}

function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

