/**
 * Created by Sanat Moningi
 */
//TODO: parcel features should have a uniqueID other than 'parcel_s' or 'blklot' since several buildings can share the same parcel geoJSON. Possible ID: 'blklot' + 'latitude'.  create this id when the geojson file is combined with the api data.

//Setting up leaflet map
var map = L.map('map').setView([37.7833, -122.4167], 14);
//Storing latest energy report data locally
var energyDict = {};
var color; //Color bins
//
// //Getting tile from Mapbox
// L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.dark/{z}/{x}/{y}.png?access_token={accessToken}', {
//     maxZoom: 18,
//     minZoom: 13,
//     attributionControl: false,
//     id: 'smoningi.a304c3dc',
//     accessToken: 'pk.eyJ1Ijoic21vbmluZ2kiLCJhIjoiQ21rN1pjSSJ9.WKrPFjjb7LRMBjyban698g'
// }).addTo(map);

//Add Legend
var legend1 = "#ffffe0"; // best
var legend2 = "#ffa474";
var legend3 = "#db4551";
var legend4 = "#8b0000"; // worst

// var legend = L.control({position:'bottomleft'});
// legend.onAdd = function (map) {
//     var div = L.DomUtil.create('div', 'legend');
//     div.innerHTML += "<div><b>Energy Star Score</b></div>"
//     div.innerHTML += "<i style=\"background:"+legend1+";\"></i> <b>75-100</b> <br/>";
//     div.innerHTML += "<i style=\"background:"+legend2+";\"></i> <b>50-75</b><br/>";
//     div.innerHTML += "<i style=\"background:"+legend3+";\"></i> <b>25-50</b> <br/>";
//     div.innerHTML += "<i style=\"background:"+legend4+";\"></i> <b>0-25</b><br/>";
//     return div;
// };
// legend.addTo(map);

var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

var scorebox = document.getElementById('scorebox');

d3_queue.queue()
    .defer(d3.json, "api_return.json")  /* https://data.sfgov.org/resource/j2j3-acqj.json?$limit=2000 */
    .defer(d3.json, "justGeo.geojson")
    .await(mapDraw)

function parseData(apiData){
  var re1 = /(.+)\//
  var re2 = /\/(.+)/
  apiData.forEach(function(parcel){
    if (parcel.parcel_s === undefined) {return parcel}
    parcel.parcel1 = re1.exec(parcel.parcel_s)[1]
    parcel.parcel2 = re2.exec(parcel.parcel_s)[1]
    parcel.blklot = '' + parcel.parcel1 + parcel.parcel2
    return parcel
  })
  return apiData
}

