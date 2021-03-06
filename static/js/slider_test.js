//circle slider code////////////////////
var width = 600;
var height = 500;
 
var holder = d3.select("body")
      .append("svg")
      .attr("width", width)    
      .attr("height", height); 

// draw the circle

holder.append("circle")
  .attr("cx", 300)
  .attr("cy", 150) 
  .style("fill", "none")   
  .style("stroke", "blue") 
  .attr("r", 120);

// when the input range changes update the circle 
d3.select("#nRadius").on("input", function() {
  update(+this.value);
});

// Initial starting radius of the circle 
update(0);

// update the elements
function update(nRadius) {

  // adjust the text on the range slider
  d3.select("#nRadius-value").text(nRadius);
  d3.select("#nRadius").property("value", nRadius);

  // update the rircle radius
  holder.selectAll("circle") 
    .attr("r", nRadius);
}
/////////////////////////////