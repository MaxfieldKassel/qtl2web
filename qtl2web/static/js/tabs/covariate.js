function configureCovarInfo(resetPeaks) {
    logDebug('configureCovarInfo', resetPeaks);

    // current dataset
    let ds = global.currentDataset;

    logDebug("ds['covar_info'] = ", ds['covar_info']);

    if (isEmpty(ds['covar_info'])) {
        logDebug('NO COVAR INFO');

        // configure the lod peaks covariate selections
        if (resetPeaks) {
            $('#divInteractiveCovariatesPeaks').html(`<input type="hidden" id="interactiveCovarPeaks" value="additive"/>`);
        }

        // configure the profile plot covariate selections
        // currently the profile plot tab is hidden when no covariates available
        let profilePlotOptionsHTML = `
            <input type="hidden" id="factorSeries" value="additive"/>
            <input type="hidden" id="factorSeriesCorrelation" value="additive"/>
            <select id="factorSeries" style="hidden"><option value="" selected></option></select>;
        `;
        $('#divProfilePlotOptions').html(profilePlotOptionsHTML);

        // configure the lod plot covariate selections
        $('#divInteractiveCovariatesLOD').html(`<input type="hidden" id="interactiveCovarLODS" value="additive"/>`);

        // configure the correlation plot covariate selections
        $('#correlationCovariateSelectionText').addClass('hidden').removeClass('visible');
        $('#correlationCovariateSelection').html('<input type="hidden" id="interactiveCovarCorrelation" value="additive"/>');
        $('#correlationImputation').html('');

        // hide the correlation color select
        $("#divCorrelationCovars").addClass('hidden').removeClass('visible');

        logDebug('configureCovarInfo RETURNING');
    } else {

        // configure the profile plot covariate selections

        let profilePlotOptionsHTML = `
            <div class="col">
            <div class="row">
                <div class="col font-weight-bold">
                    Select your factors
                </div>
            </div>

            <div class="row">
                <div class="col">
                    <div id="factor-view-select-wrapper">
                        <select id="factor-view-select" multiple="multiple">
                        </select>
                    </div>
                </div>
            </div>

            <div class="row row-spacer"></div>

            <div class="row">
                <div class="col font-weight-bold">
                    Select a series to color
                </div>
            </div>

            <div class="row">
                <div class="col" id="divFactorSeries">
                </div>
            </div>

            <div class="row row-spacer"></div>
            </div>
        `;

        $('#divProfilePlotOptions').html(profilePlotOptionsHTML);

        global.orderCount = ds['covar_info'].length;
        logDebug('global.orderCount=', global.orderCount);

        $('#factor-view-select').multiselect({
            onChange: function (option, checked) {
                if (checked) {
                    global.orderCount++;
                    $(option).attr('order', global.orderCount);
                } else {
                    $(option).attr('order', '');
                }

                if (global.currentDataset.datatype === 'mrna') {
                    plotProfile(global.geneID);
                } else if (global.currentDataset.datatype === 'protein') {
                    plotProfile(global.proteinID);
                } else if (global.currentDataset.datatype === 'phos') {
                    plotProfile(global.phosID);
                } else if (global.currentDataset.datatype === 'pheno') {
                    plotProfile(global.phenotypeID);
                } else {
                    // TODO: major error
                    logError('MAJOR ERROR');
                }

            },
            maxHeight: 400,
            dropUp: false,
            buttonWidth: '100%',
            buttonClass: 'text-left btn btn-sm btn-secondary',
            buttonText: function (options) {
                if (options.length === 0) {
                    return 'None selected';
                } else {
                    let selected = [];

                    options.each(function () {
                        selected.push([$(this).text(), $(this).attr('order')]);
                    });

                    selected.sort(function (a, b) {
                        return a[1] - b[1];
                    });

                    let text = '';
                    for (let i = 0; i < selected.length; i++) {
                        text += (selected[i][0] + ', ');  // without numbers
                    }

                    return text.substr(0, text.length - 2);
                }
            }
        });

        // show the correlation color select
        $("#divCorrelationCovars").addClass('visible').removeClass('hidden');

        let selectOptions = [];
        let html = '<select id="factorSeries" data-style="btn-secondary btn-sm" data-width="100%" class="selectpicker">';
        let htmlCorrelation = '<select id="factorSeriesCorrelation" data-style="btn-secondary btn-sm" data-width="100%" class="selectpicker">';
        let htmlInteractiveCovariatesLOD = `<div class="row">
                                                <div class="col-auto align-self-center font-weight-bold">
                                                    <span>Plots</span>
                                                </div>
                                                <div class="col">
                                                    <select id="interactiveCovarLODS" data-style="btn-secondary btn-sm" data-width="100%" class="selectpicker">
                                            `;
        let htmlInteractiveCovariatesPeaks = `<div class="row">
                                                  <div class="col-auto align-self-center">
                                                    <span>Plot type</span>
                                                  </div>
                                                  <div class="col">
                                                      <select id="interactiveCovarPeaks" data-style="btn-secondary btn-sm" data-width="100%" class="selectpicker">
                                        `;

        let htmlInteractiveCovariatesCorrelation = `<select id="interactiveCovarCorrelation" data-style="btn-secondary btn-sm" data-width="100%" class="selectpicker">`;

        global.interactiveCovariates = [];

        htmlInteractiveCovariatesLOD += `<option value="additive">Additive</option>`;
        htmlInteractiveCovariatesPeaks += `<option value="additive">Additive</option>`;
        htmlInteractiveCovariatesCorrelation += `<option value="none">None</option>`;

        $.each(ds['covar_info'], function (index, element) {
            selectOptions.push({
                label: element['display_name'],
                order: index,
                selected: element.primary,
                title: element['display_name'],
                value: element['sample_column'],
            });

            html += `<option value="${element['sample_column']}">${element['display_name']}</option>`;
            htmlCorrelation += `<option value="${element['sample_column']}">${element['display_name']}</option>`;

            // interactive covariates
            if (element.interactive) {
                global.interactiveCovariates.push(element);
                htmlInteractiveCovariatesLOD += `<option value="${element['sample_column']}">${element['display_name']}</option>`;
                htmlInteractiveCovariatesPeaks += `<option value="${element['sample_column']}">${element['display_name']}</option>`;
                htmlInteractiveCovariatesCorrelation += `<option value="${element['sample_column']}">${element['display_name']}</option>`;
            }
        });

        html += '</select>';
        htmlCorrelation += '</select>';
        htmlInteractiveCovariatesLOD += '</select></div></div>';
        htmlInteractiveCovariatesPeaks += '</select></div></div>';
        htmlInteractiveCovariatesCorrelation += '</select>';

        $('#factor-view-select').multiselect('dataprovider', selectOptions);

        $('#divFactorSeries').html(html);
        $('#divFactorSeriesCorrelation').html(htmlCorrelation);


        logDebug('global.interactiveCovariates=', global.interactiveCovariates);

        // display a selection if we have interactive covariates, nothing if not
        if (global.interactiveCovariates.length > 0) {
            $('#divInteractiveCovariatesLOD').html(htmlInteractiveCovariatesLOD);

            $('#interactiveCovarLODS').selectpicker();

            $('#interactiveCovarLODS').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
                changeCovariate(e.target.value);
            });

            // add Covariate adjustment for correlation
            $('#correlationCovariateSelectionText').addClass('visible').removeClass('hidden');
            $('#correlationCovariateSelection').html(htmlInteractiveCovariatesCorrelation);
            $('#interactiveCovarCorrelation').selectpicker();

            $('#interactiveCovarCorrelation').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
                let selected = $(this).find(':selected').val();
                let dataset = $('#correlationDatasetSelect').find(':selected').val();
                switchCorrelationDataSet(dataset, selected);
            });


            if (resetPeaks) {
                $('#divInteractiveCovariatesPeaks').html(htmlInteractiveCovariatesPeaks);

                $('#interactiveCovarPeaks').selectpicker();

                $('#interactiveCovarPeaks').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
                    generateLODPeaksHTML();
                });
            }


        } else {
            $('#divInteractiveCovariatesLOD').html(`<input type="hidden" id="interactiveCovarLODS" value="additive"/>`);

            // remove Covariate adjustment for correlation
            $('#correlationCovariateSelectionText').addClass('hidden').removeClass('visible');
            $('#correlationCovariateSelection').html('<input type="hidden" id="interactiveCovarCorrelation" value="additive"/>');

            if (resetPeaks) {
                $('#divInteractiveCovariatesPeaks').html(`<input type="hidden" id="interactiveCovarPeaks" value="additive"/>`);
            }
        }

        $('#factorSeries').selectpicker();

        $('#factorSeries').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
            if (global.currentDataset.datatype === 'mrna') {
                plotProfile(global.geneID);
            } else if (global.currentDataset.datatype === 'protein') {
                plotProfile(global.proteinID);
            } else if (global.currentDataset.datatype === 'phos') {
                plotProfile(global.phosID);
            } else if (global.currentDataset.datatype === 'pheno') {
                plotProfile(global.phenotypeID);
            } else {
                // TODO: major error
                logError('MAJOR ERROR');
            }
        });

        $('#factorSeriesCorrelation').selectpicker();

        $('#factorSeriesCorrelation').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
            plotCorrelationChart();
        });

    }

    $('#btnDownloadCorrelationData').off('click');
    $('#btnDownloadCorrelationData').on('click', function (evt) {
        logDebug('Downloading correlation data');
        if (global.correlationData) {
            let csvContent = '';
            let id = '';

            if (global.currentDataset.datatype === 'mrna') {
                id = global.geneID;
            } else if (global.currentDataset.datatype === 'protein') {
                id = global.proteinID;
            } else if (global.currentDataset.datatype === 'phos') {
                id = global.phosID;
            } else if (global.currentDataset.datatype === 'pheno') {
                id = global.phenotypeID;
            } else {
                logError('MAJOR ERROR');
            }

            if (global.currentCorrelationDataset.datatype === 'mrna') {
                csvContent = '"gene_id","symbol","chr","start","end","correlation"\n';
                $.each(global.correlationData.correlations, function (k, v) {
                    csvContent += `"${v.id}","${v.symbol}","${v.chr}",${v.start},${v.end},${v.cor}\n`;
                });
            } else if (global.currentCorrelationDataset.datatype === 'protein') {
                csvContent = '"gene_id","protein_id","symbol","chr","start","end","correlation"\n';
                $.each(global.correlationData.correlations, function (k, v) {
                    csvContent += `"${v.gene_id}","${v.id}","${v.symbol}","${v.chr}",${v.start},${v.end},${v.cor}\n`;
                });
            } else if (global.currentCorrelationDataset.datatype === 'phos') {
                csvContent = '"gene_id","protein_id","phos_id","symbol","chr","start","end","correlation"\n';
                $.each(global.correlationData.correlations, function (k, v) {
                    csvContent += `"${v.gene_id}","${v.protein_id}","${v.id}","${v.symbol}","${v.chr}",${v.start},${v.end},${v.cor}\n`;
                });
            } else if (global.currentCorrelationDataset.datatype === 'pheno') {
                csvContent = '"id","correlation"\n';
                $.each(global.correlationData.correlations, function (k, v) {
                    csvContent += `"${v.id}",${v.cor}\n`;
                });
            } else {
                // TODO: major error
                logError('MAJOR ERROR');
            }

            downloadCSV(csvContent, `${id}_correlation.csv`, 'text/csv;encoding:utf-8');
        } else {
            logDebug('no correlation data?');
        }
    });
}


