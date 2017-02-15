"use strict";

//TODO: CHANGE limit on returned properties in function propertyTypeQuery()
const DATASOURCE = 'j2j3-acqj'
const METRICS = ['benchmark','energy_star_score','site_eui_kbtu_ft2','source_eui_kbtu_ft2','percent_better_than_national_median_site_eui','percent_better_than_national_median_source_eui','total_ghg_emissions_metric_tons_co2e','total_ghg_emissions_intensity_kgco2e_ft2','weather_normalized_site_eui_kbtu_ft2','weather_normalized_source_eui_kbtu_ft2']
const BLK = /(.+)\//
const LOT = /[\/\.](.+)/

let testJSON  = JSON.parse('[{"_2010_reason_for_exemption":"Exempt - SqFt Not Subject This Year","_2011_reason_for_exemption":"Exempt - SqFt Not Subject This Year","_2014_energy_star_score":"16","_2014_percent_better_than_national_median_site_eui":"49.6","_2014_percent_better_than_national_median_source_eui":"49.6","_2014_site_eui_kbtu_ft2":"108","_2014_source_eui_kbtu_ft2":"189.2","_2014_total_ghg_emissions_intensity_kgco2e_ft2":"6.8","_2014_total_ghg_emissions_metric_tons_co2e":"95.4","_2014_weather_normalized_site_eui_kbtu_ft2":"110.1","_2014_weather_normalized_source_eui_kbtu_ft2":"191.4","_2015_energy_star_score":"27","_2015_percent_better_than_national_median_site_eui":"28","_2015_percentage_better_than_national_median_source_eui":"28","_2015_site_eui_kbtu_ft2":"95.4","_2015_source_eui_kbtu_ft2":"165","_2015_total_ghg_emissions_intensity_kgco2e_ft2":"6","_2015_total_ghg_emissions_metric_tons_co2e":"83.9","_2015_weather_normalized_site_eui_kbtu_ft2":"95.4","_2015_weather_normalized_source_eui_kbtu_ft2":"165","benchmark_2010_status":"Exempt","benchmark_2011_status":"Exempt","benchmark_2012_status":"Complied","benchmark_2013_status":"Violation - Did Not Report","benchmark_2014_status":"Complied","benchmark_2015_status":"Complied","building_address":"130 BUSH ST","building_name":"The Heineman Building (130 Bush St)","energy_audit_due_date":"4/1/2013","energy_audit_status":"Complied","floor_area":"14100","full_address":{"type":"Point","coordinates":[-122.400143,37.791259]},"full_address_address":"130 BUSH ST","full_address_city":"San Francisco","full_address_state":"CA","full_address_zip":"94104","parcel_s":"0267/009","pim_link":"http://propertymap.sfplanning.org/?&search=0267/009","postal_code":"94104","property_type_self_selected":"Office"}]');
let test2JSON = JSON.parse('[{"_2010_reason_for_exemption":"Exempt - SqFt Not Subject This Year","_2011_reason_for_exemption":"Exempt - SqFt Not Subject This Year","_2014_energy_star_score":"16","_2014_percent_better_than_national_median_site_eui":"49.6","_2014_percent_better_than_national_median_source_eui":"49.6","_2014_site_eui_kbtu_ft2":"108","_2014_source_eui_kbtu_ft2":"189.2","_2014_total_ghg_emissions_intensity_kgco2e_ft2":"6.8","_2014_total_ghg_emissions_metric_tons_co2e":"95.4","_2014_weather_normalized_site_eui_kbtu_ft2":"110.1","_2014_weather_normalized_source_eui_kbtu_ft2":"191.4","_2015_energy_star_score":"27","_2015_percent_better_than_national_median_site_eui":"28","_2015_percentage_better_than_national_median_source_eui":"28","_2015_site_eui_kbtu_ft2":"95.4","_2015_source_eui_kbtu_ft2":"165","_2015_total_ghg_emissions_intensity_kgco2e_ft2":"6","_2015_total_ghg_emissions_metric_tons_co2e":"83.9","_2015_weather_normalized_site_eui_kbtu_ft2":"95.4","_2015_weather_normalized_source_eui_kbtu_ft2":"165","benchmark_2010_status":"Exempt","benchmark_2011_status":"Exempt","benchmark_2012_status":"Complied","benchmark_2013_status":"Violation - Did Not Report","benchmark_2014_status":"Complied","benchmark_2015_status":"Complied","building_address":"130 BUSH ST","building_name":"The Heineman Building (130 Bush St)","energy_audit_due_date":"4/1/2013","energy_audit_status":"Complied","floor_area":"14100","full_address":{"type":"Point","coordinates":[-122.400143,37.791259]},"full_address_address":"130 BUSH ST","full_address_city":"San Francisco","full_address_state":"CA","full_address_zip":"94104","parcel_s":"0267/009","pim_link":"http://propertymap.sfplanning.org/?&search=0267/009","postal_code":"94104","property_type_self_selected":"Office"},{"_2010_reason_for_exemption":"Exempt - SqFt Not Subject This Year","_2011_reason_for_exemption":"Exempt - SqFt Not Subject This Year","_2013_percent_better_than_national_median_site_eui":"-76.7","_2013_percent_better_than_national_median_source_eui":"-76.7","_2013_site_eui_kbtu_ft2":"14.4","_2013_source_eui_kbtu_ft2":"34.5","_2013_total_ghg_emissions_intensity_kgco2e_ft2":"1","_2013_total_ghg_emissions_metric_tons_co2e":"16.6","_2013_weather_normalized_site_eui_kbtu_ft2":"14.6","_2013_weather_normalized_source_eui_kbtu_ft2":"34.7","_2014_percent_better_than_national_median_site_eui":"-69.5","_2014_percent_better_than_national_median_source_eui":"-69.5","_2014_site_eui_kbtu_ft2":"16.5","_2014_source_eui_kbtu_ft2":"45.1","_2014_total_ghg_emissions_intensity_kgco2e_ft2":"1.3","_2014_total_ghg_emissions_metric_tons_co2e":"20.3","_2014_weather_normalized_site_eui_kbtu_ft2":"18.1","_2014_weather_normalized_source_eui_kbtu_ft2":"46.7","_2015_energy_star_score":"98","_2015_percent_better_than_national_median_site_eui":"-61.4","_2015_percentage_better_than_national_median_source_eui":"-61.4","_2015_site_eui_kbtu_ft2":"18.8","_2015_source_eui_kbtu_ft2":"53.3","_2015_total_ghg_emissions_intensity_kgco2e_ft2":"1.5","_2015_total_ghg_emissions_metric_tons_co2e":"23.5","_2015_weather_normalized_site_eui_kbtu_ft2":"19.1","_2015_weather_normalized_source_eui_kbtu_ft2":"53.6","benchmark_2010_status":"Exempt","benchmark_2011_status":"Exempt","benchmark_2012_status":"Violation - Did Not Report","benchmark_2013_status":"Complied","benchmark_2014_status":"Complied","benchmark_2015_status":"Complied","building_address":"1045 17TH ST","building_name":"1045 17TH ST","energy_audit_due_date":"4/1/2013","energy_audit_status":"Complied","floor_area":"16162","full_address":{"type":"Point","coordinates":[-122.39455,37.765277]},"full_address_address":"1045 17TH ST","full_address_city":"San Francisco","full_address_state":"CA","full_address_zip":"94107","parcel_s":"3987/008","pim_link":"http://propertymap.sfplanning.org/?&search=3987/008","postal_code":"94107","property_type_self_selected":"Office"},{"_2011_energy_star_score":"100","_2011_percent_better_than_national_median_site_eui":"-73.4","_2011_site_eui_kbtu_ft2":"39","_2011_total_ghg_emissions_metric_tons_co2e":"243.78","_2011_weather_normalized_site_eui_kbtu_ft2":"39","_2013_energy_star_score":"100","_2013_percent_better_than_national_median_site_eui":"-75.9","_2013_percent_better_than_national_median_source_eui":"-75.9","_2013_site_eui_kbtu_ft2":"23.4","_2013_source_eui_kbtu_ft2":"46.9","_2013_total_ghg_emissions_intensity_kgco2e_ft2":"1.5","_2013_total_ghg_emissions_metric_tons_co2e":"142.4","_2013_weather_normalized_site_eui_kbtu_ft2":"23.8","_2013_weather_normalized_source_eui_kbtu_ft2":"47.2","_2014_energy_star_score":"100","_2014_percent_better_than_national_median_site_eui":"-74.4","_2014_percent_better_than_national_median_source_eui":"-74.4","_2014_site_eui_kbtu_ft2":"22.6","_2014_source_eui_kbtu_ft2":"48.5","_2014_total_ghg_emissions_intensity_kgco2e_ft2":"1.5","_2014_total_ghg_emissions_metric_tons_co2e":"141.5","_2014_weather_normalized_site_eui_kbtu_ft2":"25","_2014_weather_normalized_source_eui_kbtu_ft2":"51","_2015_energy_star_score":"100","_2015_percent_better_than_national_median_site_eui":"-78","_2015_percentage_better_than_national_median_source_eui":"-78","_2015_site_eui_kbtu_ft2":"19.7","_2015_source_eui_kbtu_ft2":"42.3","_2015_total_ghg_emissions_intensity_kgco2e_ft2":"1.3","_2015_total_ghg_emissions_metric_tons_co2e":"123.3","_2015_weather_normalized_site_eui_kbtu_ft2":"20.9","_2015_weather_normalized_source_eui_kbtu_ft2":"43.6","benchmark_2010_status":"Complied","benchmark_2011_status":"Complied","benchmark_2012_status":"Violation - Did Not Report","benchmark_2013_status":"Complied","benchmark_2014_status":"Complied","benchmark_2015_status":"Complied","building_address":"1663 MISSION ST","building_name":"Speyer & Schwartz","energy_audit_due_date":"4/1/2013","energy_audit_status":"Complied","floor_area":"91995","full_address":{"type":"Point","coordinates":[-122.419537,37.771303]},"full_address_address":"1663 MISSION ST","full_address_city":"San Francisco","full_address_state":"CA","full_address_zip":"94103","parcel_s":"3514/030","pim_link":"http://propertymap.sfplanning.org/?&search=3514/030","postal_code":"94103","property_type_self_selected":"Office"},{"_2010_reason_for_exemption":"Exempt - SqFt Not Subject This Year","_2012_energy_star_score":"77","_2012_percent_better_than_national_median_site_eui":"-29.2","_2012_site_eui_kbtu_ft2":"69.2","_2012_source_eui_kbtu_ft2":"157.2","_2012_total_ghg_emissions_metric_tons_co2e":"236","_2012_weather_normalized_site_eui_kbtu_ft2":"69.8","_2012_weather_normalized_source_eui_kbtu_sq_ft":"159.2","_2013_energy_star_score":"87","_2013_site_eui_kbtu_ft2":"59.4","_2013_source_eui_kbtu_ft2":"130.8","_2013_total_ghg_emissions_intensity_kgco2e_ft2":"4.1","_2013_total_ghg_emissions_metric_tons_co2e":"189.8","_2013_weather_normalized_site_eui_kbtu_ft2":"59.6","_2013_weather_normalized_source_eui_kbtu_ft2":"131","_2014_energy_star_score":"72","_2014_site_eui_kbtu_ft2":"72.9","_2014_source_eui_kbtu_ft2":"166.3","_2014_total_ghg_emissions_intensity_kgco2e_ft2":"5.1","_2014_total_ghg_emissions_metric_tons_co2e":"236.6","_2014_weather_normalized_site_eui_kbtu_ft2":"72.9","_2014_weather_normalized_source_eui_kbtu_ft2":"166.3","_2015_energy_star_score":"71","_2015_site_eui_kbtu_ft2":"74.9","_2015_source_eui_kbtu_ft2":"169","_2015_total_ghg_emissions_intensity_kgco2e_ft2":"5.2","_2015_total_ghg_emissions_metric_tons_co2e":"241.8","_2015_weather_normalized_site_eui_kbtu_ft2":"75.7","_2015_weather_normalized_source_eui_kbtu_ft2":"168.7","benchmark_2010_status":"Exempt","benchmark_2011_status":"Complied","benchmark_2012_status":"Complied","benchmark_2013_status":"Complied","benchmark_2014_status":"Complied","benchmark_2015_status":"Complied","building_address":"620 FOLSOM ST","building_name":"620 Folsom Street","energy_audit_due_date":"11/15/2012","energy_audit_status":"Complied","floor_area":"46451","full_address":{"type":"Point","coordinates":[-122.397382,37.785018]},"full_address_address":"620 FOLSOM ST","full_address_city":"San Francisco","full_address_state":"CA","full_address_zip":"94105","parcel_s":"3735/010","pim_link":"http://propertymap.sfplanning.org/?&search=3735/010","postal_code":"94105","property_type_self_selected":"Office"},{"_2010_reason_for_exemption":"Exempt - SqFt Not Subject This Year","_2011_reason_for_exemption":"Exempt - SqFt Not Subject This Year","_2013_energy_star_score":"20","_2013_percent_better_than_national_median_site_eui":"40","_2013_percent_better_than_national_median_source_eui":"40","_2013_site_eui_kbtu_ft2":"106.9","_2013_source_eui_kbtu_ft2":"305.6","_2013_total_ghg_emissions_intensity_kgco2e_ft2":"8.3","_2013_total_ghg_emissions_metric_tons_co2e":"116.3","_2013_weather_normalized_site_eui_kbtu_ft2":"104.4","_2013_weather_normalized_source_eui_kbtu_ft2":"303","_2014_energy_star_score":"20","_2014_percent_better_than_national_median_site_eui":"40.8","_2014_percent_better_than_national_median_source_eui":"40.8","_2014_site_eui_kbtu_ft2":"104.2","_2014_source_eui_kbtu_ft2":"297.9","_2014_total_ghg_emissions_intensity_kgco2e_ft2":"8.1","_2014_total_ghg_emissions_metric_tons_co2e":"113.4","_2014_weather_normalized_site_eui_kbtu_ft2":"108.9","_2014_weather_normalized_source_eui_kbtu_ft2":"302.8","_2015_energy_star_score":"27","_2015_site_eui_kbtu_ft2":"100.8","_2015_source_eui_kbtu_ft2":"284.2","_2015_total_ghg_emissions_intensity_kgco2e_ft2":"7.8","_2015_total_ghg_emissions_metric_tons_co2e":"108.9","_2015_weather_normalized_site_eui_kbtu_ft2":"102.4","_2015_weather_normalized_source_eui_kbtu_ft2":"285.8","benchmark_2010_status":"Exempt","benchmark_2011_status":"Exempt","benchmark_2012_status":"Complied","benchmark_2013_status":"Complied","benchmark_2014_status":"Complied","benchmark_2015_status":"Complied","building_address":"455 9TH ST","building_name":"455 9TH ST","energy_audit_due_date":"4/1/2014","energy_audit_status":"Complied","floor_area":"14000","full_address":{"type":"Point","coordinates":[-122.40918,37.771787]},"full_address_address":"455 9TH ST","full_address_city":"San Francisco","full_address_state":"CA","full_address_zip":"94103","parcel_s":"3757/046","pim_link":"http://propertymap.sfplanning.org/?&search=3757/046","postal_code":"94103","property_type_self_selected":"Office"}]');

