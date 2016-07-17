/* We should totally be using dc for this project. http://dc-js.github.io/dc.js/ */

/* glogal reference objects */
/* colorSwatches should be shared between map.js & dashboard.js */
var colorSwatches = {
      source_eui_kbtu_ft2: ['#f2f0f7','#cbc9e2', '#9e9ac8', '#6a51a3'],
      site_eui_kbtu_ft2: ['#ffffe0','#ffa474','#db4551','#8b0000']
    };

var color = {
  source_eui_kbtu_ft2: d3.scale.threshold().range(colorSwatches.source_eui_kbtu_ft2)
}

/* categoryFilters should be shared between map.js & dashboard.js */
var categoryFilters = [
  'All',
  'Office',
  'Hotel',
  'Retail Store',
  'Other',
  'Mixed Use Property',
  'Non-Refrigerated Warehouse',
  'Worship Facility',
  'College/University',
  'Supermarket/Grocery Store',
  'Medical Office',
  'Manufacturing/Industrial Plant',
  'Distribution Center',
  'Automobile Dealership',
  'Restaurant',
  'N/A'
];

var width = parseInt(d3.select('#chart-histogram').style('width'))

/* Storing parcel data globally */
var returnedApiData = []

/* page state data */
var activeCategory = 'All'


/* pointers to dom elements */
var chartBubble = d3.select('#chart-bubble')

/* global chart objects */
var bubbles = scatterPlot()
  .width(width)
  .height(200)
  // .r(d3.scale.log())

/* get the data and render the page */
d3_queue.queue()
    .defer(d3.json, '../data/j2j3-acqj.json')  /* https://data.sfgov.org/resource/j2j3-acqj.json?$limit=2000 */
    .await(renderCharts)
function renderCharts (error, apiData) {
  returnedApiData = parseData(apiData)
  var euiVals = objArrayToSortedNumArray(apiDataToArray('latest_site_eui_kbtu_ft2')).filter(function (d) { return d > 0 && d < 1000})
  var scatterPlotVals = apiDataToXYR('latest_site_eui_kbtu_ft2', 'latest_total_ghg_emissions_metric_tons_co2e', 'floor_area')
  scatterPlotVals = scatterPlotVals.filter(function(d){ return d.x < 1000 })
  // debugger
  /* color assigned by quartile */
  color.source_eui_kbtu_ft2.domain(arrayQuartiles(euiVals))

  /* draw bubble chart for eui vs estimated cost <<do we even have the data for this? */
  /* draw bubble chart for eui vs greenhouse gases (ghg) instead */
  bubbles.colorScale(color.source_eui_kbtu_ft2)
  chartBubble.datum(scatterPlotVals).call(bubbles)
  // chartBubble.call(chartBubbleHighlight,-10)

  $("select[name='category-selector']").change(function(){dispatcher.changeCategory(this.value)})
}

function apiDataToXYR (xProp, yProp, rProp, categoryFilter) {
  var arr = returnedApiData
  if (categoryFilter && categoryFilter !== 'All') {
    arr = arr.filter(function(parcel){
      return parcel.property_type_self_selected === categoryFilter
    })
  }

  /* filter out values that don't exist */
  arr = arr.filter(function (parcel) {
    var thisparcel = [onlyNumbers(parcel[xProp]), onlyNumbers(parcel[yProp]), onlyNumbers(parcel[rProp])]
    return thisparcel.every(function (el) {return el > 0})
  })

  /* make the simplified xyr data array */
  arr = arr.map(function (parcel) {
    return { id: parcel.ID, x: +parcel[xProp], y: +parcel[yProp], r: +parcel[rProp] }
  })

  return arr
}


var dispatcher = d3.dispatch('changeCategory')
dispatcher.on('changeCategory', function(newCategory){
  // filterMapCategory(newCategory) /* only activates last filter selected */
  var estarVals = objArrayToSortedNumArray(apiDataToArray('latest_energy_star_score', newCategory)).filter(function (d) { return d > 0 })
  var euiVals = objArrayToSortedNumArray(apiDataToArray('latest_site_eui_kbtu_ft2', newCategory)).filter(function (d) { return d > 0 })

  color.energy_star_score.domain(arrayQuartiles(estarVals))
  color.source_eui_kbtu_ft2.domain(arrayQuartiles(euiVals))

  histogram.colorScale(color.energy_star_score)
  chartHistogram.datum(estarVals).call(histogram)
})


