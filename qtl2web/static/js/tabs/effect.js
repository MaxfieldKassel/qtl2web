/**
 * Exports effect data to a CSV file.
 * @param {string} id - The identifier for the dataset.
 * @param {Array} effectData - Array containing effect data points.
 * @param {Array} lodData - Array of LOD (Log of Odds) data points corresponding to the effects.
 * @param {string} covar - The covariate used in the analysis.
 * @param {string|null} category - Optional category for further segregation of the data.
 */
function exportEffectData(id, effectData, lodData, covar, category) {
    let csvContent = `"id","chromosome","position"`;
    plotEffectStrains.forEach(s => {
        csvContent += `,"${s.name}"`;
    });
    csvContent += `,"lod"\n`;

    // Iterate over effectData to format each row of the CSV
    $.each(effectData, function (k, v) {
        let line = `"${v[0]}","${v[1]}",${v[2]},${v[3]},${v[4]},${v[5]},${v[6]},${v[7]},${v[8]},${v[9]},${v[10]},`;
        line += lodData[k].y;  // Append LOD data to the line
        csvContent += `${line}\n`;  // Add the completed line to CSV content
    });

    // Check if a category is specified and adjust the filename accordingly
    if (category !== null) {
        downloadCSV(csvContent, `${id}_EFFECT_${covar}_${category}.csv`, 'text/csv;encoding:utf-8');
    } else {
        downloadCSV(csvContent, `${id}_EFFECT.csv`, 'text/csv;encoding:utf-8');
    }
}

/**
 * Plot the effect data based on genetic covariates and chromosome.
 * @param {Object} effectData - An object containing the effect data for various categories or covariates.
 * @param {Object} lodData - An object containing the LOD (Log of Odds) scores corresponding to the effect data.
 * @param {string} chromosome - The chromosome for which the data is being plotted.
 * @param {string} covar - The covariate based on which the data is differentiated, such as 'additive'.
 */
function plotEffectData(effectData, lodData, chromosome, covar) {
    logDebug('plotEffectData()', effectData, lodData, covar);

    if (covar === 'additive') {
        // Plot data for an additive covariate without separating by categories
        plotEffectChart(effectData[covar], null, covar, null, chromosome);
    } else {
        // Iterate through the effectData object to plot each category separately
        $.each(effectData, function (key, value) {
            // key represents the category value, e.g., for sex it would be 'M' or 'F'
            // Plot each category with its corresponding LOD data
            plotEffectChart(value, lodData[key], covar, key, chromosome);
        });
    }
}

/**
 * Plots the effect data and lod data on a chart based on the given parameters.
 * 
 * @param {Object} effectData - The effect data for the chart.
 * @param {Object} lodData - The LOD (log of odds) data for the chart.
 * @param {string} covar - Covariate type, determines the rendering target.
 * @param {string} category - Category to plot if covariate is used.
 * @param {string} chromosome - Chromosome number to filter data on.
 */