function updateChangeCovariate(groupID, covar) {
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

                /* A response will be like this:

                   {
                    number_tasks_completed: 3,
                    number_tasks_errors: 2,
                    number_tasks_submitted: 3,
                    response_data: {
                        lod: {
                            error: "Connection Error"
                            error_message: "HTTPConnectionPool(host='myapiisawesome', port=8000): Max retries exceeded with url: /lodscan?dataset=dataset.islet.rnaseq&nCores=2&id=ENSMUSG00000023224 (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7f861126ce48>: Failed to establish a new connection: [Errno -5] No address associated with hostname',))"
                            url: "http://myapiisawesome:8000/lodscan?dataset=dataset.islet.rnaseq&nCores=2&id=ENSMUSG00000023224"
                            url_id: "lod"
                        }
                    },
                    status: "DONE",
                    task_id: "d3c0b971-9794-4ed7-80cb-046710d2f9f5",
                    error: 'UNKNOWN ERROR'   <--- ONLY WHEN AN ERROR
                   }
                */

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
                            // show result, there will be 1
                            global.LODChartData[covar] = data.response_data.lod.response.result;

                            plotLODChart(data.response_data.lod.response.result,
                                covar,
                                null);

                            plotLODChart(data.response_data.lod.response.result,
                                covar,
                                global.LODChartData.additive);

                            stopTask();
                        }
                    }
                }
                else {
                    // rerun in 1 seconds
                    logDebug('Not done, keep checking...');
                    setTimeout(function () {
                        updateChangeCovariate(groupID, covar);
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
 * Change covar LOD plot.
 */
function changeCovariate(covariate) {
    logDebug('changeCovariate(', covariate, ')');

    if (covariate === 'additive') {
        // remove all other graphs
        logDebug('additive, clear others');
        $('#lodPlotChartCovariateFull').html('');
        $('#lodPlotChartCovariateDiff').html('');
    } else {
        $('#lodPlotChart').html('');
        $('#lodPlotChartCovariateFull').html('');
        $('#lodPlotChartCovariateDiff').html('');
    }


    // check to see if we have the data, if so, plot it
    // else go get it
    if (covariate in global.LODChartData) {
        logDebug('covar in global.LODChartData, so just add it');
        if (covariate === 'additive') {
            plotLODChart(global.LODChartData[covariate], covariate, null);
        } else {
            plotLODChart(global.LODChartData[covariate], covariate, null);
            plotLODChart(global.LODChartData[covariate], covariate, global.LODChartData.additive);
        }
    } else {
        logDebug('covar NOT in global.LODChartData, so go get it');
        let urlLOD = `${rBaseURL}/lodscan?dataset=${global.datasetID}&id=`;

        if (global.currentDataset.datatype === 'mrna') {
            urlLOD += `${global.geneID}`;
        } else if (global.currentDataset.datatype === 'protein') {
            urlLOD += `${global.proteinID}`;
        } else if (global.currentDataset.datatype === 'phos') {
            urlLOD += `${global.phosID}`;
        } else if (global.currentDataset.datatype === 'pheno') {
            urlLOD += `${global.phenotypeID}`;
        } else {
            // TODO: handle error
            logError('MAJOR PROBLEM');
        }

        urlLOD += ('&intcovar=' + covariate);

        // TODO: add ncores?, regress_local? to urlLOD, or handle backend?
        //URL += '&ncores=' + _G.api_cores;
        if (rNumCores) {
            urlLOD += `&cores=${rNumCores}`;
        }

        let submitData = {
            urls: [{
                url_id: 'lod',
                url: urlLOD
            }]
        };

        startTask();

        $('#fact-svg-chart').html('');

        resetSecondaryPlots();

        $.ajax({
            type: 'POST',
            url: submitURL,
            contentType: 'application/json',
            data: JSON.stringify(submitData),
            retries: 3,
            retryInterval: 1000,
            success: function (data, status, request) {
                global.runningTask = true;
                logDebug('data=', data);
                logDebug('status=', status);
                logDebug('request=', request);
                //let status_url = request.getResponseHeader('Location');
                //logDebug('status_url=', status_url);
                logDebug('data.group_id=', data.group_id);
                updateChangeCovariate(data.group_id, covariate);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                showErrorMessage(errorThrown, textStatus);
            }
        });
    }
}