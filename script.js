// Read in the data
async function loadData() {
    const congressData = await d3.json('Data/congress.json')
    const mapData = await d3.json('Data/us_map.json')
    return {congressData, mapData}
}

const globalApplicationState = {
    metric : "age_years",
    chamber : "both",
    congress : "all",
    mapData : null,
    congressData : null,
    mainVis : null,
    mapVis : null,
    firstMembergridLoad : true,
    changingMembergridColor : false,
    selectedStates : [],
    colorDict : {},
    count : 0
}

loadData().then((loadedData) => {
    globalApplicationState.mapData = loadedData.mapData;
    globalApplicationState.congressData = loadedData.congressData;
    globalApplicationState.mainVis = new MainVis(globalApplicationState);
    globalApplicationState.mapVis = new MapVis(globalApplicationState);

    //Adding events that fire when a new option is selected for the lists
    d3.select("#metric").on("change", async function() {
        globalApplicationState.metric = d3.select('#metric').property('value');
        globalApplicationState.mainVis.renderVisualization();
        globalApplicationState.mapVis.renderVisualization();
    });

    d3.select("#chamber").on("change", async function() {
        globalApplicationState.selectedStates = [];
        globalApplicationState.colorDict = {};
        globalApplicationState.count = 0;
        globalApplicationState.chamber = d3.select('#chamber').property('value');
        globalApplicationState.mainVis.renderVisualization();
        globalApplicationState.mapVis.renderVisualization();
    });

    d3.select("#congress").on("change", async function() {
        globalApplicationState.selectedStates = [];
        globalApplicationState.colorDict = {};
        globalApplicationState.count = 0;
        globalApplicationState.congress = d3.select('#congress').property('value');
        globalApplicationState.mainVis.renderVisualization();
        globalApplicationState.mapVis.renderVisualization();
    });

    d3.select("#violin").on("change", async function() {
        globalApplicationState.mainVis.renderVisualization();
    });

    d3.select('#clear-button')
        .on('click', function() {
            d3.select("#congress").property("value", "all");
            d3.select("#chamber").property("value", "both");
            globalApplicationState.selectedStates = [];
            globalApplicationState.colorDict = {};
            globalApplicationState.count = 0;
            globalApplicationState.mapVis.renderVisualization();
            globalApplicationState.mainVis.renderVisualization();
            }
        )
})