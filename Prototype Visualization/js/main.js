/**
 * Created by Sanat Moningi
 */

//Setting up leaflet map
var map = L.map('map').setView([37.7833, -122.4167], 14);
//Storing latest energy report data locally
var energyDict = {};
var color; //Color bins

//Getting tile from Mapbox
L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.dark/{z}/{x}/{y}.png?access_token={accessToken}', {
    maxZoom: 18,
    minZoom: 13,
    attributionControl: false,
    id: 'smoningi.a304c3dc',
    accessToken: 'pk.eyJ1Ijoic21vbmluZ2kiLCJhIjoiQ21rN1pjSSJ9.WKrPFjjb7LRMBjyban698g'
}).addTo(map);

//Add Legend
var legend1 = "#ffffe0";
var legend2 = "#ffa474";
var legend3 = "#db4551";
var legend4 = "#8b0000";

var legend = L.control({position:'bottomleft'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend');
    div.innerHTML += "<div><b>Energy Star Score</b></div>"
    div.innerHTML += "<i style=\"background:"+legend1+";\"></i> <b>75-100</b> <br/>";
    div.innerHTML += "<i style=\"background:"+legend2+";\"></i> <b>50-75</b><br/>";
    div.innerHTML += "<i style=\"background:"+legend3+";\"></i> <b>25-50</b> <br/>";
    div.innerHTML += "<i style=\"background:"+legend4+";\"></i> <b>0-25</b><br/>";
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
            
           // update scorebox num + bgcolor
           scorebox.innerHTML = energyDict[d.properties.blklot]["Energy Star Score"];
/*
           scorebox.style.backgroundColor = legend#; // todo: update dynamically based on score
           scorebox.style.color = "#fff";
*/

           var buildingInfo = "<h4>"+d.properties.building_name+"<\/h4>";
           buildingInfo += "<div>"+  energyDict[d.properties.blklot]["Energy Star Year"] +" Energy Star Score: " + energyDict[d.properties.blklot]["Energy Star Score"] + "<\/div>";
           buildingInfo += "<div>"+  energyDict[d.properties.blklot]["GHG Year"] +" GHG Emissions: " + energyDict[d.properties.blklot]["GHG Emissions Intensity"] + " kgCO<sup>2<\/sup>e&#47;ft<sup>2<\/sup><\/div>";
           buildingInfo += "<div>"+  energyDict[d.properties.blklot]["Weather Normalized Source EUI Year"] +" Weather Normalized Source EUI: " + energyDict[d.properties.blklot]["Weather Normalized Source EUI"] + " kBTU&#47;ft<sup>2<\/sup><\/div>";
           buildingInfo += "<div>"+  energyDict[d.properties.blklot]["Weather Normalized Site EUI Year"] +" Weather Normalized Site EUI: " + energyDict[d.properties.blklot]["Weather Normalized Site EUI"] + " kBTU&#47;ft<sup>2<\/sup><\/div>";
           buildingInfo += "<div> Property Type: "+ energyDict[d.properties.blklot]["Property Type"] +"<\/div>";

           $( "#building-details" ).html(buildingInfo);
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

    d3.select("#compare-chart")
      .datum(values)
    .call(histogramChart()
      .width(300)
      .height(100)
      .range([0,100])
      .bins(50)
      .color(["#8b0000", "#db4551", "#ffa474", "#ffffe0"])
    )

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
    $("#abstract").toggleClass('hide');
    abstractToggle.textContent = 
        ((abstractToggle.textContent == "[+]")
        ? "[–]":"[+]");
});

function addHistogram(options) {
  var chartContainer = d3.select(options.element).append('div').attr('class', 'chart')

  var values = options.data.map(function(d) { return d.value ; })

  var margin = {top: 10, right: 10, bottom: 30, left: 10},
      width = 200 - margin.left - margin.right,
      height = 100 - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .domain(d3.extent(values))
      .range([0, width]);

  var data = d3.layout.histogram()
      .bins(x.ticks(40))
      (values);

  var y = d3.scale.linear()
      .domain([0, d3.max(data, function(d) { return d.y; })])
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var svg = chartContainer.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var bar = svg.selectAll(".bar")
      .data(data)
    .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });
  bar.append("rect")
      .attr("x", 1)
      .attr("width", x(data[0].dx) - 1)
      .attr("height", function(d) { return height - y(d.y); });

  bar.append("text")
      .attr("dy", ".75em")
      .attr("y", 6)
      .attr("x", x(data[0].dx) / 2)
      .attr("text-anchor", "middle")

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
}

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

  //Store Max and Mins
  if(energyDict["Energy Star Score Max"] == null){
    energyDict["Energy Star Score Max"] = energyDict[parcelID]["Energy Star Score"];
  } else{
    if(energyDict[parcelID]["Energy Star Score"] > energyDict["Energy Star Score Max"]){
      energyDict["Energy Star Score Max"] = energyDict[parcelID]["Energy Star Score"];
    }
  }

  if(energyDict["Energy Star Score Min"] == null){
    energyDict["Energy Star Score Min"] = energyDict[parcelID]["Energy Star Score"];
  } else{
    if(energyDict[parcelID]["Energy Star Score"] < energyDict["Energy Star Score Min"]){
      energyDict["Energy Star Score Min"] = energyDict[parcelID]["Energy Star Score"];
    }
  }

  if(energyDict["GHG Emissions Max"] == null){
    energyDict["GHG Emissions Max"] = energyDict[parcelID]["GHG Emissions Intensity"];
  } else{
    if(energyDict[parcelID]["GHG Emissions Intensity"] > energyDict["GHG Emissions Max"]){
      energyDict["GHG Emissions Max"] = energyDict[parcelID]["GHG Emissions Intensity"];
    }
  }

  if(energyDict["GHG Emissions Min"] == null){
    energyDict["GHG Emissions Min"] = energyDict[parcelID]["GHG Emissions Intensity"];
  } else{
    if(energyDict[parcelID]["GHG Emissions Intensity"] < energyDict["GHG Emissions Min"]){
      energyDict["GHG Emissions Min"] = energyDict[parcelID]["GHG Emissions Intensity"];
    }
  }
}

