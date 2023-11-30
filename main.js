// Variables for positioning elements
const CHART_WIDTH = 1200;
const CHART_HEIGHT = 600;
const MARGIN = { left: 80, bottom: 40, top: 20, right: 50 };
// Color scales from https://observablehq.com/@d3/color-schemes
const colorScale = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf","#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"]

// Class for the main visualization area
class MainVis {

    constructor(globalApplicationState) {
        this.globalApplicationState = globalApplicationState;

        // Main svg has two charts, one for the line & circle chart and another for the membership grid
        this.mainSVG = d3.select("#Main-div")
            .append("svg")
            .attr("id", "line-circle-chart")
            .attr("width", CHART_WIDTH)
            .attr("height", CHART_HEIGHT)
            .append("g")
            .attr("transform", function () {
                return ("translate("+MARGIN.left+",0)");
            });

        d3.select("#Main-div")
            .append("svg")
            .attr("id", "membership-grid")
            .attr("width", 0) //Set to 0 initially, then modify when needed
            .attr("height", 0)
            .append("g")
            .attr("transform", function () {
                return ("translate("+MARGIN.left+",0)")
        });

        this.legendSVG = d3.select("#Grid-legend-div")
            .append("svg")
            .attr("id", "grid-legend")
            .attr("width", 0) //Set to 0 initially, then modify when needed
            .attr("height", 0);

        this.compareSVG = d3.select("#Main-div")
            .append("svg")
            .attr("id", "compare-states")
            .attr("width", 0) //Set to 0 initially, then modify when needed
            .attr("height", 0)
            .append("g")
            .attr("transform", function () {
                return ("translate("+MARGIN.left+",0)");
            });

        // Add some buttons for membership grid
        // Need a foreign object to add html to svg
        let splitPartyObj = d3.select("#membership-grid")
            .append("foreignObject")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 200)
            .attr("height", 20);

        splitPartyObj.append("xhtml:input")
            .attr("type", "checkbox")
            .attr("id", "split-parties")
            .attr("value", "Split by Party");

        splitPartyObj.append("xhtml:label")
            .attr("for", "split-parties")
            .text("Split by Party");

        d3.select("#split-parties").on("change", () => {globalApplicationState.changingMembergridColor = true; this.renderVisualization();});


        // Append other groups to the main visualization that will be useful later
        // Append the X-Axis Group
        this.mainSVG.append("g")
            .attr("transform", "translate(0,"+(CHART_HEIGHT - MARGIN.bottom)+")")
            .attr("id", "main-x-axis");
        // Append the Y-Axis Group
        this.mainSVG.append("g")
            .attr("id", "main-y-axis");

        this.compareSVG.append("g")
            .attr("transform", "translate(0,"+(CHART_HEIGHT - MARGIN.bottom)+")")
            .attr("id", "main-x-compare-axis");
        // Append the Y-Axis Group
        this.compareSVG.append("g")
            .attr("id", "main-y-compare-axis");

