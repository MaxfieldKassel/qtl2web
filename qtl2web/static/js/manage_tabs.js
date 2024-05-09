function resetSecondaryPlots() {
    $('#plotMediation').html('');
    $('#allEffectPlots').html('');
    $('#plotSNPAssociation').html('');
    $('#snpWindowMenuShift').html('');
    $('#snpWindowMenu').html('');
}


function updateGeneSelect(groupID, submitData, geneID, proteinID, phosID, datasetID, covar) {
    // send GET request to status URL
    logDebug('update progress, calling .ajax');
    logDebug(groupID);
    logDebug("updateGeneSelect submitData=", submitData);

    if (global.runningTask) {
        let statusURL = `${statusBaseURL}${groupID}`;
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
                            let message = `Unfortunately, there was a problem calculating the LOD SCAN.`;
                            stopTask();
                            showErrorMessage(message, errorMessages);
                        } else {
                            // show result, there will be 3 datasets to get

                            // 1. gene information
                            global.gene = data.response_data.geneData.response;
                            displayGeneData(global.gene.gene);
                            let geneData = null;
                            for (let key in global.gene.gene) {
                                geneData = global.gene.gene[key];
                            }

                            // 2. LOD score information
                            if (covar === 'additive') {
                                global.LODChartData[covar] = data.response_data.lod.response.result;
                                plotLODChart(data.response_data.lod.response.result, covar, null);
                            } else {
                                global.LODChartData.additive = data.response_data.lod.response.result;
                                global.LODChartData[covar] = data.response_data.lodCovar.response.result;

                                plotLODChart(data.response_data.lodCovar.response.result,
                                             covar,
                                             null);

                                plotLODChart(data.response_data.lodCovar.response.result,
                                             covar,
                                             data.response_data.lod.response.result);
                            }

                            $('#interactiveCovarLODS').selectpicker('val', covar);

                            // 3. Expression information
                            global.expressionData = data.response_data.expression.response.result;

                            if (global.currentDataset.datatype === 'mrna') {
                                plotProfile(global.geneID);
                            } else if (global.currentDataset.datatype === 'protein') {
                                plotProfile(global.proteinID);
                            } else if (global.currentDataset.datatype === 'phos') {
                                plotProfile(global.phosID);
                            } else {
                                logDebug('ERROR');
                            }

                            // 4. Correlation
                            displayCorrelation(data.response_data.correlation.response.result);

                            // first time we need to hide jumbotron instructions
                            // it's ok to keep hiding
                            $('#divWelcomeMesage').html('');
                            $('#divLOD').removeClass('invisible');
                            $('#divItemInfo').removeClass('invisible');
                            $('#divSecondRow').removeClass('invisible');
                            $('#divProfileCorrelation').removeClass('invisible');
                            stopTask();
                        }
                    }
                }
                else {
                    // rerun in 1 seconds
                    logDebug('Not done, keep checking...');
                    setTimeout(function () {
                        updateGeneSelect(groupID, submitData, geneID, proteinID, phosID, datasetID, covar);
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
        });
    }
}

/**
 * Perform gene search.
 */