/* parseData() should be shared between map.js & dashboard.js */
function parseData (apiData) {
  var metrics = ['benchmark','energy_star_score','site_eui_kbtu_ft2','source_eui_kbtu_ft2','percent_better_than_national_median_site_eui','percent_better_than_national_median_source_eui','total_ghg_emissions_metric_tons_co2e','total_ghg_emissions_intensity_kgco2e_ft2','weather_normalized_site_eui_kbtu_ft2','weather_normalized_source_eui_kbtu_ft2']
  var re1 = /(.+)\//
  var re2 = /[\/\.](.+)/
  var spliceArray = []
  apiData.forEach(function (parcel, index) {
    if (parcel.parcel_s === undefined) {spliceArray.unshift(index); return parcel}
    if (! parcel.hasOwnProperty('property_type_self_selected') ) { parcel.property_type_self_selected = 'N/A'}
    parcel.parcel1 = re1.exec(parcel.parcel_s)[1]
    parcel.parcel2 = re2.exec(parcel.parcel_s)[1]
    parcel.blklot = '' + parcel.parcel1 + parcel.parcel2
    parcel.ID = parcel.blklot
    metrics.forEach(function (test) {
      parcel = latest(test, parcel)
    })
    return parcel
  })
  /* remove elements that have no parcel identifier */
  spliceArray.forEach(function (el) {
    apiData.splice(el,1)
  })
  return apiData
}

function latest (test, entry) {
  var years = [2011,2012,2013,2014,2015]
  if (test === 'benchmark') years.unshift(2010)
  var yearTest = years.map(function(d){
    if (test === 'benchmark') return 'benchmark_' + d + '_status'
    else return '_' + d + '_' + test
  })
  yearTest.forEach(function(year,i){
    if (entry[year] != null){
      entry['latest_'+test] = entry[year]
      entry['latest_'+test+'_year'] = years[i]
    }
    else {
      entry['latest_'+test] = entry['latest_'+test] || 'N/A'
      entry['latest_'+test+'_year'] = entry['latest_'+test+'_year'] || 'N/A'
    }
  })
  return entry
}

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

function onlyNumbers (val) {
  return (typeof parseInt(val) === 'number' && !isNaN(val)) ? parseInt(val) : -1
}

function objArrayToSortedNumArray (objArray) {
  return objArray.map(function (el){ return el.value }).sort(function (a,b) { return a - b })
}

function histogramHighlight (selection, data) {
  if( isNaN(data) ) data = -10
  var x = histogram.xScale(),
      y = histogram.yScale(),
      margin = histogram.margin(),
      width = histogram.width(),
      height = histogram.height()
  var svg = selection.select('svg')
  var hl = svg.select("g").selectAll('.highlight').data([data])
  hl.enter().append("rect").attr('class', 'highlight')
  hl.attr("width", 2)
    .attr("x", function(d) { return x(d) })
    .attr("y", 1)
    .attr("height", height - margin.top - margin.bottom )
    .attr('fill', 'blue' )
  hl.exit().remove()
}

function sortNumber (a,b) {
  return a - b;
}

function arrayQuartiles (sortedArr) {
  return [
    d3.quantile(sortedArr,0.25),
    d3.quantile(sortedArr,0.5),
    d3.quantile(sortedArr,0.75)
  ]
}

function addOption(el,i, arr){
  /*
  * takes an array of strings and creates an option
  * in the select element passed as 'this' in a forEach call:
  *   var foo = document.getElementById('foo')
  *   ['bar','baz', 'bar_baz'].forEach(addOption, foo)
  * creates <option value="bar">Bar</option>
  *         <option value="baz">Baz</option>
  *         <option value="bar_baz">Bar Baz</option>
  * inside the existing <select id="foo"></select>
  */
  var option = document.createElement("option")
  option.value = el
  option.text = el.replace(/_/,' ')
  this.appendChild(option)
}
