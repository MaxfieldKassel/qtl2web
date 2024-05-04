/**
 * Displays correlation data in a formatted table and enables interaction.
 * Depending on the type of data (mrna, protein, phos, pheno), the table headers
 * and values are dynamically adjusted. Clicking on any row generates a new
 * correlation plot based on the selected correlation data.
 *
 * @param {Object} correlationData - The data containing correlations, including
 * identifiers, values, and symbols.
 */
function displayCorrelation(correlationData) {
    // Clear the previous correlation data table content
    $('#correlationDataTable').empty();

    logDebug('displayCorrelation()');
    logDebug('correlationData=', correlationData);
    global.correlationData = correlationData;  // Store the correlation data globally for further use
    logDebug('global.currentCorrelationDataset.datatype=', global.currentCorrelationDataset.datatype);

    // Start building the HTML string for the correlation data table
    let htmlBody = '<table id="corTable" class="table table-striped table-bordered table-sm">';
    const dataType = global.currentCorrelationDataset.datatype;
    htmlBody += '<thead><th>Value</th>';
    // Conditionally add table headers based on data type
    htmlBody += (dataType === 'pheno') ? '<th>ID</th>' : '<th>Symbol</th><th>ID</th>';
    htmlBody += '</thead>';

    // Iterate through each correlation data entry and build table rows
    $.each(correlationData.correlations, function (idx, value) {
        if (idx < 1000) {  // Limit the display to 1000 entries for performance
            const displayValue = formatStrToNum(value.cor, 4);  // Format the correlation number
            htmlBody += `<tr><td data-order="${Math.abs(displayValue)}">${displayValue}</td>`;

            if (dataType !== 'pheno') {
                htmlBody += `<td>${value.symbol}</td>`;  // Add gene/protein symbol if applicable
            }

            let displayId = value.id;
            if (dataType === 'phos') {
                displayId = value.id.split('_')[1];  // Special handling for phosphosite IDs
            }
            // Create a clickable link for each entry
            htmlBody += `<td><a href="#" dSymbol="${value.symbol || ''}" dID="${value.id}">${displayId}</a></td></tr>`;
        }
    });

    htmlBody += '</table>';
    // Update the correlation data table with the new HTML content
    $('#correlationDataTable').html(htmlBody);

    // Initialize DataTable with specific configuration for better presentation
    $('#corTable').DataTable({
        info: false,  // Disable the information text
        language: { search: "Filter" },  // Set the search text
        scrollY: "200px",  // Enable vertical scrolling
        scrollCollapse: true,
        order: [[0, "desc"]],  // Default sorting order
        paging: false,  // Disable pagination
        columnDefs: [{ targets: 0, className: "dt-body-right" }]  // Align the first column to the right
    });

    // Attach a click event handler to links within the table
    $('#corTable a').click(function (evt) {
        evt.preventDefault();  // Prevent the default anchor behavior
        let that = $(this);
        const datatypeIDMap = {
            'mrna': global.geneID,
            'protein': global.proteinID,
            'phos': global.phosID,
            'pheno': global.phenotypeID
        };
        
        const cid = datatypeIDMap[global.currentDataset.datatype]; 
        global.currentCorrelateID = that.attr('dID');  // Store the clicked ID globally

        // Get the selected interactive covariate, if any
        let interactiveCovariate = $('#interactiveCovarCorrelation').find(':selected').val() || null;
        // Trigger the generation of a correlation plot
        generateCorrelationPlot(global.datasetID, cid, $('#correlationDatasetSelect').val(), that.attr('dID'), that.attr('dSymbol'), interactiveCovariate);
        return false;
    });
}

/**
 * Exports the correlation plot data to a CSV file.
 * Constructs a CSV string with headers and data rows based on input,
 * then triggers a download of the CSV file.
 *
 * @param {string} id - The identifier for the primary data point.
 * @param {string} idCorrelate - The identifier for the correlated data point.
 * @param {Array} data - Array of objects containing the data to be exported.
 */
