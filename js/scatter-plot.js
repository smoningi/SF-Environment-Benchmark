// TODO: tooltip for dots
// BUG: Axis labels are drawn again on update

function scatterPlot() {
  var margin = {top: 10, right: 10, bottom: 30, left: 50},
      width = 960,
      height = 500

  var color = d3.scale.threshold()
      // .range(["#f7f7f7","#252525"]);

  var histogram = d3.layout.histogram(),
      x = d3.scale.linear(),
      y = d3.scale.linear(),
      r = d3.scale.linear(),
      xAxis = d3.svg.axis().scale(x).orient("bottom"),
      yAxis = d3.svg.axis().scale(y).orient("left")

  var xAxisLabel = ''
  var yAxisLabel = ''


  function chart(selection) {
    selection.each(function(data) {

      // Update the x-scale.
      x   .domain( d3.extent(data, function(d) { return d.x; }) )
          .range([0, width - margin.left - margin.right]);

      // Update the y-scale.
      y   .domain( d3.extent(data, function(d) { return d.y; }) )
          .range([height - margin.top - margin.bottom, 0]);

      // Update the r-scale
      r   .domain( d3.extent(data, function(d) { return d.r; }) )
          .range([3, 30]);

      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]);

      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append("svg").append("g");
      gEnter.append("g").attr("class", "x axis");
      gEnter.append("g").attr("class", "y axis");
      gEnter.append("g").attr("class", "dots");

      // Update the outer dimensions.
      svg .attr("width", width)
          .attr("height", height);

      // Update the inner dimensions.
      var g = svg.select("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Update the dots.
      var dot = svg.select(".dots").selectAll(".dot").data(data);
      dot.enter().append("circle").attr('class', 'dot');
      dot.exit().remove();
      dot .attr("r", function(d) { return r(d.r); })
          .attr("cx", function(d) { return x(d.x); })
          .attr("cy", function(d) { return y(d.y); })
          .attr('fill', function(d){ return color(d.x) } )
          .attr('fill-opacity', 0.6)
          // .attr('stroke', '#5b5b5b')
          .order()

      // Update the x-axis.
      g.select(".x.axis")
          .attr("transform", "translate(0," + y.range()[0] + ")")
          .call(xAxis);
      svg.selectAll('.xlabel').remove()
      svg.append('text')
          .attr("transform", "translate(" + (width - margin.right) + "," + (height - 3) + ")")
          .attr('class', 'axis label xlabel')
          .style("text-anchor", "end")
          .text(xAxisLabel)

      // Update the y-axis.
      g.select(".y.axis")
          .attr("transform", "translate(" + x.range()[0] + ",0)")
          .call(yAxis);
      svg.selectAll('.ylabel').remove()
      svg.append('text')
          .attr("transform", "translate(" + (margin.left + 10) + "," + (margin.top) + ")rotate(-90)")
          .attr('class', 'axis label ylabel')
          .style("text-anchor", "end")
          .text(yAxisLabel)
    });
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    for (prop in _) {
      margin[prop] = _[prop];
    }
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

  chart.colorRange = function(_) {
    if (!arguments.length) return color.range();
    color.range(_);
    return chart;
  };

  chart.colorDomain = function(_) {
    if (!arguments.length) return color.domain();
    color.domain(_);
    return chart;
  };

  chart.colorScale = function(_) {
    if (!arguments.length) return {domain: color.domain(), range: color.range()};
    color = _;
    return chart;
  };

  chart.xScale = function(_) {
    if (!arguments.length) return x;
    return chart;
  };
  chart.yScale = function(_) {
    if (!arguments.length) return y;
    return chart;
  };

  chart.xAxisLabel = function(_) {
    if (!arguments.length) return xAxisLabel;
    xAxisLabel = _;
    return chart;
  };

  chart.yAxisLabel = function(_) {
    if (!arguments.length) return yAxisLabel;
    yAxisLabel = _;
    return chart;
  };

  // Expose the axis' tickFormat method.
  d3.rebind(chart, xAxis, "tickFormat");
  d3.rebind(chart, yAxis, "tickFormat");

  return chart;
}