        this.renderVisualization();
    }

    renderVisualization() {
        // Get the data
        let _this = this;
        let chamber = _this.globalApplicationState.chamber;
        let congress = _this.globalApplicationState.congress;
        let selectedData = this.globalApplicationState.congressData.filter(function (d) {
            if (_this.globalApplicationState.selectedStates.length > 0) {
                return _this.globalApplicationState.selectedStates.includes(d.state_chamber);
            }
            else if (chamber === "both" && congress === "all") {
                return d;
            } else if (chamber === "both") {
                return d.congress == congress;
            } else if (congress === "all") {
                return d.chamber === chamber;
            } else {
                return (d.congress == congress & d.chamber === chamber)
            }
        })
        if (this.globalApplicationState.selectedStates.length > 0){
            this.compareStates(selectedData);
        }
        else if (congress === "all") {
            this.renderTrends(selectedData);
        } else {
            this.renderSingle(selectedData);
        }
    }

    renderTrends(data){
        // Grow trend chart (if it isn't already)
        d3.select("#line-circle-chart").attr("width", CHART_WIDTH).attr("height", CHART_HEIGHT);
        d3.select("#membership-grid").attr("width", 0).attr("height", 0);
        d3.select("#compare-states").attr("width", 0).attr("height", 0);
        this.legendSVG.attr("width", 0).attr("height", 0);

        // Update the x-axis
        let xScale = d3.scaleLinear()
            .range([20,CHART_WIDTH-MARGIN.right-MARGIN.left])
            .domain(d3.extent(data, d => d.congress))
        let xAxis = d3.select("#main-x-axis");
        xAxis.call(d3.axisBottom(xScale).ticks(53));

        let metric = this.globalApplicationState.metric

        let yScale = d3.scaleLinear()
            .range([CHART_HEIGHT - MARGIN.bottom,MARGIN.top])
            .domain([0,d3.max(data, d => d[metric])])
            .nice();
        let yAxis = d3.select("#main-y-axis");
        yAxis.call(d3.axisLeft(yScale));


        // Rollup data
        let avgData = d3.rollup(data, v => d3.mean(v, d => d[metric]), d => d.congress)
        avgData = new Map(avgData);
        let avgDataArray = Array.from(avgData.entries())
        avgDataArray.sort((a,b) => a[0]-b[0])

        // Do same for max and min
        let minData = d3.rollup(data, v => d3.min(v, d => d[metric]), d => d.congress)
        minData = new Map(minData);
        let minDataArray = Array.from(minData.entries())
        minDataArray.sort((a,b) => a[0]-b[0])

        let maxData = d3.rollup(data, v => d3.max(v, d => d[metric]), d => d.congress)
        minData = new Map(maxData);
        let maxDataArray = Array.from(maxData.entries())
        maxDataArray.sort((a,b) => a[0]-b[0])
        //Doing Q1 & Q3, maybe even median
        /**
        let Q1Data = d3.rollup(data, v => d3.quantile(v, 0.25, d => d[metric]), d => d.congress)
        Q1Data = new Map(Q1Data);
        let Q1DataArray = Array.from(Q1Data.entries())
        Q1DataArray.sort((a,b) => a[0]-b[0])

        let Q3Data = d3.rollup(data, v => d3.quantile(v, 0.75, d => d[metric]), d => d.congress)
        Q3Data = new Map(Q3Data);
        let Q3DataArray = Array.from(Q3Data.entries())
        Q3DataArray.sort((a,b) => a[0]-b[0])

        let medData = d3.rollup(data, v => d3.quantile(v, 0.5, d => d[metric]), d => d.congress)
        medData = new Map(medData);
        let medDataArray = Array.from(medData.entries())
        medDataArray.sort((a,b) => a[0]-b[0])
         */

        // Add trend line
        let lineGenerator = d3.line()
            .x(function(d) {return xScale(d[0])})
            .y(function(d) {return yScale(d[1])})
        let line = this.mainSVG.selectAll(".trend-line")
        line
            .data(avgDataArray)
            .join("path")
            .transition()
            .duration(1000)
            .attr("class", "trend-line")
            .attr("stroke-width", 2)
            .style("fill", "none")
            .style("stroke", "#ff7202")
            .attr("d", function(d) {return lineGenerator(avgDataArray);})

        if(d3.select("#violin").property("checked")) {
            //Ease out the points
            let points = this.mainSVG.selectAll("circle").join("circle").transition().duration(1000).attr("r", 0)

            // Adding min line
            let minline = this.mainSVG.selectAll(".min-trend-line").data(minDataArray)
            minline
                .join("path")
                .transition()
                .duration(1000)
                .attr("class", "min-trend-line")
                .attr("d", lineGenerator(minDataArray))
                .attr("stroke-width", 1)
                .style("fill", "none")
                .style("stroke", "#ff7202")
    
            // Adding max line
            let maxline = this.mainSVG.selectAll(".max-trend-line").data(maxDataArray)
            maxline
                .join("path")
                .transition()
                .duration(1000)
                .attr("class", "max-trend-line")
                .attr("d", lineGenerator(maxDataArray))
                .attr("stroke-width", 1)
                .style("fill", "none")
                .style("stroke", "#ff7202")
        } else {
            //Ease out the lines
            let minline = this.mainSVG.selectAll(".min-trend-line").join("path").transition().duration(1000).ease(d3.easeExpOut).attr("stroke-width", 0);
            let maxline = this.mainSVG.selectAll(".max-trend-line").join("path").transition().duration(1000).ease(d3.easeExpOut).attr("stroke-width", 0);
                    // Add points
        let points = this.mainSVG.selectAll("circle")
        .data(data)

        //Add axis labels
        //X label
        this.mainSVG.selectAll(".xlabel")
            .data(metric)
            .join("text")
            .attr("class", "xlabel")
            .attr("text-anchor", "end")
            .attr("x", CHART_WIDTH/2)
            .attr("y", CHART_HEIGHT-6)
            .text("Congressional Meeting")
        //Y label
        this.mainSVG.selectAll(".ylabel")
            .data(metric)
            .join("text")
            .attr("class", "ylabel")
            .attr("text-anchor", "beginning")
            .attr("x", -CHART_HEIGHT/2)
            .attr("y", -50)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text(metric === "age_years" ? "Age" : "Number of Terms")

    points
        .join("circle")
        .transition()
        .duration(2000)
        .style("fill", "#14bcf8")
        .style("opacity", .5)
        .attr("cx", function(d) {return xScale(d.congress)})
        .attr("cy", function(d) {return yScale(d[metric])})
        .attr("r", 2);
        }

        
                

        /**
        //Adding in Q1 line
        let Q1line = this.mainSVG.selectAll(".Q1-trend-line").data(Q1DataArray)
        Q1line
            .join("path")
            .transition()
            .duration(1000)
            .attr("class", "Q1-trend-line")
            .attr("d", lineGenerator(Q1DataArray))
            .attr("stroke-width", 1)
            .style("fill", "none")
            .style("stroke", "#ff7202")

        //Adding in Q3 line
        let Q3line = this.mainSVG.selectAll(".Q3-trend-line").data(Q3DataArray)
        Q3line
            .join("path")
            .transition()
            .duration(1000)
            .attr("class", "Q3-trend-line")
            .attr("d", lineGenerator(Q3DataArray))
            .attr("stroke-width", 1)
            .style("fill", "none")
            .style("stroke", "#ff7202")
        
        //Adding in Median line
        let medline = this.mainSVG.selectAll(".med-trend-line").data(medDataArray)
        medline
            .join("path")
            .transition()
            .duration(1000)
            .attr("class", "med-trend-line")
            .attr("d", lineGenerator(medDataArray))
            .attr("stroke-width", 2)
            .style("fill", "none")
            .style("stroke", "#ff7202")
         */

        // Setup mouse move
        let _this = this;
        d3.select("#line-circle-chart").on("mousemove", function(event) {
            let mousePosition = d3.pointer(event);
            let x = mousePosition[0]-MARGIN.left;
            let congressNumber = Math.round(xScale.invert(x));
            let selectedAvgData = avgDataArray.filter(function (d) {
                return d[0] === congressNumber;
            })
            let selectedMaxData = maxDataArray.filter(function (d) {
                return d[0] === congressNumber;
            })
            let selectedMinData = minDataArray.filter(function (d) {
                return d[0] === congressNumber;
            })
            _this.updateTrendTooltip(x, selectedAvgData, selectedMinData, selectedMaxData, data, xScale.invert(x));
        })
    }

    updateTrendTooltip(x, selectedAvgData, selectedMinData, selectedMaxData, allData, xLoc) {
        if(xLoc < 66 || xLoc > 118) {
            this.mainSVG
                .selectAll(".markerGroup")
                .remove()
            return;
        }
        let metric = this.globalApplicationState.metric
        let yScale = d3.scaleLinear()
            .range([CHART_HEIGHT - MARGIN.bottom,MARGIN.top])
            .domain([0,d3.max(allData, d => d[metric])])
            .nice();

        let displayData = selectedAvgData;
        if (d3.select("#violin").property("checked")) {
            displayData.push([selectedMinData[0],selectedMinData[1]][0]);
            displayData.push([selectedMaxData[0],selectedMaxData[1]][0]);
        }

        let markerGroup = this.mainSVG
            .selectAll(".markerGroup")
            .data(displayData)
            .join(enter =>{
                let enterGroup = enter.append('g')
                    .classed('markerGroup', true);
                enterGroup.append('rect')
                    .style("y",MARGIN.top)
                    .attr("width", 1)
                    .attr("height", CHART_HEIGHT - MARGIN.top - MARGIN.bottom)
                    .style("fill", "#000")
                    .style("opacity", 1);
                enterGroup.append('text')
                return enterGroup
            }).attr("transform", function (d, i) {
                return "translate("+ (x) +",0)";
            });

        // Offset the x position of the text to minimize overlapping lines
        let anchor = (x >= 1000) ? "end" : "start"
        let xPos = (x >= 1000) ? -5 : 5

        // Position text based on metric
        if (d3.select("#violin").property("checked")) {
            markerGroup
                .select("text")
                .text(d => `${d3.format(".2f")(d[1])}`)
                .attr('fill', "black")
                .attr('font-size', 20)
                .attr('text-anchor', anchor)
                .attr("transform", function(d){
                    if (d[1] > 1) {
                    return `translate(${xPos}, ${yScale(d[1])+30})`}
                  else {
                        return `translate(${xPos}, ${yScale(d[1])-5})`
                    }
                })

        }else {
            markerGroup
                .select("text")
                .text(d => `${d3.format(".2f")(d[1])}`)
                .attr('fill', "black")
                .attr('font-size', 20)
                .attr('text-anchor', anchor)
                .attr("transform", d => `translate(${xPos}, 20)`);
        }
    }

    renderSingle(data) {
        let _this = this;
        // Shrink the line-circle chart to 0 to display other chart
        d3.select("#line-circle-chart").attr("width", 0).attr("height", 0);
        d3.select("#membership-grid").attr("width", CHART_WIDTH).attr("height", CHART_HEIGHT);
        d3.select("#compare-states").attr("width", 0).attr("height", 0);

        let memberGrid = d3.select("#membership-grid");
        let metric = this.globalApplicationState.metric

        //Define some parameters, might play around with this later
        let columns = 40;
        let cellSize = CHART_WIDTH/columns;

        //Stole same color from maps
        let color = d3.scaleSequential(d3.interpolatePurples).domain(d3.extent(data, d => d[metric]))

        //Some extra color scales for parties
        let demsColor = d3.scaleSequential(d3.interpolateBlues).domain(d3.extent(data, d => d[metric]))
        let repsColor = d3.scaleSequential(d3.interpolateReds).domain(d3.extent(data, d => d[metric]))
        let othsColor = d3.scaleSequential(d3.interpolateGreens).domain(d3.extent(data, d => d[metric]))

        //Sort the data so it looks prettier :)
        let sortedData = d3.sort(data, (d) => d[metric]);

        let gridElements = memberGrid.selectAll("rect")
            .data(sortedData, d => d.bioname) //Where the magic happens
            .join(
                function(enter){
                    enter = enter
                    .append("rect")
                    .classed(".member", true)
                    .attr("class", function(d) {return d.bioname})
                    .attr("x", (d, i) => (i % columns)*cellSize)
                    .attr("y", (d, i) => Math.floor(i/columns)*cellSize + cellSize/2)
                    .style("fill", function(d){
                        //Check if split by party box is checked
                        if(d3.select("#split-parties").node().checked){
                            if(d.party_name === "Republican"){return repsColor(d[metric]);}
                            else if(d.party_name === "Democrat"){return demsColor(d[metric]);}
                            else {return othsColor(d[metric]);}
                        } else {
                            return color(d[metric]);
                        }
                    })
                    .transition()
                    .delay(globalApplicationState.firstMembergridLoad? 0 : 4000)
                    .duration(1000)
                    .attr("width", cellSize)
                    .attr("height", cellSize);

                    //Change any variables related to delay
                    globalApplicationState.firstMembergridLoad = false;
                    return enter;
                },
                function(update){
                    update
                    .transition()
                    .duration(globalApplicationState.changingMembergridColor? 0 : 4000)
                    .attr("x", (d, i) => (i % columns)*cellSize)
                    .attr("y", (d, i) => Math.floor(i/columns)*cellSize + cellSize/2)
                    .style("fill", function(d){
                        //Check if split by party box is checked
                        if(d3.select("#split-parties").node().checked){
                            if(d.party_name === "Republican"){return repsColor(d[metric]);}
                            else if(d.party_name === "Democrat"){return demsColor(d[metric]);}
                            else {return othsColor(d[metric]);}
                        } else {
                            return color(d[metric]);
                        }
                    });
                    if(globalApplicationState.changingMembergridColor){
                        globalApplicationState.changingMembergridColor = false;
                    }
                    return update;
                },
                function(exit){
                    return exit
                    .transition()
                    .duration(4000)
                    .attr("y", CHART_HEIGHT+50)
                    .remove();
                }
            )
            .on("mouseover", function() {
                d3.select(this)
                    .style("stroke", "#fffc02")
                    .style("stroke-width", 5);
                let selected = this.__data__
                _this.displayData(selected, d3.pointer(event)[0])
            })
            .on("mouseout", function () {
                d3.select(this)
                    .style("stroke", "black")
                    .style("stroke-width", 1);
                memberGrid.selectAll("text").remove();
            })
            .attr("transform", function () {
                return ("translate(0," + MARGIN.top + ")");
            })
            .style("stroke", "black");

        this.renderLegend(data, metric);
    }
    // Add the legend
    /*
    I had trouble doing this with a legend. The following method is based on this site:
    http://using-d3js.com/04_05_sequential_scales.html

    I have attempted to explain what each step is doing
     */
    renderLegend(data, metric) {
        let colorArray = ["#fcfbfd","#fcfbfd","#fbfafc","#fbfafc","#faf9fc","#faf9fc","#faf8fb","#f9f8fb","#f9f7fb","#f8f7fb","#f8f7fa","#f7f6fa","#f7f6fa","#f7f5fa","#f6f5f9","#f6f4f9","#f5f4f9","#f5f3f9","#f4f3f8","#f4f2f8","#f4f2f8","#f3f2f8","#f3f1f7","#f2f1f7","#f2f0f7","#f1f0f7","#f1eff6","#f0eff6","#f0eef6","#efeef5","#efedf5","#eeedf5","#eeecf5","#edecf4","#edebf4","#ecebf4","#ebeaf3","#ebe9f3","#eae9f3","#eae8f3","#e9e8f2","#e8e7f2","#e8e7f2","#e7e6f1","#e7e5f1","#e6e5f1","#e5e4f0","#e5e4f0","#e4e3f0","#e3e2ef","#e3e2ef","#e2e1ef","#e1e1ee","#e1e0ee","#e0dfee","#dfdfed","#dedeed","#dedded","#ddddec","#dcdcec","#dbdbec","#dbdaeb","#dadaeb","#d9d9ea","#d8d8ea","#d7d7ea","#d7d7e9","#d6d6e9","#d5d5e8","#d4d4e8","#d3d3e8","#d2d3e7","#d2d2e7","#d1d1e6","#d0d0e6","#cfcfe5","#cecee5","#cdcee5","#cccde4","#cbcce4","#cbcbe3","#cacae3","#c9c9e2","#c8c8e2","#c7c7e1","#c6c6e1","#c5c5e0","#c4c4e0","#c3c3df","#c2c3df","#c1c2de","#c0c1de","#bfc0dd","#bebfdd","#bebedc","#bdbddc","#bcbcdb","#bbbbda","#babada","#b9b9d9","#b8b8d9","#b7b7d8","#b6b5d8","#b5b4d7","#b4b3d6","#b3b2d6","#b2b1d5","#b1b0d5","#b0afd4","#afaed4","#aeadd3","#aeacd2","#adabd2","#acaad1","#aba9d1","#aaa8d0","#a9a7cf","#a8a6cf","#a7a5ce","#a6a4ce","#a5a3cd","#a4a2cd","#a3a1cc","#a2a0cb","#a19fcb","#a09eca","#9f9dca","#9e9cc9","#9e9ac9","#9d9ac8","#9c99c8","#9b98c7","#9a97c7","#9996c6","#9895c6","#9794c5","#9693c5","#9592c4","#9491c4","#9390c3","#928fc3","#918ec2","#908dc2","#908cc1","#8f8bc1","#8e8ac0","#8d89c0","#8c88bf","#8b87bf","#8a86be","#8985be","#8884bd","#8883bd","#8782bc","#8680bc","#857fbb","#847eba","#837dba","#827cb9","#827bb9","#817ab8","#8079b8","#7f77b7","#7e76b6","#7e75b6","#7d74b5","#7c73b4","#7b71b4","#7b70b3","#7a6fb3","#796eb2","#786cb1","#786bb1","#776ab0","#7668af","#7567af","#7566ae","#7465ad","#7363ad","#7362ac","#7261ab","#715fab","#705eaa","#705ca9","#6f5ba8","#6e5aa8","#6e58a7","#6d57a6","#6c56a6","#6c54a5","#6b53a4","#6a52a4","#6950a3","#694fa2","#684ea2","#674ca1","#674ba0","#664aa0","#65489f","#65479e","#64469e","#63449d","#63439c","#62429c","#61409b","#613f9a","#603e9a","#5f3c99","#5e3b99","#5e3a98","#5d3897","#5c3797","#5c3696","#5b3595","#5a3395","#5a3294","#593194","#582f93","#582e92","#572d92","#562b91","#562a91","#552990","#54288f","#54268f","#53258e","#52248e","#52238d","#51218c","#50208c","#501f8b","#4f1e8b","#4e1c8a","#4e1b8a","#4d1a89","#4c1988","#4c1788","#4b1687","#4a1587","#4a1486","#491286","#481185","#481084","#470f84","#460d83","#460c83","#450b82","#440a82","#440981","#430780","#420680","#42057f","#41047f","#40027e","#40017e","#3f007d"]
        // Set an array to use for data that has index values for the color scale
        let legendData = Array.from(Array(colorArray.length).keys());
        d3.select("#grid-legend").attr("height", 100).attr("width", CHART_WIDTH);
        d3.select("#grid-legend").selectAll("text").remove();
        // Set the scaling for the bars
        var xScale = d3.scaleLinear()
            .domain([0,colorArray.length-1])
            .range([10, 150]);

        // Add a rectangle for each color in the color array
        d3.select("#grid-legend").selectAll("rect")
            .data(legendData)
            .enter()
            .append("rect")
            .attr("x", (d) => (xScale(d)))
            .attr("y", 20)
            .attr("height", 20)
            .attr("width", 1)
            .attr("fill", (d) => colorArray[d]);

        // Add the labels
        d3.select("#grid-legend").append("text")
            .text("0")
            .attr('fill', 'black')
            .attr('x', 10)
            .attr('y', 15)
            .attr('font-size', 18)
            .attr('text-anchor', 'middle');

        // Find the highest value and format it
        let maximumMetric = d3.max(data, d => d[metric]);
        let formatted = d3.format(".2f")(maximumMetric);
        d3.select("#grid-legend").append("text")
            .text(formatted)
            .attr('fill', 'black')
            .attr('x', 150)
            .attr('y', 15)
            .attr('font-size', 18)
            .attr('text-anchor', 'middle');

        // Add rrectangles for each party color
            d3.select("#grid-legend").append('rect')
                .attr("x", 295)
                .attr("y", 20)
                .attr("height", 20)
                .attr("width", 20)
                .attr("fill", "#0227ff")

            d3.select("#grid-legend").append('text')
                .text("Democrat")
                .attr('fill', 'black')
                .attr('x', 320)
                .attr('y', 37)
                .attr('font-size', 18)
                .attr('text-anchor', 'left');


            d3.select("#grid-legend").append('rect')
                .attr("x", 400)
                .attr("y", 20)
                .attr("height", 20)
                .attr("width", 20)
                .attr("fill", "#ff0203")

            d3.select("#grid-legend").append("text")
                .text("Republican")
                .attr('fill', 'black')
                .attr('x', 425)
                .attr('y', 37)
                .attr('font-size', 18)
                .attr('text-anchor', 'left');

            d3.select("#grid-legend").append('rect')
                .attr("x", 520)
                .attr("y", 20)
                .attr("height", 20)
                .attr("width", 20)
                .attr("fill", "#39d51e")
            d3.select("#grid-legend").append("text")
                .text("Other")
                .attr('fill', 'black')
                .attr('x', 545)
                .attr('y', 37)
                .attr('font-size', 18)
                .attr('text-anchor', 'left');

        d3.select("#grid-legend").append("text")
            .text("Party Colors:")
            .attr('fill', 'black')
            .attr('x', 195)
            .attr('y', 37)
            .attr('font-size', 18)
            .attr('text-anchor', 'left');
    }

    displayData(selected, x) {
        let metric = this.globalApplicationState.metric
        let memberGrid = d3.select("#membership-grid");
        memberGrid.selectAll("text").remove()
        let chamber = this.globalApplicationState.chamber;
        let yOriginal = 0;
        if (chamber === "both") {
            yOriginal = 500;
        }
        else if (chamber === "Senate") {
            yOriginal = 150
        }
        else {
            yOriginal = 420
        }

        memberGrid.append("text")
            .text(`${selected.bioname}: ${metric === "age_years" ? d3.format(".2f")(selected[metric]) : selected[metric]}`)
            .attr('x', x)
            .attr('y', yOriginal)
            .attr('text-anchor', x > 900 ? 'end':'start')
    memberGrid.append("text")
        .text(`${selected.party_name}`)
        .attr('x', x)
        .attr('y', yOriginal + 15)
        .attr('text-anchor', x > 900 ? 'end':'start')
    memberGrid.append("text")
        .text(`${selected.state_name}`)
        .attr('x', x)
        .attr('y', yOriginal + 30)
        .attr('text-anchor', x > 900 ? 'end':'start')
}

