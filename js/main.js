var path = '../data/';
var dataFile = 'MoviesTV-noalsos-nodes.csv';

var tree;
var list = [];
var countries = [""];

initVis();

function list_to_tree(list) {
    var map = {}, node, roots = [], i;
    for (i = 0; i < list.length; i += 1) {
        map[list[i].id] = i; // initialize the map
        list[i].children = []; // initialize the children
        node = list[i];
        if (node.id !== "0") {
            // if you have dangling branches check that map[node.parent] exists
            list[map[node.parent]].children.push(node);
        } else {
            roots.push(node);
        }
    }
    return roots;
}

function initVis() {

  d3.csv(path.concat(dataFile), function(data) {  
    list.push(data);
  })
  setTimeout(function(){
    tree = list_to_tree(list);
    console.log(tree); 
  }, 500 );
  setTimeout(function(){
    createZoomableCircle((tree[0].children)[0]);
  }, 1000 );
}

function createZoomableCircle(data) {

  console.log(data);

  width = 932;
  height = width;
  format = d3.format(",d");

  color = d3.scaleLinear()
      .domain([0, 5])
      .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
      .interpolate(d3.interpolateHcl)

  pack = data => d3.pack()
      .size([width, height])
      .padding(3)
    (d3.hierarchy(data)
      .sum(d => d.productCount)
      .sort((a, b) => b.productCount - a.productCount))

  // console.log(pack);

  const root = pack(data);
  let focus = root;
  console.log(root);
  let view;

  const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
    .style("display", "block")
    .style("margin", "0 -14px")
    .style("background", color(0))
    .style("cursor", "pointer")
    .on("click", () => zoom(root));

  const node = svg.append("g")
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
      .attr("fill", d => d.children ? color(d.depth) : "white")
      .attr("pointer-events", d => !d.children ? "none" : null)
      .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
      .on("mouseout", function() { d3.select(this).attr("stroke", null); })
      .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));

  const label = svg.append("g")
      .style("font", "10px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
      .style("fill-opacity", d => d.parent === root ? 1 : 0)
      .style("display", d => d.parent === root ? "inline" : "none")
      .text(d => d.data.name);

  zoomTo([root.x, root.y, root.r * 2]);

  function zoomTo(v) {
    const k = width / v[2];

    view = v;

    label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("r", d => d.r * k);
  }

  function zoom(d) {
    const focus0 = focus;

    focus = d;

    const transition = svg.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween("zoom", d => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return t => zoomTo(i(t));
        });

    label
      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
      .transition(transition)
        .style("fill-opacity", d => d.parent === focus ? 1 : 0)
        .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
        .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
  }
}