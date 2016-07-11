/**
 * Created by Sanat Moningi
 */
// data source: https://data.sfgov.org/Energy-and-Environment/Existing-Commercial-Buildings-Energy-Performance-O/j2j3-acqj

var metricMap = {
      'Energy Star Score':'latest_energy_star_score',
      'GHG Emissions':'latest_total_ghg_emissions_intensity_kgco2e_ft2',
      'Source EUI':'latest_source_eui_kbtu_ft2',
      'Site EUI':'latest_site_eui_kbtu_ft2'
    };

var activeMetric = activeMetric || 'latest_energy_star_score',
    colorMetric = colorMetric || 'energy_star_score',
    newMetric = newMetric || 'Energy Star Score';

var colorSwatches = {
      energy_star_score: ['#FD6C16','#FEB921','#46AEE6','#134D9C'],
      total_ghg_emissions_intensity_kgco2e_ft2: ['#f4fde8','#b6e9ba','#76cec7','#3ea3d3'],
      source_eui_kbtu_ft2: ['#f2f0f7','#cbc9e2', '#9e9ac8', '#6a51a3'],
      site_eui_kbtu_ft2: ['#ffffe0','#ffa474','#db4551','#8b0000']
    };

var metricRanges = {
      energy_star_score: ['0-25','25-50','50-75','75-100'],
      total_ghg_emissions_intensity_kgco2e_ft2: ['0-50','50-100','100-150','150-200'],
      source_eui_kbtu_ft2: ['0-1000','1000-2000', '2000-3000', '3000-4000'],
      site_eui_kbtu_ft2: ['0-10k','10k-20k','20k-30k','30k-40k']
    };

var color = d3.scale.quantize()
    .domain([0, 100])
    .range(colorSwatches[colorMetric]);

//Setting up leaflet map
var map = L.map('map').setView([37.7833, -122.4167], 14);
//Storing parcel data globally
var returnedApiData = [];

//Getting tile from Mapbox
L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.dark/{z}/{x}/{y}.png?access_token={accessToken}', {
    maxZoom: 18,
    minZoom: 13,
    attributionControl: false,
    id: 'smoningi.a304c3dc',
    accessToken: 'pk.eyJ1Ijoic21vbmluZ2kiLCJhIjoiQ21rN1pjSSJ9.WKrPFjjb7LRMBjyban698g'
}).addTo(map);

var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

var scorebox = document.getElementById('scorebox');

d3_queue.queue()
    .defer(d3.json, "api_return.json")  /* https://data.sfgov.org/resource/j2j3-acqj.json?$limit=2000 */
    .defer(d3.json, "justGeo.geojson")
    .await(mapDraw)