async compareStates(data) {
    let _this = this;
    d3.select("#line-circle-chart").attr("width", 0).attr("height", 0);
    d3.select("#membership-grid").attr("width", 0).attr("height", 0);
    d3.select("#compare-states").attr("width", CHART_WIDTH).attr("height", CHART_HEIGHT);
    this.legendSVG.attr("width", 0).attr("height", 0);
    let metric = this.globalApplicationState.metric;

    // Group the data
    let groupedData = d3.rollups(data, v => d3.mean(v, d => d[metric]), d=> d.state_chamber, d => d.congress);
    await groupedData.forEach(function(d) {
        let unsorted = d[1];
        d[1] = unsorted.sort((a,b) => a[0]-b[0]);
    })

    // Set the x scale
    let xScale = d3.scaleLinear()
        .range([0,CHART_WIDTH-MARGIN.right-MARGIN.left])
        .domain([d3.min(data, d => d.congress),d3.max(data, d => d.congress)]);

    // Set the y scale
    let yScale = d3.scaleLinear()
        .range([CHART_HEIGHT - MARGIN.bottom,MARGIN.top])
        .domain([0, d3.max(data, d => d[metric])])
        .nice();

    // Draw the axes
    let xAxis = d3.select("#main-x-compare-axis");
    xAxis.transition().duration(300).call(d3.axisBottom(xScale).ticks(53));
    let yAxis = d3.select("#main-y-compare-axis");
    yAxis.transition().duration(300).call(d3.axisLeft(yScale));

    //Add axis labels
    //X label
    this.compareSVG.selectAll(".xlabel")
        .data(metric)
        .join("text")
        .attr("class", "xlabel")
        .attr("text-anchor", "end")
        .attr("x", CHART_WIDTH/2)
        .attr("y", CHART_HEIGHT-6)
        .text("Congressional Meeting")
    //Y label
    this.compareSVG.selectAll(".ylabel")
        .data(metric)
        .join("text")
        .attr("class", "ylabel")
        .attr("text-anchor", "beginning")
        .attr("x", -CHART_HEIGHT/2)
        .attr("y", -50)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text(metric === "age_years" ? "Age" : "Number of Terms")

    // Define line generator
    let lineGenerator = d3.line()
        .x(d=>xScale(d[0]))
        .y(d=>yScale(d[1]))

    // Draw the lines
    let line = this.compareSVG
        .selectAll(".compare-states")
        .data(groupedData)
    line.enter("g")
        .append("path")
        .attr("class", "compare-states")
        .merge(line)
        .attr("d", function (d) {
            return lineGenerator(d[1]);
        })
        .style("fill", "none")
        .style("stroke", function(d) {
            return colorScale[_this.globalApplicationState.colorDict[d[0]]];
        })
        .attr("stroke-width", 1);

    line.exit().remove();

    // Setup mouse move
   d3.select("#compare-states").on("mousemove", function(event) {
        let mousePosition = d3.pointer(event);
        let x = mousePosition[0]-MARGIN.left;
        let congressNumber = Math.round(xScale.invert(x));
        let selectedData = data.filter(function (d) {
            return d.congress === congressNumber;
        })
        _this.updateTooltip(x, selectedData, xScale.invert(x))
    })
}