/* use soda-js to query */
let consumer = new soda.Consumer('data.sfgov.org')

let specificParcel = {parcel_s: '0267/009'}
let whereOffice = {property_type_self_selected: "Office"}
let testquery = "SELECT * WHERE property_type_self_selected='Office' AND floor_area > 100000 AND floor_area < 200000 LIMIT 5"
// see https://dev.socrata.com/docs/queries/query.html

// propertyQuery( 1, specificParcel, null, handleSingleBuildingResponse )
// propertyQuery( 10, whereOffice, null, handlePropertyTypeResponse )
propertyQuery( null, null, testquery, handlePropertyTypeResponse )





/**
* propertyQuery - query for a single parcel
* @param {number} limit - how many entries to return
* @param {object} whereparams - query params, generally of the form {parcel_s: "####/###"} or {property_type_self_selected: "Office"}
* @param {function} handler - callback handler function for returned json
*/
function propertyQuery(limit, whereparams, soqlQuery, handler) {
  consumer.query()
    .withDataset(DATASOURCE)
    .limit(limit)
    .where(whereparams)
    .soql(soqlQuery)
    .getRows()
      // this might be starting down the road to callback hell
      .on('success', handler)
      .on('error', function(error) { console.error(error); });
}

/**
* handleSingleBuildingResponse - do something with the returned data
* @param {array} rows - returned from consumer.query.getRows
*/
function handleSingleBuildingResponse(rows) {
  let res = parseSingleRecord(rows[0])
  console.log(res)
}

