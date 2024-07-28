var data;
var totalData;

/**
 * Initialize the page with loading data and graph
 */
async function init() {
    data = await d3.csv("dataset/world_population.csv");
    totalData = await d3.csv("dataset/total_world_population.csv");

    displayPieChart(data);
    displayBarChart(totalData);
    displayLineChart(totalData);
}

// Data process helper functions

/**
 * 
 * Get population of years for a given data row
 * 
 * @param {*} dataRow 
 * @returns a list of data in ascending order
 */
function getYearPopulation(dataRow, filterString) {
    var values = Object.keys(dataRow).map(function (key) {
        if (key.endsWith("Population") && key.includes(filterString)) {
            return Math.round(dataRow[key]);
        }
    });

    // filter undefined values and sort by ascending year order
    values = values.filter(x => x !== undefined).reverse()
    return values
}

/**
 * 
 * Get a selected country's population data row
 * 
 * @param {*} country 
 * @returns a data row
 */
function getCountryPopulation(country) {
    for (x in data) {
        if (data[x]['Country/Territory'] == country) {
            return data[x];
        }
    }
    return [];
}

// Other Helper Functions 

function showDiv(element) {
    element.style.display = "block";
}
  
function closeDiv(element) {
    element.style.display = "none";
}


// Draw the pie chart, which is the main graph of the drill-down visualization
function displayPieChart(data) {
    var width = 500,
        height = 500,
        outerRadius = Math.min(width, height) / 2,
        innerRadius = outerRadius * .5,
        innerRadiusMouseOver = outerRadius * .45,
        color = d3.scaleOrdinal(d3.schemeSet3);

    var svg = d3.selectAll("#pieChart")
        .data([data])
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

    var pie = d3.pie().value(function (d) { return d['2022 Population']; });

    var arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    var arcMouseOver = d3.arc().innerRadius(innerRadiusMouseOver).outerRadius(outerRadius);

    var slices = svg.selectAll('slice')
        .data(pie)
        .enter()
        .append("g")
            .attr("class", "slice")
            .on("mouseover", function(d, i) {
                d3.select(this)
                    .select("path")
                    .transition()
                    .duration(750)
                    .attr("d", arcMouseOver);

                var annotation = d.data['Country/Territory'] + ": " + d.data['World Population Percentage'] + "%";
        
                var coord = d3.mouse(document.getElementById("pieChart"));
                var x = coord[0], 
                    y = coord[1];
                
                var tooltip = d3.select("#pieTooltip")
                tooltip.style("opacity", 1)
                    .style("opacity", 1)
                    .style("background", "white")
                    .style("left", x + 15 + "px")
                    .style("top", y + 15 + "px")
                    .html(annotation);        
            })
            .on("mouseout", function(d, i) {
                d3.select(this).select("path")
                    .transition()
                    .duration(750)
                    .attr("d", arc);

                d3.select("#pieTooltip").style("opacity", 0);
            })
            .on("click", clickToUpdate);
    
    slices.append('path')
        .attr('d', arc)
        .attr("fill", function (d, i) { return color(i); })
        .style("opacity", 0.7);

    slices
        .filter(function (d) { return d.endAngle - d.startAngle > .1; })
        .append('text')
            .text(function (d) { return d.data['Country/Territory'] })
            .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")rotate(" + angle(d) + ")"; })
            .attr("text-anchor", "middle")
            .attr("class", "slice");
    
    d3.selectAll("slice").selectAll("path").transition()
        .duration(750)
        .delay(10)
        .attr("d", arc);

    // // Pie chart title			
    svg.append("text")
        .attr("text-anchor", "middle")
        .text("World Population 2022")
        .attr("class", "title");
    
    
    // var narrationDiv = document.getElementById("narration");
    // closeDiv(narrationDiv);

    function angle(d) {
        var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
        return a > 90 ? a - 180 : a;
    }

    function clickToUpdate(d, i) {
        var country = d.data['Country/Territory'];
        var dataRow = getCountryPopulation(country);

        updateBarChart(dataRow, color(i), country);
        updateLineChart(dataRow, color(i));
        getNarrationInfo(dataRow, country);

        var pieChartDiv = document.getElementById("pieChart");
        closeDiv(pieChartDiv);
    }
}