function selectPhenotype(phenotypeID, datasetID, covar) {
    let urlExpression = `${rBaseURL}/expression?dataset=${datasetID}&id=${phenotypeID}`;
    let urlLOD = `${rBaseURL}/lodscan?dataset=${datasetID}&id=${phenotypeID}`;
    let urlLODCovar = `${rBaseURL}/lodscan?dataset=${datasetID}&id=${phenotypeID}`;
    let urlCorrelation = `${rBaseURL}/correlation?dataset=${datasetID}&id=${phenotypeID}`;

    // TODO: make reset function
    global.gene = null;
    global.geneID = null;
    global.proteinID = null;
    global.phosID = null;
    global.phenotypeID = phenotypeID;
    global.correlationData = null;
    global.correlationDatasetID = datasetID;
    global.LODChartData = {};
    global.LODChartData.additive = null;

    // reset the covariate pickers
    configureCovarInfo(false);

    $.each(global.interactiveCovariates, function(idx, value) {
        global.LODChartData[value['column.name']] = null;
    });

    if (covar === 'additive') {
        urlLOD += '&intcovar=additive';
        urlLODCovar = null;
    } else {
        urlLOD += '&intcovar=additive';
        urlLODCovar += ('&intcovar=' + covar);
    }


    // TODO: add ncores?, regress_local? to urlLOD, or handle backend?
    //URL += '&ncores=' + _G.api_cores;
    if (rNumCores) {
        if (urlLODCovar !== null) {
            urlLODCovar += `&cores=${rNumCores}`;
        }
        urlLOD += `&cores=${rNumCores}`;
    }

    let submitData = {
        urls:[{
            url_id: 'expression',
            url: urlExpression
        }, {
            url_id: 'correlation',
            url: urlCorrelation
        }, {
            url_id: 'lod',
            url: urlLOD
        }]
    };

    if (urlLODCovar !== null) {
        submitData.urls.push({
            url_id: 'lodCovar',
            url: urlLODCovar
        });
    }

    logDebug('submitData=', submitData);

    startTask();

    $('#div_current_item_information_header').html('');
    $('#div_current_item_information_body').html('');
    $('#lodPlotChart').html('');
    $('#lodPlotChartCovariateFull').html('');
    $('#lodPlotChartCovariateDiff').html('');

    global.chartCorrelation = null;
    $('#plotCorrelation').html('');
    $('#correlationDataTable').html('');
    $('#correlationImputation').html('');

    // The following line fires a change event which we do not want
    // $('#correlationDatasetSelect').selectpicker('val', global.datasetID);

    // Do this instead
    $('#correlationDatasetSelect').val(global.datasetID);
    $('#correlationDatasetSelect').selectpicker('render');
    $('#fact-svg-chart').html('');

    resetSecondaryPlots();

    $.ajax({
        type: 'POST',
        url: submitURL,
        contentType: 'application/json',
        data: JSON.stringify(submitData),
        retries: 3,
        retryInterval: 1000,
        success: function(data, status, request) {
            global.runningTask = true;
            logDebug('data=', data);
            logDebug('status=', status);
            logDebug('request=', request);
            //let status_url = request.getResponseHeader('Location');
            //logDebug('status_url=', status_url);
            logDebug('data.group_id=', data.group_id);
            updatePhenotypeSelect(data.group_id, datasetID, covar);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            showErrorMessage(errorThrown, textStatus);
        }
    });
}

function updatePhenotypeSelect(groupID, datasetID, covar) {
    // send GET request to status URL
    logDebug('update progress, calling .ajax');
    logDebug(groupID);

    if (global.runningTask) {
        let statusURL = `${statusBaseURL}${groupID}`;
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
                            let message = `Unfortunately, there was a problem calculating the LOD SCAN.`;
                            stopTask();
                            showErrorMessage(message, errorMessages);
                        } else {
                            // show result, there will be 2 datasets to get
                            displayPhenoData(global.phenotypeID);

                            // 1. LOD score information
                            //plotLODChart(data.response_data.lod.response.result);

                            if (covar === 'additive') {
                                global.LODChartData[covar] = data.response_data.lod.response.result;
                                plotLODChart(data.response_data.lod.response.result, covar, null);
                            } else {
                                global.LODChartData.additive = data.response_data.lod.response.result;
                                global.LODChartData[covar] = data.response_data.lodCovar.response.result;

                                plotLODChart(data.response_data.lodCovar.response.result,
                                             covar,
                                             null);

                                plotLODChart(data.response_data.lodCovar.response.result,
                                             covar,
                                             data.response_data.lod.response.result);
                            }

                            $('#interactiveCovarLODS').selectpicker('val', covar);

                            // 2. Correlation
                            displayCorrelation(data.response_data.correlation.response.result);

                            // 3. Expression information
                            global.expressionData = data.response_data.expression.response.result;
                            plotProfile(global.phenotypeID);

                            // first time we need to hide jumbotron instructions
                            // it's ok to keep hiding
                            $('#divWelcomeMesage').html('');
                            $('#divLOD').removeClass('invisible');
                            $('#divItemInfo').removeClass('invisible');
                            $('#divSecondRow').removeClass('invisible');
                            $('#divProfileCorrelation').removeClass('invisible');
                            stopTask();
                        }
                    }
                }
                else {
                    // rerun in 1 seconds
                    logDebug('Not done, keep checking...');
                    setTimeout(function () {
                        updatePhenotypeSelect(groupID, datasetID, covar);
                    }, 1000);  // TODO: change to 1000 (1 second)
                }
            }
        });
    } else {
        // TODO: cleanup
        logDebug('canceling');
        let cancelURL = `${cancelBaseURL}${groupID}`;
        $.getJSON(cancelURL, function (data) {
            logDebug(data);
        });
    }
}

/**
 * Perform gene search.
 */