function mapDraw(err, apiData, collection){
    apiData = parseData(apiData)

    collection.features.forEach(function(feature){
      var data = apiData.find(function(el){
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
          var parcelID = d.properties.blklot;
          parcelToDict(d, parcelID)
          return parcelID;
        })
        .style("stroke", "#B9E7FF")
        .style("fill", function(d){
          var parcelID = d.properties.blklot;
          var average = (energyDict["GHG Emissions Min"] + energyDict["GHG Emissions Max"]) / 2;
          if(energyDict[parcelID]["GHG Emissions Intensity"] != null){
            var color = d3.scale.quantize()
                //.domain([-2.28277,0, 2.28277])
                .domain([0, 25, 50, 75, 100])
                .range(["#8b0000", "#db4551", "#ffa474", "#ffffe0"]);
            return color(parseInt(energyDict[parcelID]["Energy Star Score"]));
          } else{
            return "#ffffbf";
          }
        })
        .style("fill-opacity", 0.5)
        .style("stroke-width",0.1)
        .on("mouseover", function(d){
           d3.select(this).style("fill-opacity",1)
           .style("stroke", "#FFCC33")
           .style("stroke-width",2);

           // update scorebox num + bg
           var escore = energyDict[d.properties.blklot]["Energy Star Score"];            
           scorebox.innerHTML = escore;
           (function() {
               escore = parseInt(escore) || "";
               if (escore != "") {
                    switch (true) {
                        case (escore < 25):
                            scorebox.style.backgroundColor = legend4;
                            scorebox.style.color = "#fff";
                            break;
                        case (escore >= 25 && escore < 50):
                            scorebox.style.backgroundColor = legend3;
                            scorebox.style.color = "#fff";
                            break;
                        case (escore >= 50 && escore < 75):
                            scorebox.style.backgroundColor = legend2;
                            scorebox.style.color = "#000";
                            break;
                        case (escore >= 75 && escore <= 100):
                            scorebox.style.backgroundColor = legend1;
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
           buildingInfo += "<p>Property Type: " + energyDict[d.properties.blklot]["Property Type"] +"<\/p>";
           buildingInfo += "<table id='buildingDetails'><colgroup><col\/><col\/></colgroup>";
           buildingInfo += "<tr><td>" + energyDict[d.properties.blklot]["Energy Star Score"] +"<\/td><td>"+  energyDict[d.properties.blklot]["Energy Star Year"] +" Energy Star Score<\/td><\/tr>";
           buildingInfo += "<tr><td>" + energyDict[d.properties.blklot]["GHG Emissions Intensity"] +"<\/td><td>"+  energyDict[d.properties.blklot]["GHG Year"] +" GHG Emissions <small>(kgCO<sup>2<\/sup>e&#47;ft<sup>2<\/sup>)<\/small><\/td><\/tr>";
           buildingInfo += "<tr><td>" + energyDict[d.properties.blklot]["Weather Normalized Source EUI"] +"<\/td><td>"+  energyDict[d.properties.blklot]["Weather Normalized Source EUI Year"] +" Weather Normalized Source EUI <small>(kBTU&#47;ft<sup>2<\/sup>)<\/small><\/td><\/tr>";
           buildingInfo += "<tr><td>" + energyDict[d.properties.blklot]["Weather Normalized Site EUI"] +"<\/td><td>"+  energyDict[d.properties.blklot]["Weather Normalized Site EUI Year"] +" Weather Normalized Site EUI <small>(kBTU&#47;ft<sup>2<\/sup>)<\/small><\/td><\/tr>";
           buildingInfo += "<\/table>";

           $( "#building-details" ).html(buildingInfo);

           d3.select("#compare-chart").call(highlight,energyDict[d.properties.blklot]["Energy Star Score"])
        })
        .on("mouseout", function(d){
           d3.select(this).style("stroke", "#B9E7FF")
           .style("fill", function(d){
             var parcelID = d.properties.blklot;
             var average = (energyDict["GHG Emissions Min"] + energyDict["GHG Emissions Max"]) / 2;
             if(energyDict[parcelID]["GHG Emissions Intensity"] != null){
               var color = d3.scale.quantize()
                   .domain([0, 25, 50, 75, 100])
                   .range(["#8b0000", "#db4551", "#ffa474", "#ffffe0"]);
               return color(parseInt(energyDict[parcelID]["Energy Star Score"]));
             } else{
               return "#ffffbf";
             }
           })
           .style("fill-opacity", 0.5)
           .style("stroke-width",0.1);
        });

    map.on("viewreset", reset);
    reset();

    var chartData = dictionaryToDataArray('Energy Star Score', energyDict)
    var values = chartData.map(function(d) {return d.value})
                          .filter(function(d) {return d > 0})
    var histogram = histogramChart()
      .width(280)
      .height(100)
      .range([0,104])
      .bins(50)
      .color([legend4, legend3, legend2, legend1])
    d3.select("#compare-chart")
      .datum(values)
    .call(histogram)

    d3.select("#compare-chart").call(highlight,-10)

    // //demonstrates how to update the histogram chart with new data
    // chartData = dictionaryToDataArray('GHG Emissions Intensity', energyDict)
    // values = chartData.map(function(d) {return d.value})
    //                   .filter(function(d) {return d > 0})
    // d3.select("#compare-chart")
    //   .datum(values)
    //   .call(histogramChart()
    //     .width(280)
    //     .height(100)
    //     .range([0,20])
    //     .bins(50)
    //     .color([legend4, legend3, legend2, legend1])
    //   )

    function highlight(selection, data){
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

    function dictionaryToDataArray(prop, dict){
      var arr = []
      for (var parcel in dict){
        // debugger;
        if ( typeof dict[parcel] != 'object' || parcel === 'null' ) continue
        // if (dict[parcel][prop] > 40) continue
        var onlyNumbers = (typeof dict[parcel][prop] === 'number') ? dict[parcel][prop] : -1
        arr.push( {id: parcel, value: onlyNumbers} )
      }
      return arr
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

}

// Toggle abstract
$('#abstract-toggle').click(function(){
    var abstractToggle = document.getElementById('abstract-toggle');
    $("#abstract,#filters,#compare-chart").toggleClass('hide');
    abstractToggle.textContent =
        ((abstractToggle.textContent == "[+]")
        ? "[–]":"[+]");
});

// Toggle filter options: Energy Score
$('#filters .energyScore-dropdown .dropdown-menu li').click(function() {
    $('#filters .energyScore-dropdown .dropdown-menu li:first-child').removeClass('active');
    $(this).toggleClass('active');
});
$('#filters .energyScore-dropdown .dropdown-menu li:first-child').click(function() {
    $('#filters .energyScore-dropdown .dropdown-menu li').removeClass('active');
    $(this).toggleClass('active');
});

// Toggle filter options: Category
$('#filters .category-dropdown .dropdown-menu li').click(function() {
    $('#filters .category-dropdown .dropdown-menu li:first-child').removeClass('active');
    $(this).toggleClass('active');
});
$('#filters .category-dropdown .dropdown-menu li:first-child').click(function() {
    $('#filters .category-dropdown .dropdown-menu li').removeClass('active');
    $(this).toggleClass('active');
});

function dictionaryToDataArray(prop, dict){
  var arr = []
  for (var parcel in dict){
    if ( typeof dict[parcel] != 'object' || parcel === 'null' ) continue
    if (dict[parcel][prop] > 40) continue
    var onlyNumbers = (typeof dict[parcel][prop] === 'number') ? dict[parcel][prop] : -1
    arr.push( {id: parcel, value: onlyNumbers} )
  }
  return arr
}

function parcelToDict(d, parcelID) {
  /* the following block parses dataset to generate "latest" score values for each property*/
  // var tests = ['benchmark','energy_star_score','site_eui_kbtu_ft2','source_eui_kbtu_ft2','percent_better_than_national_median_site_eui','percent_better_than_national_median_source_eui','total_ghg_emissions_metric_tons_co2e','total_ghg_emissions_intensity_kgco2e_ft2','weather_normalized_site_eui_kbtu_ft2','weather_normalized_source_eui_kbtu_ft2']
  // data.forEach(function(building){
  //   tests.forEach(function(test){
  //     building = latest(test, building)
  //   })
  // })
  // function latest(score, entry){
  //   var years = [2011,2012,2013,2014,2015]
  //   if (score === 'benchmark') years.unshift(2010)
  //   var yearScore = years.map(function(d){
  //     if (score === 'benchmark') return 'benchmark_'+d+'_status'
  //     else return '_'+d+'_'+score
  //   })
  //   yearScore.forEach(function(year,i){
  //     if (entry[year] != null){
  //       entry['latest_'+score] = entry[year]
  //       entry['latest_'+score+'_year'] = years[i]
  //     }
  //   })
  //   return entry
  // }
  /* end parse block*/

  var energyStarScore;
  var energyStarYear;
  var weatherNormalizedSourceEUI;
  var weatherNormalizedSourceEUIYear;
  var weatherNormalizedSiteEUI;
  var weatherNormalizedSiteEUIYear;
  var ghgEmissionsIntensity;
  var ghgEmissionsYear;
  var eui;

  if(d.properties._2014_energy_star_score != null){
    energyStarScore = d.properties._2014_energy_star_score;
    energyStarYear = 2014;
  } else if(d.properties._2013_energy_star_score != null){
    energyStarScore = +d.properties._2013_energy_star_score;
    energyStarYear = 2013;
  } else if(d.properties._2012_energy_star_score != null){
    energyStarScore = +d.properties._2012_energy_star_score;
    energyStarYear = 2012;
  } else if(d.properties._2011_energy_star_score != null){
    energyStarScore = +d.properties._2011_energy_star_score;
    energyStarYear = 2011;
  } else {
    energyStarScore = "N/A";
    energyStarYear = "";
  }

  if(d.properties._2014_total_ghg_emissions_intensity_kgco2e_ft2!= null){
    ghgEmissionsIntensity = +d.properties._2014_total_ghg_emissions_intensity_kgco2e_ft2;
    ghgEmissionsYear = 2014;
  } else if(d.properties._2013_total_ghg_emissions_intensity_kgco2e_ft2 != null){
    ghgEmissionsIntensity = +d.properties._2013_total_ghg_emissions_intensity_kgco2e_ft2;
    ghgEmissionsYear = 2013;
  } else if(d.properties._2012_total_ghg_emissions_intensity_kgco2e_ft2 != null){
    ghgEmissionsIntensity = +d.properties._2012_total_ghg_emissions_intensity_kgco2e_ft2;
    ghgEmissionsYear = 2012;
  } else if(d.properties._2011_total_ghg_emissions_intensity_kgco2e_ft2 != null){
    ghgEmissionsIntensity = +d.properties._2011_total_ghg_emissions_intensity_kgco2e_ft2
    ghgEmissionsYear = 2011;
  } else {
    ghgEmissionsIntensity = "N/A";
    ghgEmissionsYear = "";
  }

  if(d._2014_weather_normalized_source_eui_kbtu_ft2 != null){
    weatherNormalizedSourceEUI = +d._2014_weather_normalized_source_eui_kbtu_ft2
    weatherNormalizedSourceEUIYear = 2014;
  } else if(d.properties._2013_weather_normalized_source_eui_kbtu_ft2 != null){
    weatherNormalizedSourceEUI = +d.properties._2013_weather_normalized_source_eui_kbtu_ft2;
    weatherNormalizedSourceEUIYear = 2013;
  } else if(d.properties._2012_weather_normalized_source_eui_kbtu_ft2 != null){
    weatherNormalizedSourceEUI = +d.properties._2012_weather_normalized_source_eui_kbtu_ft2;
    weatherNormalizedSourceEUIYear = 2012;
  } else if(d.properties._2011_weather_normalized_source_eui_kbtu_ft2 != null){
    weatherNormalizedSourceEUI = +d.properties._2011_weather_normalized_source_eui_kbtu_ft2;
    weatherNormalizedSourceEUIYear = 2011;
  } else {
    weatherNormalizedSourceEUI = "N/A";
    weatherNormalizedSourceEUIYear = "";
  }

  if(d._2014_weather_normalized_site_eui_kbtu_ft2 != null){
    weatherNormalizedSiteEUI = +d._2014_weather_normalized_site_eui_kbtu_ft2
    weatherNormalizedSiteEUIYear = 2014;
  } else if(d.properties._2013_weather_normalized_site_eui_kbtu_ft2 != null){
    weatherNormalizedSiteEUI = +d.properties._2013_weather_normalized_site_eui_kbtu_ft2;
    weatherNormalizedSiteEUIYear = 2013;
  } else if(d.properties._2012_weather_normalized_site_eui_kbtu_ft2 != null){
    weatherNormalizedSiteEUI = +d.properties._2012_weather_normalized_site_eui_kbtu_ft2;
    weatherNormalizedSiteEUIYear = 2012;
  } else if(d.properties._2011_weather_normalized_site_eui_kbtu_ft2 != null){
    weatherNormalizedSiteEUI = +d.properties._2011_weather_normalized_site_eui_kbtu_ft2;
    weatherNormalizedSiteEUIYear = 2011;
  } else {
    weatherNormalizedSiteEUI = "N/A";
    weatherNormalizedSiteEUIYear = "";
  }

  energyDict[parcelID] = {
    "Energy Star Score" : energyStarScore,
    "Energy Star Year" : energyStarYear,
    "GHG Emissions Intensity" : ghgEmissionsIntensity,
    "GHG Year" : ghgEmissionsYear,
    "Weather Normalized Source EUI" : weatherNormalizedSourceEUI,
    "Weather Normalized Source EUI Year" : weatherNormalizedSourceEUIYear,
    "Weather Normalized Site EUI" : weatherNormalizedSiteEUI,
    "Weather Normalized Site EUI Year" : weatherNormalizedSiteEUIYear,
    "Property Type" : d.properties.property_type_self_selected
  };

}