// Bar charts helper functions
function drawBarChartHelper(data, color, title, update) {
    var margin = { top: 50, right: 10, bottom: 20, left: 100 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom,
        barPadding = 1;

    var year = [1970, 1980, 1990, 2000, 2010, 2020];

    var yearScale = d3.scaleBand()
        .domain(year)
        .range([0, width]);

    var xScale = d3.scaleLinear()
        .domain([0, data.length])
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d; })])
        .range([height, 0]);


    if (!update) {
        // Initialize bar chart for total world population
        var svg = d3.select("#barChart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("id", "barChartPlot");

        var plot = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        plot.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("width", width / data.length - barPadding)
            .attr("height", function (d) { return height - yScale(d); })
            .attr("x", function (d, i) { return xScale(i); })
            .attr("y", function (d) { return yScale(d); })
            .attr("fill", color);


        // Add x axis
        svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + (height + margin.top) + ")")
            .call(d3.axisBottom(yearScale));

        // Add y axis
        svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("class", "yAxis")
            .call(d3.axisLeft(yScale));

        // Add title
        svg.append("text")
            .attr("x", (width + 2 * margin.left + margin.right) / 2)
            .attr("y", 15)
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .text(title);

    } else {
        // Update bar chart for each country's population
        var svg = d3.select("#barChart");

        var plot = svg.datum(data);

        plot.selectAll("rect")
            .data(data)
            .transition()
            .duration(750)
            .attr("width", width / data.length - barPadding)
            .attr("height", function (d) { return height - yScale(d); })
            .attr("x", function (d, i) { return xScale(i); })
            .attr("y", function (d) { return yScale(d); })
            .attr("fill", color);

        // Update y axis
        svg.selectAll("g.yAxis").call(d3.axisLeft(yScale));

        // Update title
        svg.selectAll("text.title").text(title);
    }

    // Add tooltip
    plot.selectAll("rect")
    .on("mouseover", function(d, i) {
        var annotation = "Population: " + d;

        var coord = d3.mouse(document.getElementById("barChart"));
        var x = coord[0], 
            y = coord[1];

        var tooltip = d3.select("#barTooltip")
        tooltip.style("opacity", 1)
            .style("opacity", 1)
            .style("background", "white")
            .style("left", x + 10 + "px")
            .style("top", y + 10 + "px")
            .html(annotation);
    })
    .on("mouseout", function(d, i) {
        d3.select("#barTooltip").style("opacity", 0);
    })
}

function displayBarChart(totalData) {

    var totalPopulationData = getYearPopulation(totalData[0], "0 ");

    var title = "Total Population Growth in Decades";

    drawBarChartHelper(totalPopulationData, "grey", title, false);
}


/**
 * Update bar chart based on selected country
 * @param {*} country 
 * @param {*} colorChosen 
 */
function updateBarChart(dataRow, colorChosen, country) {

    var countryPopulationData = getYearPopulation(dataRow, "0 ");

    var title = `${country}'s Population Growth in Decades`;

    drawBarChartHelper(countryPopulationData, colorChosen, title, true);
}



function drawLineChartHelper(data, color, update) {
    var margin = { top: 30, right: 10, bottom: 0, left: 50 },
    width = 600 - margin.left - margin.right,
    height = 150 - margin.top - margin.bottom;

    var xScale = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([margin.left, width]);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d; })])
        .range([height, 0]);

    var line = d3.line()
        .x(function (d, i) { return xScale(i); })
        .y(function (d) { return yScale(d); });

    if (!update) {
        var svg = d3.select("#lineChart")
            .append("svg")
            .datum(data)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)

        var plot = svg
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("id", "lineChartPlot");

        plot.append("text")
            .text(data[data.length - 1])
            .attr("id", "lineChartTitle")
            // .attr("x", width / 2)
            .attr("x", (width + 2 * margin.left + margin.right) / 2)
            .attr("y", height / 2);

        plot.append("path")
            .attr("class", "line")
            .attr("d", line)
            .attr("stroke", "lightgrey");

        plot.selectAll("dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("fill", function (d) { return color })
            .attr("cx", line.x())
            .attr("cy", line.y())
            .attr("r", 3.5)
            .attr("stroke", "lightgrey")
            .append("title")
            .text(function (d) { return d; });

    } else {
        var svg = d3.select("#lineChartPlot");

        var plot = svg.datum(data);

        plot.select("text").text(data[data.length - 1]);

        plot.select("path")
            .transition()
            .duration(750)
            .attr("class", "line")
            .attr("d", line)
            .attr("stroke", "lightgrey");

        var path = plot
            .selectAll(".dot")
            .data(data)
            .transition()
            .duration(750)
            .attr("class", "dot")
            .attr("fill", function (d) { return color })
            .attr("cx", line.x())
            .attr("cy", line.y())
            .attr("r", 3.5)
            .attr("stroke", "lightgrey");

        path.selectAll("texttitle").text(function (d) { return d; });
    }
}


function displayLineChart(totalData) {
    var populationData = getYearPopulation(totalData[0], '');

    drawLineChartHelper(populationData, "grey", false);
}


function updateLineChart(dataRow, colorChosen) {

    var countryPopulationData = getYearPopulation(dataRow, '');

    drawLineChartHelper(countryPopulationData, colorChosen, true);
}


function getNarrationInfo(data, country) {
    var narrationDiv = document.getElementById("narration");
    showDiv(narrationDiv);

    var rank = data["Rank"]
    var capital = data["Capital"]
    var continent = data["Continent"]
    var area = data["Area (km²)"]
    var density = data["Density (per km²)"]
    var growthRate = data["Growth Rate"]
    var percentage = data["World Population Percentage"]

    var title = `${country}'s World Population Rank: ${rank}`;
    var titleClass = document.getElementsByClassName("narrationTitle");
    titleClass[0].innerHTML += title; 


    var text = `${country} is in ${continent} and the capital is ${capital}. <br>
                ${country} has ${percentage}% of the world population.
                The country's total area is ${area}km², with the population density of ${density} per km². <br>
                The latest population growth rate is ${growthRate}%.`;

    var textClass = document.getElementsByClassName("narrationText");
    textClass[0].innerHTML += text; 
}