function selectGeneProtein(geneID, proteinID, phosID, datasetID, covar) {
    logDebug(`selectGeneProtein(${geneID}, ${proteinID}, ${phosID}, ${datasetID}, ${covar})`);

    let urlGeneData = `${window.location.protocol}//${apiURL}/api/gene/${geneID}`;
    urlGeneData += ('?release=' + global.getDataset(datasetID).ensembl_release);
    urlGeneData += ('&species=' + global.getDataset(datasetID).ensembl_species);

    let urlExpression = `${rBaseURL}/expression?dataset=${datasetID}&id=`;
    let urlLOD = `${rBaseURL}/lodscan?dataset=${datasetID}&id=`;
    let urlLODCovar = `${rBaseURL}/lodscan?dataset=${datasetID}&id=`;
    let urlCorrelation = `${rBaseURL}/correlation?dataset=${datasetID}&id=`;

    global.gene = null;
    global.geneID = geneID;
    global.proteinID = proteinID;
    global.phosID = phosID;
    global.phenotypeID = null;
    global.correlationData = null;
    global.correlationDatasetID = datasetID;
    global.LODChartData = {};
    global.LODChartData.additive = null;

    //$('#factorSeriesCorrelation').selectpicker();

    $.each(global.interactiveCovariates, function(idx, value) {
        global.LODChartData[value['column.name']] = null;
    });

    // reset the covariate pickers
    configureCovarInfo(false);

    if (global.currentDataset.datatype === 'mrna') {
        urlExpression += geneID;
        urlLOD += geneID;
        urlLODCovar += geneID;
        urlCorrelation += geneID;
    } else if (global.currentDataset.datatype === 'protein') {
        urlExpression += proteinID;
        urlLOD += proteinID;
        urlLODCovar += proteinID;
        urlCorrelation += proteinID;
    } else if (global.currentDataset.datatype === 'phos') {
        urlExpression += phosID;
        urlLOD += phosID;
        urlLODCovar += phosID;
        urlCorrelation += phosID;
    }

    if (covar === 'additive') {
        urlLOD += '&intcovar=additive';
        urlLODCovar = null;
    } else {
        urlLOD += '&intcovar=additive';
        urlLODCovar += ('&intcovar=' + covar);
    }

    // TODO: add ncores?, regress_local? to urlLOD, or handle backend?
    //URL += '&ncores=' + _G.api_cores;
    if (rNumCores) {
        if (urlLODCovar !== null) {
            urlLODCovar += `&cores=${rNumCores}`;
        }
        urlLOD += `&cores=${rNumCores}`;
    }

    let submitData = {
        urls:[{
            url_id: 'geneData',
            url_description: 'Gene Data',
            url: urlGeneData
        }, {
            url_id: 'expression',
            url_description: 'Expression Data',
            url: urlExpression
        }, {
            url_id: 'correlation',
            url_description: 'Correlation Data',
            url: urlCorrelation
        }, {
            url_id: 'lod',
            url_description: 'LOD Scan Data',
            url: urlLOD
        }]};

    if (urlLODCovar !== null) {
        submitData.urls.push({
            url_id: 'lodCovar',
            url_description: 'Covariate LOD Scan Data',
            url: urlLODCovar
        });
    }

    logDebug('submitData=', submitData);

    startTask();

    $('#div_current_item_information_header').html('');
    $('#div_current_item_information_body').html('');
    $('#lodPlotChart').html('');
    $('#lodPlotChartCovariateFull').html('');
    $('#lodPlotChartCovariateDiff').html('');

    global.chartCorrelation = null;
    $('#plotCorrelation').html('');
    $('#correlationDataTable').html('');
    $('#correlationImputation').html('');

    // The following line fires a change event which we do not want
    // $('#correlationDatasetSelect').selectpicker('val', global.datasetID);

    // Do this instead
    $('#correlationDatasetSelect').val(global.datasetID);
    $('#correlationDatasetSelect').selectpicker('render');
    $('#correlationImputation').html('');

    $('#fact-svg-chart').html('');

    resetSecondaryPlots();

    $.ajax({
        type: 'POST',
        url: submitURL,
        contentType: 'application/json',
        data: JSON.stringify(submitData),
        retries: 3,
        retryInterval: 1000,
        success: function(data, status, request) {
            global.runningTask = true;
            logDebug('data=', data);
            logDebug('status=', status);
            logDebug('request=', request);
            logDebug('data.group_id=', data.group_id);
            updateGeneSelect(data.group_id, submitData, geneID, proteinID, phosID, datasetID, covar);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            showErrorMessage(errorThrown, textStatus);
        }
    });
}

function generateSecondaryPlot(plot, id, markerID, chromosome, location, covar) {
    logDebug('Generating Secondary Plot');
    if (plot === 'navPlotMediation') {
        generateMediationPlot(id, markerID, covar);
    } else if (plot === 'navPlotEffect') {
        generateEffectPlot(id, chromosome, covar);
    } else if (plot === 'navPlotSNPs') {
        generateSNPAssocPlot(id, chromosome, location, covar);
    } else {
        logError('Unknown plot ', plot);
    }
}