function exportCorrelationPlotData(id, idCorrelate, data) {
    let csvContent = `"sample_id","${id}","${idCorrelate}"\n`;

    $.each(data, function (k, v) {
        csvContent += `"${v['sample_id']}",${v.x},${v.y}\n`;
    });

    const fileName = `${id}_${idCorrelate}_CORRELATION.csv`;
    downloadCSV(csvContent, fileName, 'text/csv;encoding:utf-8');
}

/**
 * Generates and displays a correlation chart based on global data. This function configures the chart
 * based on the dataset type (e.g., mRNA, protein) and handles the rendering and user interactions within the chart.
 */
function plotCorrelationChart() {
    let data = global.correlationChartData;
    logDebug('plotCorrelationChart, data=', data);

    // Retrieve the selected category for the series from the UI
    let categorySeries = $('#divFactorSeriesCorrelation').find(':selected').val();
    logDebug('categorySeries=', categorySeries);

    // Determine the plot title and axes based on the dataset type
    let plotTitle = '';
    let xAxis = '';
    let yAxis = global.currentCorrelateID;
    let currentID = '';

    switch (global.currentDataset.datatype) {
        case 'mrna':
            plotTitle = xAxis = currentID = global.geneID;
            break;
        case 'protein':
            plotTitle = xAxis = currentID = global.proteinID;
            break;
        case 'phos':
            plotTitle = xAxis = currentID = global.phosID;
            break;
        case 'pheno':
            plotTitle = xAxis = currentID = global.phenotypeID;
            if (global.phenotypeID !== global.currentDataset.phenotypes[global.phenotypeID]['short_name']) {
                plotTitle += ` (${global.currentDataset.phenotypes[global.phenotypeID]['short_name']})`;
            }
            break;
    }

    // Prepare series data and color mapping
    let seriesData = new Set(Array.isArray(data.datatypes[categorySeries]) ? data.datatypes[categorySeries] : [data.datatypes[categorySeries]]);
    let minValue = Infinity, maxValue = -Infinity;
    let cfMap = {};

    // Map display names to sample columns
    $.each(global.currentDataset['covar_info'], (idx, elem) => cfMap[elem['sample_column']] = elem['display_name']);

    // Process data points and calculate the min and max values
    let newData = data.data.map(element => {
        if (element.x !== undefined && element.y !== undefined) {
            minValue = Math.min(minValue, element.x, element.y);
            maxValue = Math.max(maxValue, element.x, element.y);
            return { ...element, map: cfMap, seriesValue: element[categorySeries] };
        }
    }).filter(element => element);

    // Adjust min and max values for the chart scale
    minValue = Math.floor(minValue);
    maxValue = Math.ceil(maxValue);

    // Calculate axis ticks for consistency
    let axisTicks = calculateTicks(minValue, maxValue, 5);
    let axisLines = axisTicks.map(v => ({ axisLOD: v }));

    // Define colors and setup for mapping in the chart
    let colors = ['#7cb5ec', '#ed3215', '#8085e9', '#f7a35c', '#90ed7d', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'];
    let correlationColorDomain = Array.from(seriesData);
    let correlationColorRange = colors.slice(0, seriesData.size);

    // Prepare the chart specification for rendering
    let trackCorrelation = {
        name: "correlation",
        layer: [
            {
                title: "Xbound",
                data: { values: axisLines },
                mark: { type: "rule", tooltip: { handler: "nullHandler" } },
                encoding: { y: { field: "axisLOD", type: "quantitative" }, color: { value: "#e5e5e5" } }
            },
            {
                title: "Ybound",
                data: { values: axisLines },
                mark: { type: "rule", tooltip: { handler: "nullHandler" } },
                encoding: { x: { field: "axisLOD", type: "quantitative" }, color: { value: "#e5e5e5" } }
            },
            {
                data: { values: newData },
                transform: [{ type: "formula", expr: "datum.imputed ? 'diamond' : 'point'", as: "myShape" }],
                title: "Correlation",
                mark: { type: "point", tooltip: { handler: "correlationTooltipHandler" }, geometricZoomBound: 4, inwardStroke: true, stroke: "#333333", strokeWidth: 0.7, fillOpacity: 0.6, strokeOpacity: 0.8 },
                encoding: {
                    shape: { field: "myShape", type: "nominal" },
                    x: { title: xAxis, field: "x", type: "quantitative", scale: { zoom: true, domain: [minValue, maxValue] }, axis: { values: axisTicks } },
                    y: { title: yAxis, field: "y", type: "quantitative", scale: { zoom: true, domain: [minValue, maxValue] }, axis: { values: axisTicks } },
                    color: { type: "nominal", field: "seriesValue", scale: { domain: correlationColorDomain, range: correlationColorRange } },
                    size: { value: 150 },
                    opacity: { value: 1 }
                }
            }
        ]
    };

    let spec = { vconcat: [trackCorrelation] };

    // Debug logging
    logDebug('SPEC=', spec);

    // Initialize plot area and append menu for downloads
    $("#plotCorrelation").html(`<div class="row"><div class="col" id="plotCorrelationMenu"></div></div><div class="row"><div class="col" id="plotCorrelationChart" style="width: 400px; height: 400px;"></div></div>`);
    $('#plotCorrelationMenu').append(`<div class="col text-center font-weight-bold">${plotTitle}<div class="dropdown dropleft float-right" id="correlationMenuDropdown"><a class="text-secondary" href="#" role="button" id="correlationDropdownMenuLink" data-toggle="dropdown" aria-expanded="false"><i class="fa-solid fa-bars"></i></a><div class="dropdown-menu" aria-labelledby="correlationDropdownMenuLink"><a class="dropdown-item" id="correlationDownloadPNG" style="font-size:11px !important">Download PNG image</a><a class="dropdown-item" id="correlationDownloadCSV" style="font-size:11px !important">Download CSV</a></div></div></div>`);

    // Setup download handlers
    $("#correlationDownloadPNG").click(() => downloadGenomeSpy('#plotCorrelationChart', `${currentID}_CORRELATION.png`, '255,255,255'));
    $("#correlationDownloadCSV").click(() => exportCorrelationPlotData(currentID, global.currentCorrelateID, data.data));

    // Embed the GenomeSpy visualization
    global.chartCorrelation = genomeSpyEmbed.embed(document.querySelector("#plotCorrelationChart"), spec, { tooltipHandlers: { nullHandler, correlationTooltipHandler } }).then(api => {
        api.addEventListener("click", event => {
            if (event.datum) logDebug('correlation clicked on', event.datum);
        });
    });
}


/**
 * Initiates an AJAX GET request to check the status of correlation data processing
 * and handles the response based on the task's progress or completion.
 *
 * @param {string} groupID - The identifier for the task group.
 * @param {string} currentDataset - The identifier for the dataset being analyzed.
 * @param {string} currentID - The identifier of the current data point.
 * @param {string} correlateDataset - The dataset to which the current data is being correlated.
 * @param {string} correlateID - The identifier of the data point being correlated.
 * @param {string} correlateSymbol - Symbol of the data point being correlated.
 */
function updateCorrelationData(groupID, currentDataset, currentID, correlateDataset, correlateID, correlateSymbol) {
    logDebug('updateCorrelationData', currentDataset, currentID, correlateDataset, correlateID, correlateSymbol);

    if (global.runningTask) {
        $.ajax({
            type: 'GET',
            url: statusBaseURL + groupID,
            retries: 3,
            retryInterval: 1000,
            success: function (data) {
                handleTaskResponse(data, () => {
                    checkResponseStatus(data, () => {
                        global.correlationChartData = data.response_data.correlationPlot.response.result;
                        plotCorrelationChart();
                        stopTask();
                    })}, () => {
                        setTimeout(() => updateCorrelationData(groupID, currentDataset, currentID, correlateDataset, correlateID, correlateSymbol), 1000);
                });
            }
        });
    } else {
        cancelCorrelationTask(groupID);
    }
}

/**
 * Cancels the correlation task using an API endpoint.
 *
 * @param {string} groupID - The group ID of the task to be canceled.
 */
function cancelCorrelationTask(groupID) {
    logDebug('Canceling correlation task...');
    $.getJSON(cancelURL + groupID, function (data) {
        logDebug('Task canceled:', data);
        global.chartCorrelation = null;
        $('#correlationDataTable').html('');
        $('#plotCorrelation').html('');
    });
}



/**
 * Generates a correlation plot.
 * 
 * @param {string} currentDataset - The current dataset name.
 * @param {string} currentID - The current dataset ID.
 * @param {string} correlateDataset - The dataset to correlate with.
 * @param {string} correlateID - The ID of the dataset to correlate with.
 * @param {string} correlateSymbol - The symbol to correlate with.
 * @param {string} interactiveCovariate - The interactive covariate.
 */
function generateCorrelationPlot(currentDataset, currentID, correlateDataset, correlateID, correlateSymbol, interactiveCovariate) {
    logDebug('Generating correlation plot:', currentDataset, currentID, correlateDataset, correlateID, correlateSymbol);
    
    let urlCorrelationPlot = `${rBaseURL}/correlationplot?dataset=${currentDataset}&id=${currentID}&dataset_correlate=${correlateDataset}&id_correlate=${correlateID}`;

    if (interactiveCovariate !== undefined && interactiveCovariate !== null && interactiveCovariate !== 'none') {
        urlCorrelationPlot += `&intcovar=${interactiveCovariate}`;
    }

    let submitData = {
        urls: [{
            url_id: 'correlationPlot',
            url: urlCorrelationPlot
        }]
    };

    startTask();

    // Reset the chart and clear it
    $('#plotCorrelation').html('');

    $.ajax({
        type: 'POST',
        url: submitURL,
        contentType: 'application/json',
        data: JSON.stringify(submitData),
        retries: 3,
        retryInterval: 1000,
        success: function (data, status, request) {
            updateCorrelationData(data.group_id, currentDataset, currentID, correlateDataset, correlateID, correlateSymbol);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showErrorMessage(errorThrown, textStatus);
        }
    });
}


/**
 * Generates an HTML tooltip for a given data point in a correlation plot.
 * This tooltip includes dynamic data from the data point and highlights whether
 * the data is imputed.
 * 
 * @param {Object} datum - The data object representing a point in the plot, which contains various properties.
 * @param {Object} mark - Unused in this function, but included for potential future use.
 * @param {Object} props - Unused in this function, but included for potential future use.
 * @returns {String} HTML content for the tooltip, which is dynamically generated based on the data point.
 */
async function correlationTooltipHandler(datum, mark, props) {
    // Array to hold HTML snippets for each key-value pair in the datum.map
    const itemTemplates = [];

    // Iterate over each key-value pair in the datum.map object
    $.each(datum.map, function(k, v) {
        // Append a strong tag for the key and include the value; use line break for spacing
        itemTemplates.push(genomeSpyEmbed.html`
            <strong>${v}</strong> ${datum[k]}<br/>
        `);
    });

    // Check if the datum has an 'imputed' property set to true
    if (datum.imputed) {
        // If imputed, append a styled italic tag indicating the data is imputed
        itemTemplates.push(genomeSpyEmbed.html`
            <i>Imputed</i>
        `);
    }

    // Construct the final HTML using a div for title and p for the summary, including all items from itemTemplates
    return genomeSpyEmbed.html`
        <div class="title">
            <strong>${datum.sample_id}</strong>
        </div>
        <p class="summary">
            ${itemTemplates.join('')} 
        </p>
    `;
}