async updateTooltip(x, selectedData, xLoc) {
    if(xLoc < 66 || xLoc > 118) {
        d3.select("#compare-states")
            .selectAll(".markerGroup")
            .remove()
        return;
    }
    let _this = this;
    let metric = this.globalApplicationState.metric;
    let groupedData = d3.rollups(selectedData, v => d3.mean(v, d => d[metric]), d=> d.state_chamber);
    await groupedData.sort((a,b) => a[1] - b[1]);

    let markerGroup = this.compareSVG
        .selectAll(".markerGroup")
        .data(groupedData)
        .join(enter =>{
            let enterGroup = enter.append('g')
                .classed('markerGroup', true);
            enterGroup.append('rect')
                .style("y",MARGIN.top)
                .attr("width", 1)
                .attr("height", CHART_HEIGHT - MARGIN.top - MARGIN.bottom)
                .style("fill", "#000")
                .style("opacity", 1);
            enterGroup.append('text')
            return enterGroup
        }).attr("transform", function (d, i) {
            return "translate("+ (x) +",0)";
        });

    // Offset the x position of the text to minimize overlapping lines
    let anchor = (x >= 800) ? "end" : "start"
    let xPos = (x >= 800) ? -5 : 5
    let numStates = groupedData.length;

    // Position text based on metric
    if (metric === "age_years") {
        markerGroup
            .select("text")
            .text(d => `${d[0]}, ${d3.format(".2f")(d[1])}`)
            .attr('fill', d => colorScale[_this.globalApplicationState.colorDict[d[0]] % colorScale.length])
            .attr('font-size', 14)
            .attr('text-anchor', anchor)
            .attr("transform", (d, i) => `translate(${xPos}, ${CHART_HEIGHT - MARGIN.bottom - 14 - (14 * i)})`);
    }else {
        markerGroup
            .select("text")
            .text(d => `${d[0]}, ${d3.format(".2f")(d[1])}`)
            .attr('fill', d => colorScale[_this.globalApplicationState.colorDict[d[0]] % colorScale.length])
            .attr('font-size', 14)
            .attr('text-anchor', anchor)
            .attr("transform",(d,i) => `translate(${xPos}, ${numStates*14 - 14*i + MARGIN.top})`)
    }
    }
}
