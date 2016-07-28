function hStackedBarChart() {
  /* TODO use d3.stack instead */

  var margin = {top: 0, right: 0, bottom: 20, left: 10},
      width = 960,
      height = 500

  var color = d3.scale.threshold()
      .range(["#f7f7f7","#252525"]);

  var stack = d3.layout.stack()
  var x = d3.scale.linear()
  var y = d3.scale.linear()

  function chart(selection) {
    selection.each(function(data) {
      /* stacked bar chart example http://bl.ocks.org/mbostock/1134768 */
      data = arrayQuartiles(data)

      /* Update the x-scale. */
      x   .domain(d3.extent(data))
          .range([0, width - margin.left - margin.right]);

      /* Update the y-scale. */
      y   .domain( [0,1] )
          .range([height - margin.top - margin.bottom, 0]);

      /* Select the svg element, if it exists. */
      var svg = d3.select(this).selectAll("svg").data([data]);

      /* Otherwise, create the skeletal chart. */
      var gEnter = svg.enter().append("svg").append("g");
      gEnter.append("g").attr("class", "bars");
      gEnter.append("g").attr("class", "labels");

      /* Update the outer dimensions. */
      svg .attr("width", width)
          .attr("height", height);

      /* Update the inner dimensions. */
      var g = svg.select("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      /* Update the bars. */
      var bar = svg.select(".bars").selectAll(".bar").data(data);
      bar.enter().append("rect").attr('class', 'bar');
      bar.exit().remove();
      bar .attr("width", function(d,i){ return x(data[i+1]) - x(d) })
          .attr("x", function(d,i) { return (i===0) ? 0 : x(d) })
          .attr("y", function(d) { return y(1); })
          .attr("height", function(d) { return y.range()[0] - y(1) })
          .attr('fill', function(d,i){ return color(d) } )
          .order()

      /* Update the axis labels. */
      var label = svg.select('.labels').selectAll('.label').data(data);
      label.enter().append('text').attr('class', 'label');
      label.exit().remove();
      label.style("text-anchor", function(d, i){
            if (i === 0) {return 'end'}
            else if (i === 4 ) {return 'start'}
            else {return 'middle'}
          })
          .style('alignment-baseline', function(d, i){
            if (i === 0 || i === 4 ) return 'middle'
            else if (i === 1 || i === 3 ){return 'before-edge'}
            return 'after-edge'
          })
          .attr("transform", function(d,i){
            var ypos
            if (i === 0 || i === 4 ) ypos = 0.5
            else if (i === 1 || i === 3 ){ypos = 0}
            else {ypos = 1}
            return "translate(" + x(d) + "," + y(ypos) + ")"
          })
          .text(function(d){return d})
    });
  }

  function arrayQuartiles (sortedArr) {
    return [
      sortedArr[0],
      d3.quantile(sortedArr,0.25),
      d3.quantile(sortedArr,0.5),
      d3.quantile(sortedArr,0.75),
      sortedArr[sortedArr.length-1]
    ]
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

  return chart;
}