function plotEffectChart(effectData, lodData, covar, category, chromosome) {
    logDebug('plotEffectChart() ', effectData, lodData, covar, category);

    let strainInfo = {};
    plotEffectStrains.forEach(s => {
        strainInfo[s.key] = {
            color: s.color,
            name: s.name,
            data: []  // Initialize data as an empty array
        };
    });


    let renderTo = '';
    let isCovar = false;

    if (covar === 'additive') {
        renderTo = 'plotEffect';
        // get the data from the lod chart, but filter for just the chromosome
        lodData = global.LODChartData[covar];
    } else {
        isCovar = true;
        renderTo = 'plotEffect_' + category;
    }

    $('#allEffectPlots').append(`<div class="row"><div class="col">
                                        <div id="${renderTo}"></div>
                                    </div></div>`);

    logDebug('covar=', covar);
    logDebug('isCovar=', isCovar);
    logDebug('renderTo=', renderTo);

    let allEffectValues = [];

    $.each(effectData, function (index, element) {
        let position = element[2];

        // Iterate through each strain
        plotEffectStrains.forEach((s, i) => {
            let val = element[i + 3];

            if (!isNaN(+val)) {
                // Ensure strainInfo is initialized for the strain
                if (!strainInfo[s.key]) {
                    strainInfo[s.key] = { data: [] };
                }

                // Push the position and value into the strain's data array
                strainInfo[s.key].data.push([position, val]);

                // Push the value into allEffectValues
                allEffectValues.push(val);
            }
        });
    });

    let effectMinValue = Math.floor(Math.min.apply(null, allEffectValues));
    let effectMaxValue = Math.ceil(Math.max.apply(null, allEffectValues));

    logDebug('effectMinValue=', effectMinValue);
    logDebug('effectMaxValue=', effectMaxValue);

    /*
    if ((effectMaxValue > 30.0) || (effectMinValue < -30.0)) {
        displayError('Effect Plot Error', 'Effect values appear to be invalid, ' + effectMinValue + ' to ' + effectMaxValue);
        return;
    }
    */

    logDebug('strainInfo=', strainInfo);

    let xAxisTickNum = Math.floor(global.currentDataset.chromosomes.chr[chromosome].length / 20000000);
    let xAxisTickVals = [];
    let xAxisTickText = [];
    let series = [];

    for (let i = 1; i <= xAxisTickNum; i++) {
        xAxisTickVals.push(20000000 * i);
        xAxisTickVals.push((20 * i) + 'Mb');
    }

    $.each(strainInfo, function (key, value) {
        let s = {
            animation: 0,
            color: value.color,
            data: value.data,
            lineWidth: 1,
            marker: {
                symbol: 'circle',
            },
            name: value.name,
            showInLegend: true,
            stack: 0,
            tooltip: {
                shared: false,
                headerFormat: '<b>{series.name}</b>',
                pointFormatter: function () {
                    return `<br>Effect: ${this.y}<br>Position: ${this.x.toLocaleString()}`;
                }
            },
            turboThreshold: 0,
            type: 'line',
            yAxis: 'axisEffect',
        };
        series.push(s);
    });

    let plotTitle = '';
    let currentID = '';

    if (global.currentDataset.datatype === 'mrna') {
        plotTitle = `${global.geneID} (${global.gene.gene[global.geneID].symbol})`;
        currentID = global.geneID;
    } else if (global.currentDataset.datatype === 'protein') {
        plotTitle = `${global.proteinID} (${global.gene.gene[global.geneID].symbol})`;
        currentID = global.proteinID;
    } else if (global.currentDataset.datatype === 'phos') {
        plotTitle = global.phosID;
        currentID = global.phosID;
    } else if (global.currentDataset.datatype === 'pheno') {
        plotTitle = global.phenotypeID;
        currentID = global.phenotypeID;
    } else {
        // TODO: handle error
        logError('MAJOR PROBLEM');
    }

    let newLodData = [];
    let lodMinValue = Infinity;
    let lodMaxValue = -Infinity;

    $.each(lodData, function (index, element) {
        //
        // element = {"[id]","[chr]",[position],[data]}
        //
        if ((element[1] in global.currentDataset.chromosomes.chr) && (element[1] === chromosome)) {

            let chr = global.currentDataset.chromosomes.chr[element[1]];
            let x = element[2];
            let y = element[3];

            let d = {
                x: x,
                y: y,
                id: element[0],
                text: element[3],
                chr: chr.chromosome,
                chrPos: element[2],
                covar: covar
            };
            newLodData.push(d);
            lodMinValue = Math.min(element.y, lodMinValue);
            lodMaxValue = Math.max(element.y, lodMaxValue);
        }
    });

    series.push({
        animation: false,
        color: '#000000',
        data: newLodData,
        lineWidth: 1,
        name: 'LOD',
        showInLegend: false,
        stack: 0,
        tooltip: {
            shared: false,
            headerFormat: '',
            pointFormatter: function () {
                return `<br>LOD: ${this.y}<br>Position: ${this.x.toLocaleString()}`;
            }
        },
        turboThreshold: 1000000, // TODO: what should this value be
        yAxis: 'axisLOD',
    });

    let lodTickVals = null;
    // round up to nearest 10, 11->20, 7->10, 88->90
    let lodMaxTick = Math.ceil(lodMaxValue / 10) * 10;

    // determine ticks if > 10, otherwise let the chart do it
    if (lodMaxValue > 10) {
        let lodMaxTick = lodMaxValue + 1;
        let maxNumTicks = Math.min(4, Math.ceil(lodMaxTick / 10) * 10);
        lodTickVals = [];

        let step = Math.ceil((lodMaxValue / maxNumTicks) / 10) * 10;
        for (let i = 0; i < lodMaxValue; i += step) {
            lodTickVals.push(i);
        }
        lodTickVals.push(lodMaxTick);
    }

    let exporting = appendExportButton('Download CSV', function () {
        exportEffectData(currentID, effectData, newLodData, covar, category);
    });

    exporting.filename = currentID + '_EFFECT';

    if (isCovar) {
        exporting.filename = currentID + '_EFFECT_' + category;
        plotTitle += (' (' + category + ')');
    }

    Highcharts.chart({
        boost: {
            useGPUTranslations: true
        },
        chart: {
            renderTo: renderTo,
            zoomType: 'x'
        },
        exporting: exporting,
        legend: {
            align: 'right',
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            floating: false,
            layout: 'vertical',
            verticalAlign: 'top',
            y: 100,
        },
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 400
                },
                chartOptions: {
                    legend: {
                        align: 'center',
                        layout: 'horizontal',
                        verticalAlign: 'top',
                        y: 0,
                    },
                }
            }]
        },
        series: series,
        subtitle: {
            text: 'Chromosome ' + chromosome,
            verticalAlign: 'bottom',
        },
        title: {
            text: plotTitle,
        },
        tooltip: {
            outside: true,
        },
        xAxis: {
            crosshair: true,
            gridLineWidth: 1,
            lineWidth: 0.5,
        },
        yAxis: [{
            height: '70%',
            id: 'axisEffect',
            labels: {
                formatter: function () {
                    if (this.isFirst) {
                        return '';
                    }
                    return this.value;
                }
            },
            maxPadding: 0,
            offset: 0,
            title: {
                text: 'EFFECT'
            },
        }, {
            height: '30%',
            id: 'axisLOD',
            labels: {
                formatter: function () {
                    if (this.isLast) {
                        return '';
                    }
                    return this.value;
                }
            },
            maxPadding: 0,
            offset: 0,
            plotLines: [{
                value: lodMaxTick,
                color: 'black',
                zIndex: 5,
                width: 2
            }],
            tickPositions: lodTickVals,
            title: {
                text: 'LOD'
            },
            top: '70%',
        }],
    });
}