/**
* handlePropertyTypeResponse - do something with the returned data
* @param {array} rows - returned from consumer.query.getRows
*/
function handlePropertyTypeResponse(rows) {
  let res = rows.map(parseSingleRecord)
  res.forEach((el)=>{return console.log(el.property_type_self_selected, el.floor_area)})
  // console.log(res)
}

/**
* parseSingleRecord - parse the returned property record object
* @param {object} record - the record object returned from SODA
*/
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

/**
* latest - query for a single parcel
* @param {string} metric - the parcel metric being recorded
* @param {object} entry - the parcel record object
*/
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

/**
* apiDataToArray - digest record array to get
* @param {string} prop -
* @param {string} categoryFilter -
*/
function apiDataToArray (prop, categoryFilter) {
  var arr = returnedApiData
  if (categoryFilter && categoryFilter !== 'All') {
    arr = arr.filter(function(parcel){
      return parcel.property_type_self_selected === categoryFilter
    })
  }
  arr = arr.map(function (parcel) {
    // if ( typeof parcel != 'object' || parcel === 'null' ) continue
    var onlyNumbers = (typeof parseInt(parcel[prop]) === 'number' && !isNaN(parcel[prop])) ? parseInt(parcel[prop]) : -1
    return {id: parcel.ID, value: onlyNumbers}
  })
  return arr
}

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





/****** helper functions *******/
function onlyNumbers (val) {
  return (typeof parseInt(val) === 'number' && !isNaN(val)) ? parseInt(val) : -1
}

// function objArrayToSortedNumArray (objArray) {
//   return objArray.map(function (el){ return el.value }).sort(function (a,b) { return a - b })
// }

// function anyPropNA (obj) {
//   var result = false
//   for (var prop in obj) {
//     if (obj[prop] === "N/A") result = true
//   }
//   return result
// }

// function sortNumber (a,b) {
//   return a - b;
// }

// function roundToTenth (num){
//   return Math.round(10*num)/10
// }

// function numberWithCommas(x) {
//     var parts = x.toString().split(".");
//     parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//     return parts.join(".");
// }
