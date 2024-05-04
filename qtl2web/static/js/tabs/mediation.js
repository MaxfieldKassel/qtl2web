function exportMediationData(id, data) {
    let csvContent = `"gene_id","symbol","chromosome","position","lod"\n`;

    if (global.currentDataset.datatype === 'protein') {
        csvContent = '"protein_id",' + csvContent;
    } else if (global.currentDataset.datatype === 'phos') {
        csvContent = '"phos_id","protein_id",' + csvContent;
    }

    $.each(data, function (k, v) {
        let line = `"${v.gene_id}","${v.symbol}","${v.chrom}",${v.position},${v.LOD}`;

        if (global.currentDataset.datatype === 'protein') {
            line = `"${v.protein_id}",` + line;
        } else if (global.currentDataset.datatype === 'phos') {
            line = `"${v.phos_id}","${v.protein_id}",` + line;
        }

        csvContent += `${line}\n`;
    });

    downloadCSV(csvContent, `${id}_MEDIATION.csv`, 'text/csv;encoding:utf-8');
}

/**
 * Plot mediation data
 * @param {Object} mediationData - mediation data
 */
function plotMediation(mediationData, dsMediateAgainst) {
    logDebug('mediation');
    let newData = [];

    // build the chomosome rects
    let rects = [];
    $.each(global.currentDataset.chromosomes.contigs, function (k, v) {
        if ((k % 2) === 1) {
            rects.push({
                name: v.name,
                size: v.size,
                start: 1,
                end: v.size
            });
        }
    });

    if (global.getDataset(dsMediateAgainst).datatype === 'mrna') {
        // ["ENSMUSG00000000001", "Gnai3", "3", 108.1267, 140.1666]
        $.each(mediationData, function (index, element) {
            if (element[2] in global.currentDataset.chromosomes.chr) {
                newData.push({
                    gene_id: element[0],
                    symbol: element[1],
                    chrom: element[2],
                    position: element[3],
                    LOD: element[4]
                });
            } else {
                //logDebug(element);
            }
        });

    } else if (global.getDataset(dsMediateAgainst).datatype === 'protein') {
        // ["ENSMUSP00000000001", "ENSMUSG00000000001", "Gnai3", "3", 108.126713, 7.1102046955]
        $.each(mediationData, function (index, element) {
            if (element[3] in global.currentDataset.chromosomes.chr) {
                newData.push({
                    protein_id: element[0],
                    gene_id: element[1],
                    symbol: element[2],
                    chrom: element[3],
                    position: element[4],
                    LOD: element[5]
                });
            } else {
                //logDebug(element);
            }
        });
    } else if (global.getDataset(dsMediateAgainst).datatype === 'phos') {
        // ["ENSMUSP00000024849_DSRTGDSMEASGF_636", "ENSMUSP00000000001", "ENSMUSG00000000001", "Gnai3", "3", 108.126713, 7.1102046955]
        $.each(mediationData, function (index, element) {
            if (element[4] in global.currentDataset.chromosomes.chr) {
                newData.push({
                    phos_id: element[0],
                    protein_id: element[1],
                    gene_id: element[2],
                    symbol: element[3],
                    chrom: element[4],
                    position: element[5],
                    LOD: element[6]
                });
            } else {
                //logDebug(element);
            }
        });
    } else {
        // TODO: handle error
        logError('MAJOR PROBLEM');
    }

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

    let minLOD = newData.reduce((a, b) => a.LOD < b.LOD ? a : b).LOD;
    let maxLOD = newData.reduce((a, b) => a.LOD > b.LOD ? a : b).LOD;

    logDebug('minLOD=', minLOD);
    logDebug('maxLOD=', maxLOD);

    minLOD = Math.max(0, Math.floor(minLOD) - 1);
    maxLOD = Math.ceil(maxLOD) + 1;

    logDebug('minLOD=', minLOD);
    logDebug('maxLOD=', maxLOD);

    let axisTicks = calculateTicks(minLOD, maxLOD, 5);
    let axisLines = [];

    $.each(axisTicks, function (k, v) {
        axisLines.push({
            axisLOD: v
        })
    });

    logDebug('minLOD=', minLOD);
    logDebug('maxLOD=', maxLOD);
    logDebug('axisLines=', axisLines);
    logDebug('newData=', newData);

    let trackMediation = {
        "name": "lod",
        "layer": [
            {
                "title": "Xbound",
                "data": {
                    "values": rects
                },
                "mark": {
                    "type": "rect",
                    "tooltip": {
                        "handler": "nullHandler"
                    },
                },
                "encoding": {
                    "x": {
                        "chrom": "name",
                        "pos": "start",
                        "type": "locus",
                        "title": null
                    },
                    "x2": {
                        "chrom": "name",
                        "pos": "end",
                        "type": "locus",
                        "title": null
                    },
                    "color": {
                        "value": "#eeeeee"
                    }
                },
            },
            {
                "title": "Ybound",
                "data": {
                    "values": axisLines,
                },
                "mark": {
                    "type": "rule",
                    "tooltip": {
                        "handler": "nullHandler"
                    },
                },
                "encoding": {
                    "y": {
                        "field": "axisLOD",
                        "type": "quantitative",
                        "title": null
                    },
                    "color": {
                        "value": "#e5e5e5"
                    }
                },
            },
            {
                "data": {
                    "values": newData
                },
                "title": "LODS",
                "mark": {
                    "type": "point",
                    "tooltip": {
                        "handler": "mediationTooltipHandler"
                    },
                    "geometricZoomBound": 4,
                    "inwardStroke": true,
                    "stroke": "#233b5e",
                    "strokeWidth": 0.7,
                    "fillOpacity": 0.6,
                    "strokeOpacity": 0.8
                },
                "encoding": {
                    "x": {
                        "chrom": "chrom",
                        "pos": "position",
                        "type": "locus"
                    },
                    "y": {
                        "field": "LOD",
                        "type": "quantitative",
                        "title": "LOD",
                        "scale": { "domain": [minLOD, maxLOD] },
                        "axis": {
                            "values": axisTicks
                        },
                    },
                    "color": {
                        "value": "#7090c0"
                    },
                    "size": {
                        "value": 100
                    },
                    "opacity": {
                        "value": 1
                    }
                }
            }
        ]
    };
    let tracks = [trackMediation];
    let handlers = {
        nullHandler: nullHandler,
        mediationTooltipHandler: mediationTooltipHandler
    };

    const spec = {
        "genome": {
            "name": global.currentDataset.ensembl_species + " " + global.currentDataset.ensembl_release,
            "contigs": global.currentDataset.chromosomes.contigs
        },
        "vconcat": tracks
    };

    logDebug("global.currentDataset.chromosomes.contigs=", global.currentDataset.chromosomes.contigs);
    logDebug('SPEC=', spec);

    $('#plotMediation').html('<div class="row"><div class="col" id="plotMediationMenu"></div></div><div class="row"><div class="col" id="plotMediationChart"></div></div>');
    $('#plotMediationChart').html('');
    $('#plotMediationMenu').html('');
    $('#plotMediationChart').height('500');

    $('#plotMediationMenu').append(`<div class="col text-center font-weight-bold">${plotTitle}
        <div class="dropdown dropleft float-right" id="mediationMenuDropdown">
          <a class="text-secondary" href="#" role="button" id="mediationDropdownMenuLink" data-toggle="dropdown" aria-expanded="false">
            <i class="fa-solid fa-bars"></i>
          </a>

          <div class="dropdown-menu" aria-labelledby="mediationDropdownMenuLink">
            <a class="dropdown-item" id="mediationDownloadPNG" style="font-size:11px !important">Download PNG image</a>
            <a class="dropdown-item" id="mediationDownloadCSV" style="font-size:11px !important">Download CSV</a>
          </div>
        </div>
    </div>`);

    let n = global.currentDataset.display_name;
    $("#mediationDownloadPNG").click(function (event) {
        downloadGenomeSpy('#plotMediationChart', `${n}_MEDIATION.png`, '255,255,255');
    });

    $("#mediationDownloadCSV").click(function (event) {
        exportMediationData(currentID, newData);
    });


    genomeSpyEmbed.embed(
        document.querySelector("#plotMediationChart"),
        spec,
        {
            tooltipHandlers: handlers
        }
    ).then(function (api) {
        api.addEventListener("click", function (event) {
            if (event.datum != null) {
                let datum = event.datum;
                logDebug('mediation clicked on', datum);
            }
        });
    });
}

