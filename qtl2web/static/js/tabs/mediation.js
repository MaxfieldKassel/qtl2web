/**
 * Exports mediation data to a CSV file based on the dataset type.
 *
 * @param {string} id - The unique identifier associated with the export.
 * @param {Array} data - The array of data to be exported.
 */
function exportMediationData(id, data) {
    let headers = `"gene_id","symbol","chromosome","position","lod"`;
    let dataType = global.currentDataset.datatype;

    // Adjust the header based on the datatype
    if (dataType === 'protein') {
        headers = '"protein_id",' + headers;
    } else if (dataType === 'phos') {
        headers = '"phos_id","protein_id",' + headers;
    }

    // Initialize CSV content with the adjusted headers
    let csvContent = `${headers}\n`;

    // Generate the CSV content for each data entry
    data.forEach(item => {
        let row = [
            dataType === 'phos' ? item.phos_id : undefined,
            dataType !== 'gene' ? item.protein_id : undefined,
            item.gene_id,
            item.symbol,
            item.chrom,
            item.position,
            item.LOD
        ].filter(value => value !== undefined).join('","');

        csvContent += `"${row}"\n`;
    });

    downloadCSV(csvContent, `${id}_MEDIATION.csv`, 'text/csv;encoding:utf-8');
}

/**
 * Plot mediation data by preparing the visualization elements and configuring interaction.
 *
 * @param {Object} mediationData - Mediation data to be visualized.
 * @param {string} dsMediateAgainst - Dataset against which mediation is performed.
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
        plotTitle = `${global.geneID} (${global.geneSymbol})`;
        currentID = global.geneID;
    } else if (global.currentDataset.datatype === 'protein') {
        plotTitle = `${global.proteinID} (${global.geneSymbol})`;
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
 * Initiates the process to generate a mediation plot based on provided identifiers.
 *
 * @param {string} id - The unique identifier for the mediation process.
 * @param {string} markerID - The marker identifier to mediate against.
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

    startTask(); // Start the task and show processing dialog.
    $('#plotMediation').empty(); // Clear the mediation plot area.

    $.ajax({
        type: 'POST',
        url: submitURL,
        contentType: 'application/json',
        data: JSON.stringify(submitData),
        success: function (data) {
            logInfo('Mediation data submitted successfully.');
            logDebug('Response data:', data);
            updateMediationData(data.group_id, mediateAgainst); // Update the mediation data based on the group ID.
        },
        error: function (jqXHR, textStatus, errorThrown) {
            logError('Failed to submit mediation data:', textStatus, errorThrown);
            showErrorMessage(`Error during mediation submission: ${errorThrown}`, textStatus); // Show detailed error message.
        }
    });
}

/**
 * Updates the status of the downloading effect data for a specific task group.
 *
 * @param {string} groupID - The identifier of the task group.
 * @param {string} dsMediateAgainst - Dataset to be used in mediation.
 */
function updateMediationData(groupID, dsMediateAgainst) {
    logDebug('updateMediationData called for', groupID);

    if (!global.runningTask) {
        logDebug('canceling');
        $.getJSON(`${cancelBaseURL}${groupID}`, function (data) {
            logDebug('Cancellation data:', data);
            $('#plotMediation').empty();
        });
        return;
    }

    let statusURL = `${statusBaseURL}${groupID}`;
    $.ajax({
        type: 'GET',
        url: statusURL,
        retries: 3,
        retryInterval: 1000,
        success: function (data) {
            logDebug('Received mediation data:', data);
            handleTaskResponse(data, function () {
                logInfo('Mediation complete.');
                plotMediation(data.response_data.mediate.response.result, dsMediateAgainst);
                stopTask();
            }, function () {
                setTimeout(() => updateMediationData(groupID, dsMediateAgainst), 1000);
            });
        }
    });
}

/**
 * Asynchronously generates an HTML tooltip for display in a data visualization context.
 * This function constructs a tooltip containing information about a data item such as protein,
 * phosphorylation site, and gene identifiers.
 *
 * @param {Object} datum - The data item containing identifiers and values.
 * @param {Object} mark - Unused parameter, may be removed if not required elsewhere.
 * @param {Object} props - Unused parameter, may be removed if not required elsewhere.
 * @returns {Promise<string>} A promise that resolves with the HTML content for the tooltip.
 */
async function mediationTooltipHandler(datum, mark, props) {
    logDebug(datum); // Log the input data for debugging.

    // Initialize variables for storing HTML parts of the tooltip.
    let phosHTML = '';
    let proteinHTML = '';

    // Construct the phosphorylation ID section if available.
    if (datum.phos_id) {
        phosHTML = `
            <strong>Phos ID</strong> ${datum.phos_id}
            <br/>`;
    }

    // Construct the protein ID section if available.
    if (datum.protein_id) {
        proteinHTML = `
            <strong>Protein ID</strong> ${datum.protein_id}
            <br/>`;
    }

    // Construct and return the final HTML content for the tooltip.
    return genomeSpyEmbed.html`
        <div class="title">
            <strong>${datum.LOD}</strong>
        </div>
        <p class="summary">
            ${phosHTML}
            ${proteinHTML}
            <strong>Gene ID</strong> ${datum.gene_id}
            <br/>
            <strong>Symbol</strong> ${datum.symbol}
            <br/>
            <strong>Location</strong> ${datum.chrom}:${datum.position.toLocaleString()}
            <br/>
        </p>
    `;
}