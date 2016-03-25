/**
 * Created by Sanat Moningi
 */
// data source: https://data.sfgov.org/Energy-and-Environment/Existing-Commercial-Buildings-Energy-Performance-O/j2j3-acqj
var colorSwatches = ["#8b0000", "#db4551", "#ffa474", "#ffffe0"]
var color = d3.scale.quantize()
    .domain([0, 100])
    .range(colorSwatches);

//Setting up leaflet map
var map = L.map('map').setView([37.7833, -122.4167], 14);
//Storing parcel data globally
var returnedApiData = [];
var color; //Color bins

//Getting tile from Mapbox
L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.dark/{z}/{x}/{y}.png?access_token={accessToken}', {
    maxZoom: 18,
    minZoom: 13,
    attributionControl: false,
    id: 'smoningi.a304c3dc',
    accessToken: 'pk.eyJ1Ijoic21vbmluZ2kiLCJhIjoiQ21rN1pjSSJ9.WKrPFjjb7LRMBjyban698g'
}).addTo(map);

// Add Legend
var legend = L.control({position:'bottomleft'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend');
    div.innerHTML += "<div><b>Energy Star Score</b></div>"
    div.innerHTML += "<i style=\"background:"+colorSwatches[3]+";\"></i> <b>75-100</b> <br/>";
    div.innerHTML += "<i style=\"background:"+colorSwatches[2]+";\"></i> <b>50-75</b><br/>";
    div.innerHTML += "<i style=\"background:"+colorSwatches[1]+";\"></i> <b>25-50</b> <br/>";
    div.innerHTML += "<i style=\"background:"+colorSwatches[0]+";\"></i> <b>0-25</b><br/>";
    return div;
};
legend.addTo(map);

var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

var score = document.getElementById('score');

d3_queue.queue()
    .defer(d3.json, "api_return.json")  /* https://data.sfgov.org/resource/j2j3-acqj.json?$limit=2000 */
    .defer(d3.json, "justGeo.geojson")
    .await(mapDraw)

function mapDraw(err, apiData, collection){
    returnedApiData = parseData(apiData)
    collection.features.forEach(function(feature){
      var data = returnedApiData.find(function(el){
        return el.parcel_s === feature.properties.parcel_s
      })
      if (data != undefined) feature.properties = data
    })

    var transform = d3.geo.transform({point: projectPoint}),
        path = d3.geo.path().projection(transform);
    var feature = g.selectAll("path")
        .data(collection.features)
        .enter()
        .append("path")
        .attr("id", function(d){
          return d.properties.ID;
        })
        .style("stroke", "#B9E7FF")
        .style("fill", function(d){
          return color(parseInt(d.properties.latest_energy_star_score));
        })
        .style("fill-opacity", 0.5)
        .style("stroke-width",0.1)
        .on("mouseover", function(d){
          d3.select(this).style("fill-opacity",1)
            .style("stroke", "#FFCC33")
            .style("stroke-width",2);
          updateScorebox(d);
          d3.select("#compare-chart").call(histogramHighlight,d.properties.latest_energy_star_score)
        })
        .on("mouseout", function(d){
          d3.select(this).style("stroke", "#B9E7FF")
            .style("fill", function(d){
              return color(parseInt(d.properties.latest_energy_star_score));
            })
            .style("fill-opacity", 0.5)
            .style("stroke-width",0.1);
        });

    map.on("viewreset", reset);
    reset();

    var chartData = apiDataToArray('latest_energy_star_score')
    var values = chartData.map(function(d) {return d.value})
                          .filter(function(d) {return d > 0})
    var histogram = histogramChart()
      .width(280)
      .height(100)
      .range([0,104])
      .bins(50)
      .color(colorSwatches)
    d3.select("#compare-chart")
      .datum(values)
    .call(histogram)

    d3.select("#compare-chart").call(histogramHighlight,-10)

    // //demonstrates how to update the histogram chart with new data
    // chartData = apiDataToArray('latest_total_ghg_emissions_intensity_kgco2e_ft2')
    // values = chartData.map(function(d) {return d.value})
    //                   .filter(function(d) {return d > 0})
    // color.domain( d3.extent(values.map(function(d) { return d.x; })) )
    // d3.select("#compare-chart")
    //   .datum(values)
    //   .call(histogramChart()
    //     .width(280)
    //     .height(100)
    //     .range([0,20])
    //     .bins(20)
    //     .color(colorSwatches)
    //   )

    function histogramHighlight(selection, data){
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


    // Reposition the SVG to cover the features.
    function reset() {
        var bounds = path.bounds(collection),
            topLeft = bounds[0],
            bottomRight = bounds[1];

        svg .attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");

        g   .attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        feature.attr("d", path);
    }

    // Use Leaflet to implement a D3 geometric transformation.
    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }

    function updateScorebox(d){
      // update scorebox num + bg
      scorebox.innerHTML = d.properties.latest_energy_star_score;
      // we should be able to use the d3 color scale "color" to set the scorebox's background instead of this iife switch statment
      (function() {
          var escore = d.properties.latest_energy_star_score;
          escore = parseInt(escore) || "";
          if (escore != "") {
            switch (true) {
              case (escore < 25):
                  scorebox.style.backgroundColor = colorSwatches[0];
                  scorebox.style.color = "#fff";
                  break;
              case (escore > 24 && escore < 50):
                  scorebox.style.backgroundColor = colorSwatches[1];
                  scorebox.style.color = "#fff";
                  break;
              case (escore > 49 && escore < 75):
                  scorebox.style.backgroundColor = colorSwatches[2];
                  scorebox.style.color = "#000";
                  break;
              case (escore > 74 && escore < 101):
                  scorebox.style.backgroundColor = colorSwatches[3];
                  scorebox.style.color = "#000";
                  break;
              default:
                  scorebox.style.backgroundColor = "#fff";
                  scorebox.style.color = "#ccc";
                  break;
              }
          } else {
            scorebox.style.backgroundColor = "#fff";
            scorebox.style.color = "#333";
          }
      })();
      var buildingInfo = "<h4>"+d.properties.building_name+"<\/h4>";
          buildingInfo += "<p>Property Type: " + d.properties.property_type_self_selected +"<\/p>";
          buildingInfo += "<table id='buildingDetails'><colgroup><col\/><col\/></colgroup>";
          //  buildingInfo += "<tr><th>1<\/th><th>2<\/th></tr>";
          buildingInfo += "<tr><td>" + d.properties.latest_energy_star_score +"<\/td><td>"+  d.properties.latest_energy_star_score_year +" Energy Star Score<\/td><\/tr>";
          buildingInfo += "<tr><td>" + d.properties.latest_total_ghg_emissions_intensity_kgco2e_ft2 +"<\/td><td>"+  d.properties.latest_total_ghg_emissions_intensity_kgco2e_ft2_year +" GHG Emissions <small>(kgCO<sub>2<\/sub>e&#47;ft<sup>2<\/sup>)<\/small><\/td><\/tr>";
          buildingInfo += "<tr><td>" + d.properties.latest_weather_normalized_source_eui_kbtu_ft2 +"<\/td><td>"+  d.properties.latest_weather_normalized_source_eui_kbtu_ft2_year +" Weather Normalized Source EUI <small>(kBTU&#47;ft<sup>2<\/sup>)<\/small><\/td><\/tr>";
          buildingInfo += "<tr><td>" + d.properties.latest_weather_normalized_site_eui_kbtu_ft2 +"<\/td><td>"+  d.properties.latest_weather_normalized_site_eui_kbtu_ft2_year +" Weather Normalized Site EUI <small>(kBTU&#47;ft<sup>2<\/sup>)<\/small><\/td><\/tr>";
          buildingInfo += "<\/table>";
      $( "#building-details" ).html(buildingInfo);
    }

}

function parseData(apiData){
  var tests = ['benchmark','energy_star_score','site_eui_kbtu_ft2','source_eui_kbtu_ft2','percent_better_than_national_median_site_eui','percent_better_than_national_median_source_eui','total_ghg_emissions_metric_tons_co2e','total_ghg_emissions_intensity_kgco2e_ft2','weather_normalized_site_eui_kbtu_ft2','weather_normalized_source_eui_kbtu_ft2']
  var re1 = /(.+)\//
  var re2 = /[\/\.](.+)/
  apiData.forEach(function(parcel){
    if (parcel.parcel_s === undefined) {return parcel}
    parcel.parcel1 = re1.exec(parcel.parcel_s)[1]
    parcel.parcel2 = re2.exec(parcel.parcel_s)[1]
    parcel.blklot = '' + parcel.parcel1 + parcel.parcel2
    parcel.ID = parcel.blklot
    tests.forEach(function(test){
      parcel = latest(test, parcel)
    })
    return parcel
  })
  return apiData
}

function latest(test, entry){
  var years = [2011,2012,2013,2014,2015]
  if (test === 'benchmark') years.unshift(2010)
  var yearTest = years.map(function(d){
    if (test === 'benchmark') return 'benchmark_'+d+'_status'
    else return '_'+d+'_'+test
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

function apiDataToArray(prop) {
  var arr = returnedApiData.map(function(parcel){
    // if ( typeof parcel != 'object' || parcel === 'null' ) continue
    var onlyNumbers = (typeof parseInt(parcel[prop]) === 'number') ? parseInt(parcel[prop]) : -1
    return {id: parcel.ID, value: onlyNumbers}
  })
  return arr
}

// Toggle abstract
$('#abstract-toggle').click(function(){
    var abstractToggle = document.getElementById('abstract-toggle');
    $("#abstract,#filters,#compare-chart").toggleClass('hide');
    abstractToggle.textContent =
        ((abstractToggle.textContent == "[+]")
        ? "[–]":"[+]");
});
