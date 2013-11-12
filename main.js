var margin = {top: 250, right: 50, bottom: 200, left: 50};

var width = 1200 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("display", "block")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json("data/113.json", drawGraph);

d3.select("#congress-picker > select")
  .on("change", function(d) {
    d3.select("#loading").style("display", null);
    congress = this.options[this.selectedIndex].value;
    d3.json("data/" + congress + ".json", drawGraph);
  });

function drawGraph(data) {
  // clear SVG
  svg.text('');

  var domain = d3.extent(data.links, function(d) {
    return d.weight;
  })

  var link_distance = d3.scale.pow()
    .exponent(3)
    .range([300, 1])
    .domain(domain);

  var force = d3.layout.force()
    .gravity(0.5)
    .charge(-1000)
    .linkDistance(function(d) {
      return link_distance(d.weight);
    })
    .linkStrength(0.05)
    .size([width, height])
    .nodes(data.nodes)
    .links(data.links);

  var stroke_width = d3.scale.pow()
    .exponent(5)
    .range([0, 5])
    .domain(domain);

  // Initiliaze force layout statically
  force.start();
  for (var i = 10 * data.nodes.length * data.nodes.length; i > 0; --i) force.tick();
  force.stop();

  links = svg.selectAll(".link")
      .data(data.links)
    .enter().append("line")
      .attr("opacity", 0.1)
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .attr("stroke-width", function(d) {
        return stroke_width(d.weight);
      })
      .attr("stroke", function(d) {
        // Edge color is halfway that of the two nodes
        return d3.interpolateLab(color(d["source"]), color(d["target"]))(0.5);
      });

  nodes = svg.selectAll(".node")
      .data(data.nodes)
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .on("mouseover", highlightNode)
      .on("mouseout", resetHighlight);

  nodes.append("circle")
    .attr("x", 0)
    .attr("y", 0)
    .attr("r", 6)
    .attr("stroke", "white")
    .attr("fill", color);

  nodes.append("text")
    .attr("dx", 10)
    .attr("dy", ".35em")
    .style("pointer-events", "none")
    .style("font-size", 10)
    .style("font-family", "sans-serif")
    .text(function(d) { return d.id });

  //force.alpha(0.01);

  d3.select("#loading").style("display", "none");
}

function color(d) {
  if (d["color"] == "b")
    return d3.lab("#1414ff");
  else if (d["color"] == "r")
    return d3.lab("#ff1414");
  else
    return d3.lab("#646464");
}

function highlightNode(node) {
  var g = d3.select(d3.event.target.parentNode);

  g
    .select("circle")
    .attr("r", 12);

  g
    .select("text")
    .attr("dx", 16)
    .style("font-size", 16)
    .style("font-weight", "bold")
    .style("stroke", "white")
    .style("stroke-width", 0.25);

  links
    .attr("opacity", 0.05);

  links
    .filter(function(d) {
      return d.source == node || d.target == node;
    }).attr("opacity", 1);

  links
    .sort(function(a, b) {
      // Makes sure the selected edges are always on top
      if (a.source == node || a.target == node)
        return 1;
      else if (b.source == node || b.target == node)
        return -1;
      else
        return 0;
    });

  nodes
    .filter(function(d) {
      return d != node;
    }).attr("opacity", 0.4);

  nodes
    .sort(function(a, b) {
      if (a == node)
        return 1;
      else if (b == node)
        return -1;
      else
        return 0;
    });
}

function resetHighlight() {
  nodes.selectAll("circle")
    .attr("r", 6);

  nodes.selectAll("text")
    .attr("dx", 10)
    .style("font-size", 10)
    .style("font-weight", null)
    .style("stroke", null)
    .style("stroke-width", null);

  links
    .attr("opacity", 0.1);

  nodes
    .attr("opacity", null);
}
