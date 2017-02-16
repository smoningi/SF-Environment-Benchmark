"use strict";

//TODO: CHANGE limit on returned properties in function propertyTypeQuery()
const DATASOURCE = 'j2j3-acqj' // ? '75rg-imyz'
const METRICS = ['benchmark','energy_star_score','site_eui_kbtu_ft2','source_eui_kbtu_ft2','percent_better_than_national_median_site_eui','percent_better_than_national_median_source_eui','total_ghg_emissions_metric_tons_co2e','total_ghg_emissions_intensity_kgco2e_ft2','weather_normalized_site_eui_kbtu_ft2','weather_normalized_source_eui_kbtu_ft2']
const BLK = /(.+)\//
const LOT = /[\/\.](.+)/

/* use soda-js to query */
let consumer = new soda.Consumer('data.sfgov.org')

let specificParcel = {parcel_s: '0267/009'}
let testquery = {
  columns: 'property_type_self_selected, parcel_s, floor_area',
  where: whereArray( 'Office', [100000, 200000] ),
  limit: 5
}

// console.log( formQueryString(testquery) )
// propertyQuery( 1, specificParcel, null, handleSingleBuildingResponse )
// propertyQuery( null, null, testquery, handlePropertyTypeResponse )
// propertyQuery( null, null, formQueryString(testquery), handlePropertyTypeResponse )




/**
* whereArray - form the 'where array' that goes into formQueryString
* @param {string} propertyType - property_type_self_selected
* @param {array} range - [min,max] of floor_area
* @returns {array} the 'where array'
*/
function whereArray(propertyType, range){
  let res = [
    "property_type_self_selected='" + propertyType + "'",
    'floor_area > ' + range[0],
    'floor_area < ' + range[1]
  ]
  return res
}

/**
* formQueryString - form a SOQL query string
* for multi-condition WHERE, otherwise use soda-js Consumer
* see https://dev.socrata.com/docs/queries/query.html
* @param {object} params - query params, limited in implementation
* @returns {string} the query string
*/
function formQueryString(params){
  let query = 'SELECT '

  if (params.columns){
    // params.columns is a string of comma separated column headings
    query += params.columns + ' '
  } else {
    query += '* '
  }

  if (params.where){
    // params.where is an array of conditions written out as strings
    query += 'WHERE ' + params.where[0] + ' '
    let i = 1, len = params.where.length
    if (len > 1){
      for (; i<len; i++) { query += 'AND ' + params.where[i] + ' ' }
    }
  }

  if (params.limit){
    //params.limit is an integer
    query += 'LIMIT ' + params.limit
  }

  return query
}

/**
* propertyQuery - query for a single parcel
* @param {number} limit - how many entries to return
* @param {object} whereparams - query params, generally of the form {parcel_s: "####/###"} or {property_type_self_selected: "Office"}
* @param {function} handler - callback handler function for returned json
* @returns some sort of promise
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
  // let res = rows.map(parseSingleRecord)
  // res.forEach((el)=>{return console.log(el.property_type_self_selected, el.floor_area)})
  console.log(rows)
}

/**
* parseSingleRecord - parse the returned property record object
* @param {object} record - the record object returned from SODA
* @returns {object} the record with some new properties
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
* @returns {object} the record with some new properties
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
