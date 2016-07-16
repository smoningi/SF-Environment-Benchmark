function hStackedBarChart() {
  var margin = {top: 0, right: 0, bottom: 20, left: 10},
      width = 960,
      height = 500

  var color = d3.scale.threshold()
      // .range(["#f7f7f7","#252525"]);

  var stack = d3.layout.stack(),
      x = d3.scale.linear(),
      y = d3.scale.linear(),
      xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(5, 0);

  function chart(selection) {
    selection.each(function(data) {
      // stacked bar chart example http://bl.ocks.org/mbostock/1134768
      // horizontal: http://bl.ocks.org/wpoely86/e285b8e4c7b84710e463

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

  // Expose the histogram's value, range and bins method.
  // d3.rebind(chart, stack, "value", "range", "bins");

  // Expose the x-axis' tickFormat method.
  d3.rebind(chart, xAxis, "tickFormat");

  return chart;
}