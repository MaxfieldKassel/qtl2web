
function exportEffectData(id, effectData, lodData, covar, category) {
    let csvContent = `"id","chromosome","position"`;
    plotEffectStrains.forEach(s => {
        csvContent += `,"${s.name}"`;
    });

    csvContent += `,"lod"\n`;

    $.each(effectData, function(k, v) {
        let line = `"${v[0]}","${v[1]}",${v[2]},${v[3]},${v[4]},${v[5]},${v[6]},${v[7]},${v[8]},${v[9]},${v[10]},`;
        line += lodData[k].y;
        csvContent += `${line}\n`;
    });

    if (category !== null) {
        downloadCSV(csvContent, `${id}_EFFECT_${covar}_${category}.csv`, 'text/csv;encoding:utf-8');
    } else {
        downloadCSV(csvContent, `${id}_EFFECT.csv`, 'text/csv;encoding:utf-8');
    }
}

/**
 * Plot the effect data.
 * @param {Object} effectData - the effect data
 */
function plotEffectData(effectData, lodData, chromosome, covar) {
    logDebug('plotEffectData() ', effectData, lodData, covar);

    if (covar === 'additive') {
        plotEffectChart(effectData[covar], null, covar, null, chromosome);
    } else {
        $.each(effectData, function(key, value) {
            // key = category value, i.e for sex would be M,F
            plotEffectChart(value, lodData[key], covar, key, chromosome);
        });
    }
}

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
    let val = null;

    $.each(effectData, function(index, element) {
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

    $.each(strainInfo, function(key, value) {
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
                headerFormat:'<b>{series.name}</b>',
                pointFormatter: function() {
                    return `<br>Effect: ${this.y}<br>Position: ${this.x.toLocaleString()}`;
                }
            },
            turboThreshold: 0,
            type: 'line',
            yAxis:'axisEffect',
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

    $.each(lodData, function(index, element) {
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
            pointFormatter: function() {
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

        let step = Math.ceil((lodMaxValue/maxNumTicks) / 10) * 10;
        for (let i = 0; i < lodMaxValue; i += step) {
            lodTickVals.push(i);
        }
        lodTickVals.push(lodMaxTick);
    }

    let exporting = appendExportButton('Download CSV', function() {
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
                formatter: function() {
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
                formatter: function() {
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
         * Start downloading effect data.
         *
         */
  function generateEffectPlot(id, chromosome, covar) {
    let effectURL = `${rBaseURL}/foundercoefs?dataset=${global.datasetID}&id=${id}&chrom=${chromosome}&intcovar=${covar}`;
    effectURL += '&blup=' + $('#performBLUP').is(':checked');

    let lodURL = `${rBaseURL}/lodscansamples?dataset=${global.datasetID}&id=${id}&chrom=${chromosome}&intcovar=${covar}`;

    if (rNumCores) {
        effectURL += `&cores=${rNumCores}`;
        lodURL += `&cores=${rNumCores}`;
    }

    let submitData = {
        urls:[{
            url_id: 'effect',
            url: effectURL,
        }]};

    if (covar !== 'additive') {
        submitData.urls.push({
            url_id: 'lodSamples',
            url: lodURL
        });
    }

    startTask();

    // reset the chart and clear it
    $('#allEffectPlots').html('');

    $.ajax({
        type: 'POST',
        url: submitURL,
        contentType: 'application/json',
        data: JSON.stringify(submitData),
        retries: 3,
        retryInterval: 1000,
        success: function(data, status, request) {
            updateEffectData(data.group_id, id, chromosome, covar);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            showErrorMessage(errorThrown, textStatus);
        }
    });
}

/**
 * Update the status of the downloading effect data.
 *
 * @param {string} groupID - the group identifier of the task
 */
function updateEffectData(groupID, id, chromosome, covar) {
    // send GET request to status URL
    logDebug('updateEffectData() ', groupID);

    if (global.runningTask) {
        let statusURL = statusBaseURL + groupID;
        $.ajax({
            type: 'GET',
            url: statusURL,
            retries: 3,
            retryInterval: 1000,
            success: function (data, status, request) {
                logDebug('DATA=======', data);
                if (data.status === 'DONE') {
                    if ('error' in data) {
                        // MAJOR ERROR
                        let message = `Unfortunately, there was a problem contacting the server.  Please try again.`;
                        stopTask();
                        showErrorMessage(message, null);
                    } else if (data.number_tasks_errors !== 0) {
                        let message = `Unfortunately, we encountered an error.  Please try again.`;
                        let errorMessages = '';
                        $.each(data.response_data, function (key, value) {
                            if ('error' in value) {
                                errorMessages += (`<strong>${key}:</strong> ${value.error}<br>`);
                            }
                        });

                        stopTask();
                        showErrorMessage(message, errorMessages);
                    } else if (data.number_tasks_errors === 0) {
                        // check to make sure the status codes are good
                        let errorMessages = '';
                        $.each(data.response_data, function (key, value) {
                            if (value.status_code !== 200) {
                                errorMessages += (`<strong>${key}:</strong> ${value.response.error}<br>`);
                            }
                        });

                        if (errorMessages !== '') {
                            let message = `Unfortunately, there was a problem calculating the Effect Plot.`;
                            stopTask();
                            showErrorMessage(message, errorMessages);
                        } else {
                            // show result, there will be 1 datasets to get
                            if (covar === 'additive') {
                                plotEffectData(data.response_data.effect.response.result, null, chromosome, covar);
                            } else {
                                plotEffectData(data.response_data.effect.response.result,
                                               data.response_data.lodSamples.response.result,
                                               chromosome, covar);
                            }
                            stopTask();
                        }
                    }
                } else {
                    // rerun in 1 seconds
                    logDebug('Not done, keep checking...');
                    setTimeout(function () {
                        updateEffectData(groupID, id, chromosome, covar);
                    }, 1000);
                }
            }
        });
    } else {
        // TODO: cleanup
        logDebug('canceling');
        let cancelURL = `${cancelBaseURL}${groupID}`;
        $.getJSON(cancelURL, function (data) {
            logDebug(data);
            $('#allEffectPlots').html('');
        });
    }
}