function mapDraw(err, apiData, collection){
    // activeMetric = activeMetric || 'latest_energy_star_score'
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

    var legend = L.control({position:'bottomleft'});
    addLegend();

    var chartData = apiDataToArray(activeMetric)
    var values = chartData.map(function(d) {return d.value})
                          .filter(function(d) {return d > 0})
    var histogram = histogramChart()
      .width(280)
      .height(100)
      .range([0,104])
      .bins(50)
      .color(colorSwatches[colorMetric])
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

      $(".category-dropdown small").html(newCategory.substring(0,18));

      d3.select("#compare-chart")
        .datum(values)
        .call(histogramChart()
          .width(280)
          .height(100)
          // .range([0,d3.max(values)])
          .range([0,104])
          .bins(50)
          .color(colorSwatches[colorMetric])
        )
    })
    dispatcher.on('changeMetric', function(newMetric){
      activeMetric = metricMap[newMetric]
      colorMetric = metricMap[newMetric].replace(/^latest_/, '')
      updateLegend();

      chartData = apiDataToArray(activeMetric)

      values = chartData.map(function(d) {return d.value})
                        .filter(function(d) {return d > 0})

      color = d3.scale.quantize()
          .domain([0,d3.max(values)])
          .range(colorSwatches[colorMetric]);

      console.log("max(values)="+d3.max(values));
      // color.domain( [0,d3.max(values)] )
      //      .range(colorSwatches[colorMetric]);

      feature.style("fill", function(d){
        return color(parseInt(d.properties[activeMetric]));
      })

      $(".metric-dropdown small").html(newMetric);

      // chartData = apiDataToArray(activeMetric)

      d3.select("#compare-chart") // histogram
        .datum(values)
        .call(histogramChart()
          .width(280)
          .height(100)
          .range(color.domain())
          .bins(50)
          .color(colorSwatches[colorMetric])
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

        newMetric = $(this).first().text()
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

    function updateLegend() {
      map.removeControl(legend);
      addLegend();
    }

    function addLegend() {
      legend.onAdd = function (map) {
          var div = L.DomUtil.create('div', 'legend');
          div.innerHTML += "<div id='legend-label'><b>"+newMetric+"</b></div>";
          for (var i=3;i>=0;i--) {
            div.innerHTML += "<i style=\"background:"+colorSwatches[colorMetric][i]+";\"></i> <b>"+metricRanges[colorMetric][i]+"</b> <br/>";
          }
          return div;
      };
      legend.addTo(map);

    }

    function updateScorebox(d){
      // update scorebox num + bg
      var escore = d.properties[activeMetric];
      scorebox.innerHTML = escore;
      scorebox.style.backgroundColor = color(escore) || "#fff";

      // TODO: update text color based on colorMetric
      if (escore >= 0 && escore <= 50) {
          scorebox.style.color = "#333";
      } else if (escore >= 51 && escore <= 100) {
          scorebox.style.color = "#fff";
      } else { // escore == null or N/A
          scorebox.style.color = "#333";
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

var categoryFilters = [
    'Automobile Dealership',
    'College/University',
    'Distribution Center',
    'Financial Office',
    'Fitness Center/Health Club/Gym',
    'Hospital (General Medical & Surgical)',
    'Hotel',
    'K-12 School',
    'Manufacturing/Industrial Plant',
    'Mixed Use Property',
    'Medical Office',
    'Non-Refrigerated Warehouse',
    'Office',
    'Other',
    'Retail Store',
    'Restaurant',
    'Supermarket/Grocery Store',
    'Worship Facility',
    'N/A'
];

//*******************************************
/* CATEGORY FILTER DROPDOWN
/********************************************/

// populate single category select dropdown menu
var filterOptions = '<li><a id="show-filter-options-modal" href="#">'+
    '<i class="fa fa-filter"></i> Multi-Category Filter Demo</a></li>'+
    '<li class="active"><a href="#">All</a></li>'+
    '<li class="divider"></li>';
for (var i=0;i < categoryFilters.length;i++) {
    filterOptions += '<li><a href="#">'+categoryFilters[i]+'</a></li>';
}
$("#category-filters-dropdown").html(filterOptions);

// FPO open multi-filter selection modal
$('#show-filter-options-modal').click(function(){
    $("#filter-options-modal").modal('show');
});

//*******************************************
/* CATEGORY FILTER CHECKBOXES
/********************************************/

// populate 2-col checkbox grid
var filterCheckboxes = '<tr><td><input id="js-toggle-category" type="checkbox" name=""></td><td>Select All</td></tr>';
for (var i=0;i < categoryFilters.length;i+=2) {
    filterCheckboxes += '<tr class="js-category-box">';
    filterCheckboxes += '<td><input id="js-toggle-category" type="checkbox" name=""></td>';
    filterCheckboxes += '<td>'+categoryFilters[i]+'</td>';
    if (categoryFilters[i+1]) {
        filterCheckboxes += '<td><input id="js-toggle-category" type="checkbox" name=""></td>';
        filterCheckboxes += '<td>'+categoryFilters[i+1]+'</td>';
    } else {
        filterCheckboxes += '<td>&nbsp;</td><td>&nbsp;</td>';
    };
    filterCheckboxes += '</tr>';
}
$("#category-filters-checkboxes").html(filterCheckboxes);

// toggle category selections via Select All
$('#js-toggle-category').change(function() {
    if($(this).is(":checked")) {
        $('.js-category-box').find(':checkbox').prop('checked', true);
    } else {
        $('.js-category-box').find(':checkbox').prop('checked', false);
    }
});
$('.js-category-box').find(':checkbox').change(function() {
    $('#js-toggle-category:checkbox').prop('checked', false);
});

//*******************************************
/* CATEGORY FILTER SELECT CHAIN TOOL
/********************************************/

// populate multi-category select chain tool
var filterRow = '<li><select><option value="" selected></option>';
for (var i=0;i < categoryFilters.length;i++) {
    filterRow += '<option value="'+categoryFilters[i]+'">'+categoryFilters[i]+'</option>';
}
filterRow += '</select>'+
    '<button class="remove-row" type="button"><small><i class="fa fa-minus"></i></small></button>'+
    '<button class="add-row" type="button"><small><i class="fa fa-plus"></i></small></button>'+
    '</li>';

// add filter row for select chain tool
$("#category-filters-select").html(filterRow);

// add/remove filter rows via +/- buttons
var filterRowsAdded = 0;
$('#category-filters-select').on("click",".remove-row", function(){
   if (filterRowsAdded > 0) {
       $("#category-filters-select > li:last-child").remove();
       filterRowsAdded--;
   }
});
$('#category-filters-select').on("click",".add-row", function(){
   $("#category-filters-select > li:last-child").after(filterRow);
   filterRowsAdded++;
});

//*******************************************
/* TOGGLE DISPLAY OF ABSTRACT
/********************************************/

var isAbstract = false;

$('.intro').on("click","#abstract-toggle", function(){
    $("#abstract,#filters,#compare-chart").toggleClass('hide');
    if (isAbstract) {
        $('#abstract-toggle').html("<a><i class='fa fa-info-circle'></i></a>");
        isAbstract=!isAbstract;
    } else {
        $('#abstract-toggle').html("<a><i class='fa fa-minus-circle'></i></a>");
        isAbstract=!isAbstract;
    }
});
