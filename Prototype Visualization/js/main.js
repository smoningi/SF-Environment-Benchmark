/**
 * Created by Sanat Moningi
 */
// data source: https://data.sfgov.org/Energy-and-Environment/Existing-Commercial-Buildings-Energy-Performance-O/j2j3-acqj

var colorSwatches = ["#8b0000", "#db4551", "#ffa474", "#ffffe0"];
// var colorSwatches.energy_star_score = ["#8b0000", "#db4551", "#ffa474", "#ffffe0"];
// var colorSwatches.ghg_emissions = ["#f4fde8","#b6e9ba","#76cec7","#3ea3d3"];
// var colorSwatches.source_eui_kbtu_ft2 = ["#FFECD9","#FFD5AB", "#FFBF80", "#FFAA55"];
// var colorSwatches.site_eui_kbtu_ft2 = ['#FF413B','#FF7570','#FFABA8','#C1E9B7'];

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
    div.innerHTML += "<div id='legend-label'><b>Energy Star Score</b></div>"
    div.innerHTML += "<i style=\"background:"+colorSwatches[3]+";\"></i> <b>75-100</b> <br/>";
    div.innerHTML += "<i style=\"background:"+colorSwatches[2]+";\"></i> <b>50-75</b><br/>";
    div.innerHTML += "<i style=\"background:"+colorSwatches[1]+";\"></i> <b>25-50</b> <br/>";
    div.innerHTML += "<i style=\"background:"+colorSwatches[0]+";\"></i> <b>0-25</b><br/>";
    return div;
};
legend.addTo(map);

var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

var scorebox = document.getElementById('scorebox');

d3_queue.queue()
    .defer(d3.json, "api_return.json")  /* https://data.sfgov.org/resource/j2j3-acqj.json?$limit=2000 */
    .defer(d3.json, "justGeo.geojson")
    .await(mapDraw)

var metricMap = {
  'Energy Star Score':'latest_energy_star_score',
  'GHG Emissions':'latest_total_ghg_emissions_intensity_kgco2e_ft2',
  'Source EUI':'latest_source_eui_kbtu_ft2',
  'Site EUI':'latest_site_eui_kbtu_ft2'
}

function mapDraw(err, apiData, collection){
    var activeMetric = 'latest_energy_star_score'
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
          return color(parseInt(d.properties[activeMetric]));
        })
        .style("fill-opacity", 0.5)
        .style("stroke-width",0.1)
        .on("mouseover", function(d){
          d3.select(this).style("fill-opacity",1)
            .style("stroke", "#FFCC33")
            .style("stroke-width",2);
          updateScorebox(d);
          d3.select("#compare-chart").call(histogramHighlight,d.properties[activeMetric])
        })
        .on("mouseout", function(d){
          d3.select(this).style("stroke", "#B9E7FF")
            .style("fill", function(d){
              return color(parseInt(d.properties[activeMetric]));
            })
            .style("fill-opacity", 0.5)
            .style("stroke-width",0.1);
        });

    map.on("viewreset", reset);
    reset();

    var chartData = apiDataToArray(activeMetric)
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

    d3.select('#test-button').on('click', function(){
      filterMapCategory('Hotel')

    })



    var dispatcher = d3.dispatch('changeCategory', 'changeMetric')
    dispatcher.on('changeCategory', function(newCategory){
      filterMapCategory(newCategory) //only activates last filter selected
      chartData = apiDataToArray(activeMetric, newCategory)
      values = chartData.map(function(d) {return d.value})
                        .filter(function(d) {return d > 0})
      d3.select("#compare-chart")
        .datum(values)
        .call(histogramChart()
          .width(280)
          .height(100)
          .range([0,104])
          .bins(50)
          .color(colorSwatches)
        )
    })
    dispatcher.on('changeMetric', function(newMetric){
      var legendLabel = document.getElementById('legend-label')
      legendLabel.innerHTML = "<b>"+newMetric+"</b>"
      activeMetric = metricMap[newMetric]
      chartData = apiDataToArray(activeMetric)

      values = chartData.map(function(d) {return d.value})
                        .filter(function(d) {return d > 0})

      color.domain( [0,d3.max(values)] )

      feature.style("fill", function(d){
        return color(parseInt(d.properties[activeMetric]));
      })

      chartData = apiDataToArray(activeMetric)

      d3.select("#compare-chart")
        .datum(values)
        .call(histogramChart()
          .width(280)
          .height(100)
          .range(color.domain())
          .bins(50)
          .color(colorSwatches)
        )
    })

    // Toggle filter options: Energy Score
    $('#filters .energyScore-dropdown .dropdown-menu li').click(function() {
        $('#filters .energyScore-dropdown .dropdown-menu li:first-child').removeClass('active');
        $(this).toggleClass('active');
    });
    $('#filters .energyScore-dropdown .dropdown-menu li:first-child').click(function() {
        $('#filters .energyScore-dropdown .dropdown-menu li').removeClass('active');
        $(this).toggleClass('active');
    });


    // Toggle filter options: Comparator Metric
    $('#filters .metric-dropdown .dropdown-menu li').click(function() {
        $('#filters .metric-dropdown .dropdown-menu li').removeClass('active');
        $(this).toggleClass('active');

        var newMetric = $(this).first().text()
        dispatcher.changeMetric(newMetric)

    });

    // Toggle filter options: Category
    $('#filters .category-dropdown .dropdown-menu li').click(function() {
        // $('#filters .category-dropdown .dropdown-menu li:first-child').removeClass('active');
        $('#filters .category-dropdown .dropdown-menu li').removeClass('active');
        $(this).toggleClass('active');

        var category = $(this).first().text()
        dispatcher.changeCategory(category)
    });
    $('#filters .category-dropdown .dropdown-menu li:first-child').click(function() {
        $('#filters .category-dropdown .dropdown-menu li').removeClass('active');
        $(this).toggleClass('active');
    });

    function filterMapCategory(metric) {
      feature.attr('class', function(d){
        if (metric === 'All') return ''
        return d.properties.property_type_self_selected === metric ? '' : 'hidden'
      })
    }

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
      var escore = +d.properties[activeMetric];
      escore = roundToTenth(escore);
      scorebox.innerHTML = escore;
      scorebox.style.backgroundColor = color(escore) || "#fff";
      if (escore >= 50 && escore <= 100) {
          scorebox.style.color = "#000";
      } else if (escore >= 0 && escore < 50) {
          scorebox.style.color = "#fff";
      } else { // escore == null or N/A
          scorebox.style.color = "#000";
      }

      var buildingInfo = "<h4>"+d.properties.building_name+"<\/h4>";
          buildingInfo += "<p>Property Type: " + d.properties.property_type_self_selected +"<\/p>";
          buildingInfo += "<table id='buildingDetails'><colgroup><col\/><col\/></colgroup>";
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

function apiDataToArray(prop,categoryFilter) {
  var arr = returnedApiData
  if(categoryFilter && categoryFilter !== 'All'){
    arr = arr.filter(function(parcel){
      return parcel.property_type_self_selected === categoryFilter
    })
  }
  arr = arr.map(function(parcel){
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

function roundToTenth(num){
  return Math.round(10*num)/10
}