/**
 * Start downloading mediation data.
 *
 */
function generateMediationPlot(id, markerID) {
    let mediateAgainst = $('#dsMediateAgainstID').val();
    let mediateURL = `${rBaseURL}/mediate?dataset=${global.datasetID}&id=${id}&marker_id=${markerID}&dataset_mediate=${mediateAgainst}`;

    let submitData = {
        urls: [{
            url_id: 'mediate',
            url: mediateURL
        }]
    };

    startTask();

    // reset the chart and clear it
    $('#plotMediation').html('');

    $.ajax({
        type: 'POST',
        url: submitURL,
        contentType: 'application/json',
        data: JSON.stringify(submitData),
        retries: 3,
        retryInterval: 1000,
        success: function (data, status, request) {
            logInfo('Mediation');
            logDebug('data = ', data);
            updateMediationData(data.group_id, mediateAgainst);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showErrorMessage(errorThrown, textStatus);
        }
    });
}

/**
 * Update the status of the downloading effect data.
 *
 * @param {string} groupID - the group identifier of the task
 */
function updateMediationData(groupID, dsMediateAgainst) {
    // send GET request to status URL
    logDebug('updateMediationData{} ', groupID);

    if (global.runningTask) {
        let statusURL = statusBaseURL + groupID;
        $.ajax({
            type: 'GET',
            url: statusURL,
            retries: 3,
            retryInterval: 1000,
            success: function (data, status, request) {
                logDebug('mediation data = ', data);

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
                            let message = `Unfortunately, there was a problem performing the Mediation Analysis.`;
                            stopTask();
                            showErrorMessage(message, errorMessages);
                        } else {
                            // show result, there will be 1 datasets to get
                            logInfo('mediation');
                            plotMediation(data.response_data.mediate.response.result, dsMediateAgainst);
                            stopTask();
                        }
                    }
                } else {
                    // rerun in 1 seconds
                    logDebug('Mediation not done, keep checking...');
                    setTimeout(function () {
                        updateMediationData(groupID, dsMediateAgainst);
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
            $('#plotMediation').html('');
        });
    }
}