/**
 * Initiates the process to download and plot effect data based on given parameters.
 *
 * @param {string} id - The identifier for the dataset.
 * @param {string} chromosome - The chromosome of interest.
 * @param {string} covar - The covariate to use, which determines the URLs and data to fetch.
 */
function generateEffectPlot(id, chromosome, covar) {
    // Construct URL for fetching effect coefficients
    let effectURL = `${rBaseURL}/foundercoefs?dataset=${global.datasetID}&id=${id}&chrom=${chromosome}&intcovar=${covar}`;
    effectURL += '&blup=' + $('#performBLUP').is(':checked'); // Append BLUP status to the URL

    // Conditional addition of cores to URLs if specified
    if (rNumCores) {
        effectURL += `&cores=${rNumCores}`;
    }

    // Prepare data payload for AJAX request
    let submitData = {
        urls: [{
            url_id: 'effect',
            url: effectURL
        }]
    };

    // Add LOD scan samples URL if covariate is not 'additive'
    if (covar !== 'additive') {
        let lodURL = `${rBaseURL}/lodscansamples?dataset=${global.datasetID}&id=${id}&chrom=${chromosome}&intcovar=${covar}`;
        lodURL += `&cores=${rNumCores}`;
        submitData.urls.push({
            url_id: 'lodSamples',
            url: lodURL
        });
    }

    // Initiate task and clear any previous plots
    startTask();
    $('#allEffectPlots').html('');

    // AJAX POST request to submit URLs for processing
    $.ajax({
        type: 'POST',
        url: submitURL,
        contentType: 'application/json',
        data: JSON.stringify(submitData),
        retries: 3,
        retryInterval: 1000,
        success: function (data, status, request) {
            updateEffectData(data.group_id, id, chromosome, covar);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showErrorMessage(`Error occurred: ${errorThrown}`, textStatus);
        }
    });
}

/**
 * Updates the status of the downloading effect data for a given task.
 *
 * @param {string} groupID - The group identifier of the task.
 * @param {string} id - The task identifier.
 * @param {string} chromosome - The chromosome related to the task.
 * @param {string} covar - The covariate for the effect calculation.
 */
function updateEffectData(groupID, id, chromosome, covar) {
    logDebug('updateEffectData() ', groupID);

    // Check if a task is currently running
    if (global.runningTask) {
        const statusURL = `${statusBaseURL}${groupID}`;
        $.ajax({
            type: 'GET',
            url: statusURL,
            retries: 3,
            retryInterval: 1000,
            success: function (data, status, request) {
                logDebug('DATA=======', data);
                // Delegate the response handling to handleTaskResponse
                handleTaskResponse(data, function (data) {
                    checkResponseStatus(data, function (data) {
                        // Plot data based on covariate
                        plotEffectData(data.response_data.effect.response.result,
                            covar === 'additive' ? null : data.response_data.lodSamples.response.result,
                            chromosome, covar);
                        stopTask();
                    });
                }, function () {
                    setTimeout(function () {
                        updateEffectData(groupID, id, chromosome, covar);
                    }, 1000);
                });
            }
        });
    } else {
        // Handle task cancellation if no task is running
        cancelEffectTask(groupID);
    }
}

/**
 * Cancels the running task and clears related UI elements.
 *
 * @param {string} groupID - The group identifier of the task to cancel.
 */
function cancelEffectTask(groupID) {
    logDebug('canceling');
    const cancelURL = `${cancelBaseURL}${groupID}`;
    $.getJSON(cancelURL, function (data) {
        logDebug(data);
        $('#allEffectPlots').html('');
    });
}