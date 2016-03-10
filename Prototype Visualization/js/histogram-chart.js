// TODO: tooltip for histogram bars to show count

function histogramChart() {
  var margin = {top: 0, right: 0, bottom: 20, left: 10},
      width = 960,
      height = 500,
      highlight = 50;

  var color = d3.scale.quantize()
      .range(["#f7f7f7","#252525"]);

  var histogram = d3.layout.histogram(),
      x = d3.scale.linear(),
      y = d3.scale.linear(),
      xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(5, 0);

  function chart(selection) {
    selection.each(function(data) {

      // Compute the histogram.
      data = histogram(data);

      // Update the x-scale.
      x   .domain( d3.extent(data.map(function(d) { return d.x; })) )
          .range([0, width - margin.left - margin.right]);

      // Update the y-scale.
      y   .domain([0, d3.max(data, function(d) { return d.y; })])
          .range([height - margin.top - margin.bottom, 0]);

      color.domain(x.domain())

      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]);

      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append("svg").append("g");
      gEnter.append("g").attr("class", "bars");
      gEnter.append("g").attr("class", "x axis");

      // Update the outer dimensions.
      svg .attr("width", width)
          .attr("height", height);

      // Update the inner dimensions.
      var g = svg.select("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Update the bars.
      var bar = svg.select(".bars").selectAll(".bar").data(data);
      bar.enter().append("rect").attr('class', 'bar');
      bar.exit().remove();
      bar .attr("width", x(data[0].dx) - 1)
          .attr("x", function(d) { return x(d.x); })
          .attr("y", function(d) { return y(d.y); })
          .attr("height", function(d) { return y.range()[0] - y(d.y); })
          .attr('fill', function(d){ return color(d.x) } )
          .order()

      var hl = svg.select('.bars').select('.highlight').data([highlight])
      hl.enter().append("rect").attr('class', 'highlight')
      hl.exit().remove()
      hl.attr("width", 1)
        .attr("x", function(d) { return x(d) })
        .attr("y", 1)
        .attr("height", height - margin.top - margin.bottom )
        .attr('fill', 'red' )


      // Update the x-axis.
      g.select(".x.axis")
          .attr("transform", "translate(0," + y.range()[0] + ")")
          .call(xAxis);

    });
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color.range();
    color.range(_);
    return chart;
  };

  chart.highlight = function(_) {
    if (!arguments.length) return highlight;
    highlight = _;
    return chart;
  };

  // Expose the histogram's value, range and bins method.
  d3.rebind(chart, histogram, "value", "range", "bins");

  // Expose the x-axis' tickFormat method.
  d3.rebind(chart, xAxis, "tickFormat");

  return chart;
}