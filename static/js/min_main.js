// stick everything inside a namespace to avoid conflicts with different scripts
if (typeof VIZ == "undefined" || !VIZ) {
  var VIZ = {
    windowDiv: '#visualisation', //links up with the Div with id=visualisation from the index.html
    windowCount: 0 // creates window count variable
  };
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Given a location for inserting the chart and which probes to listen to generate a chart
// TODO: these parameters could be managed better
// probeLabelList gets passed to the self object as a Title for the chart inputs list
VIZ.genChart = function(probeLabelList, label, probeDispatch, windowHeight, windowWidth, displayedDataSize){

  // In case we forget the 'new' keyword when creating a viz.genchart
  if ( !(this instanceof VIZ.genChart) ) {
    return new VIZ.genChart(selector, probeLabelList, label, probeDispatch);
  }

  // the next line is necessary so that code can still work while 
  // changing contexts, for example while in the window constructor
  var self = this
  self.windowHeight = windowHeight; //assigns the windowHeight that was passed in as a parameter
  self.windowWidth = windowWidth;//assigns the windowWidth that was passed in as a parameter
  this.label = label;  // why did you switch to using "this"???

  self.selector = "#chart-window-"+VIZ.windowCount; // why is this not used in the jquery append below

  // Create the window object which holds the chart, this gets created underneath the visualisation div
  // the new object has the id chart-window-X , X given by window count
  $(VIZ.windowDiv).append("<div id='chart-window-"+VIZ.windowCount+"'>");
  VIZ.windowCount += 1; // increment window count

  //Set 
  self.container = $(self.selector).window({ //not sure what this window selector does.... appears to select the charts window
    width: self.windowWidth,
    height: self.windowHeight,
    title: label,
    // subcribe to the resize event so that we can resize the chart
    resizeStop: function(event, ui){
      self.windowWidth = ui.size.width;
      self.windowHeight = ui.size.height;
      self.draw(self);
    }
  });
// probeLabelList gets passed to the self object as a Title for the chart inputs list
  self.chartInputs = probeLabelList; //Probes to listen to

  self.init(displayedDataSize);
  self.draw(self);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////




///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// These are the default functions that other charts might want to modify
// This is an array with keys and functions
VIZ.genChart.prototype = {
  
  // FUNCTION 1: initialize the chart
  init: function(displayedDataSize){
    this.xAxisDomain = 50; // TODO: rename this variable

    //Creates an array of 40 zeros
    this.chartData = Array.apply(null, Array(displayedDataSize)).map(Number.prototype.valueOf,0);

    //BIND TO "probeload" + this.label
    probeDispatch.on(("probeLoad."+this.label), this.probeParse.bind(this));

  },

  // FUNCTION 2: draw the chart, called on construction and update of the chart
  draw: function(self){
    // TODO: How to set these ranges according to the expected output? 
    // How did Javaviz do it?
    // Was it based off the radius? -- WHAT RADIUS??
    var margin = {top: 20, right: 20, bottom: 20, left: 40},
      width = self.windowWidth - margin.left - margin.right,
      height = self.windowHeight - margin.top - margin.bottom;

    // Domain is the minimum and maximum values to display on the graph
    // Range is the mount of SVG to cover
    // Get passed into the axes constructors
    // TODO: better names for these variables

    self.xAxisScale = d3.scale.linear()
        .domain([0, self.xAxisDomain])
        .range([0, width]);
    
    var yAxisScale = d3.scale.linear()
        .domain([-30, 30])
        .range([height, 0]);
     
    // gets a set of x and y co-ordinates from our data
    //
    self.line = d3.svg.line()
        // sets the x value to move forward with time
        .x(function(data, index) { return self.xAxisScale(index); })
        // sets the y value to just use the data y value
        .y(function(data, index) { return yAxisScale(data); });

    // Remove previously rendered graph (used when updating)
    d3.select(self.selector).selectAll("*")
      .remove();

    // create the svg canvas
    var canvas = d3.select(self.selector)
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    canvas.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height);

    // create the x and y axis 
    // TODO: the number of ticks for this can be a bit silly
    // how should this be improved?
/////////////////////////////DRAWING AXES////////////////////////////////////////////

    var horizontal_axis = d3.svg.axis()
                      .scale(self.xAxisScale)
                      .orient("bottom");

    var vertical_axis = d3.svg.axis()
                        .scale(yAxisScale)
                        .orient("left");

    canvas.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + yAxisScale(0) + ")") //BROKEN code for moving the x axis as it updates BROKEN
        .call(horizontal_axis);

    canvas.append("g")
        .attr("class", "y axis")
        .call(vertical_axis);
/////////////////////////////////////////////////////////////////////////////////////////


    // create the line or the "path" for the appended data
    self.path = canvas.append("g")
        .attr("clip-path", "url(#clip)") // limit where the line can be drawn
      .append("path")
        .datum(self.chartData) // chartData is the data we're going to plot
        .attr("class", "line")
        .attr("d", self.line); // This is to help draw the svg path
  },

  // FUNCTION 3: This triggered below whenever the Dispatcher Trigger updates 
  probeParse: function(probeData) {
    // Filter until you have only the desired data
    // TODO: Make this work for multiple probes in one chart
    // currently only works for one probe per chart
    var self = this;
    // Loop through each of the inputs you want to plot
    this.chartInputs.forEach(function(input) {
          // Remove the old data
        self.chartData.shift();
        //push in the new data
        if (self.label == "Input B"){
          self.chartData.push(input_slider);
          console.log("if happened")
        }
        else{
          self.chartData.push(probeData[input].data[0]);
          console.log("else happened")
        }
    });

    // Then update the path
    self.path
      .attr("d", self.line)
      .attr("transform", null)
    .transition()
      .duration(0.1) // this is the duration of the transition
      .ease("linear") // this is just to say that the speed of the line should be constant
      .attr("transform", "translate(" + self.xAxisScale(-1) + ",0)");
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////


//circle slider code////////////////////
var width = 600;
var height = 500;
var input_slider;

// when the input range changes update
d3.select("#nRadius").on("input", function() {
  update(+this.value);
});

// Initial starting radius of the circle 
update(5);

// update the elements
function update(nRadius) {

  // adjust the text on the range slider
  
  d3.select("#nRadius-value").text(nRadius);
  d3.select("#nRadius").property("value", nRadius);

  input_slider = nRadius;


}
/////////////////////////////



// this is where the script actually starts
// taskbar has to be created first before creating any windows
// because that's what the library forces us to do
$( ".taskbar" ).taskbar();

// DECLARE create a "dispatch" to co-ordinate updates between charts
var probeDispatch = d3.dispatch("probeLoad");

new VIZ.genChart(["prod_probe"], "Product", probeDispatch, 500, 400, 40);
new VIZ.genChart(["inputB_probe"], "Input B", probeDispatch, 500, 400, 40);
//new VIZ.genChart(["inputA_probe"], "Input A", probeDispatch, 500, 400, 40);

// Imitate reading from web socket
var lines;
var parse_timer;
var line_count = 0;

// read from our data file and load it into the dispatch
function parse_dispatch(){
  tmp_d = $.parseJSON(lines[line_count]);
  //console.log(tmp_d);
  //Change the counter in the top right
  $("#simulation #time").text(tmp_d.data.t.toFixed(3));
  
  //This is a TRIGGER (other things can listen to this)
  probeDispatch.probeLoad(tmp_d.data.probes);
  line_count += 1;
  if(line_count >= lines.length){
    //line_count = 0
    // stop event trigger uncomment the previous line and comment out this line
    // to make the script loop after it's done parsing the data
    window.clearInterval(parse_timer);
  }
};

// get the data file and split up the lines///////////////////////////////////////////////////
$.get('static/messages.json', function (data) {
  // load the fake data from the messages.json file and parse it at a rate of 1 line every 50ms
  lines = data.split("\n"); // put everything on a new line
  parse_timer = window.setInterval(
    function () {
      parse_dispatch();
    }, 50);
}, 'text');
///////////////////////////////////////////////////////////////////////