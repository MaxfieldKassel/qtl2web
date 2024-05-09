/**
 * Exports LOD peaks data for different dataset types to a CSV file.
 * @param {string} id - Identifier for the dataset.
 * @param {Array} peaks - Array of peak data from various analyses.
 */
function exportLODPeaks(id, peaks) {
    const datasetType = global.currentDataset.datatype;
    let csvContent = '';
    let headers = {
        'mrna': '"gene_id","symbol","gene_chrom","gene_mid","marker_id","marker_chrom","marker_position","lod"',
        'protein': '"protein_id","gene_id","symbol","gene_chrom","gene_mid","marker_id","marker_chrom","marker_position","lod"',
        'phos': '"phos_id","protein_id","gene_id","symbol","gene_chrom","gene_mid","marker_id","marker_chrom","marker_position","lod"',
        'pheno': '"marker_id","marker_chrom","marker_position","phenotype","lod"'
    };

    // Select headers based on the dataset type and check if additional columns are needed
    csvContent += headers[datasetType];
    if (peaks.length > 0 && peaks[0].length > headers[datasetType].split(',').length) {
        csvContent += ',"A","B","C","D","E","F","G","H"';
    }
    csvContent += '\n';

    // Mapping the indices for structured data output based on dataset type
    const indexMap = {
        'mrna': [3, 4, 5, 6, 0, 1, 2, 7],
        'protein': [3, 4, 5, 6, 7, 0, 1, 2, 8],
        'phos': [3, 4, 5, 6, 7, 8, 0, 1, 2, 9],
        'pheno': [0, 1, 2, 4, 6]
    };

    // Process each peak and form the CSV content
    peaks.forEach(peak => {
        let line = indexMap[datasetType].map(idx => idx < peak.length ? `"${peak[idx]}"` : peak[idx]).join(',');
        if (peak.length > indexMap[datasetType].length) {
            line += ',' + peak.slice(indexMap[datasetType].length).join(',');
        }
        csvContent += line + '\n';
    });

    downloadCSV(csvContent, `${id}_LODPEAKS.csv`, 'text/csv;encoding:utf-8');
}

/**
 * Calculates data for a visual legend based on provided elements, their colors, and a specified name.
 * @param {string[]} elems - Array of legend element labels.
 * @param {string[]} colors - Array of colors corresponding to each legend label.
 * @param {string} name - The name of the legend.
 * @returns {Object} An object representing the legend configuration for visualization.
 */
function calcLegend(elems, colors, name) {
    let height = 12; // Default height for one row
    let xDomain = [0, 2]; // Default domain for x-axis
    let legendData = [];

    // Check if there is only one element, set simpler legend
    if (elems.length === 1) {
        xDomain = [0, 1];
        legendData.push({
            x: 0.5, // Center the text for a single element
            y: 1,
            text: elems[0],
            color: colors[0]
        });
    } else {
        height = Math.ceil(elems.length / 2) * 12;
        for (let i = 0; i < elems.length; i++) {
            let x = i % 2; // Column 0 or 1
            let y = Math.floor(i / 2); // Row index based on current element index
            legendData.push({
                x: x,
                y: y,
                text: elems[i],
                color: colors[i]
            });
        }
    }

    let legend = {
        name: name,
        height: height,
        data: { values: legendData },
        mark: { type: "text", align: "left", tooltip: { handler: "nullHandler" } },
        encoding: {
            x: { field: "x", type: "quantitative", scale: { domain: xDomain }, axis: null, title: null },
            y: { field: "y", type: "quantitative", axis: null, title: null },
            color: { field: "color", type: "nominal", scale: { domain: elems, range: colors } },
            text: { field: "text", type: "nominal" },
            size: { value: 11 }
        }
    };

    return legend;
}

/**
 * Plot LOD Peaks as a scatter plot.
 */
function plotLODPeaks() {
    logDebug('plotLODPeaks()');
    let covar = $('#interactiveCovarPeaks').val();
    logDebug('covar=', covar);

    let data = [];
    let tracks = null;
    let legend = null;
    let handlers = null;
    let minLOD = Infinity;
    let maxLOD = -Infinity;
    let html = `<div class="row">
                    <div class="col">
                        <div id="plotLodPeaks" style="width: 100%"></div>
                    </div>
                </div>`;


    let trackPeakLOD = null;

    let chrs = global.currentDataset.chromosomes.chr;

    logDebug('chrs=', chrs);

    $("#plotLodPeaks").html('');
    $('#plotLodPeaks').height('400');

    if ((global.currentDataset.datatype === 'mrna') ||
        (global.currentDataset.datatype === 'protein')) {
        // mrna
        // [marker_id, chrom, position, gene_id, symbol, gene_chrom, gene_mid, lod
        // ["1_100007442","1",100.0074,"ENSMUSG00000028028","Alpk1","3",127.7255,6.1147]
        // protein
        // [marker_id, chrom, position, protein_id, gene_id, symbol, gene_chrom, gene_mid, lod
        // ["1_106129060","1",106.12906,"ENSMUSP00000108356","ENSMUSG00000009907","Vps4b","1",106.7804,8.2928352859],
        // phos
        // [marker_id, chrom, position, phos_id, protein_id, gene_id, symbol, gene_chrom, gene_mid, lod
        // ["1_106129060","1",106.12906,"PHOS_ID","ENSMUSP00000108356","ENSMUSG00000009907","Vps4b","1",106.7804,8.2928352859],

        $('#plotLodPeaks').width('400');

        let idxGeneID = 3;
        let idxGeneSymbol = 4;
        let idxGeneChr = 5;
        let idxGenePos = 6;
        let idxLODPos = 7;
        let isProtein = false;
        let isPhos = false;

        if (global.currentDataset.datatype === 'protein') {
            idxGeneID = 4;
            idxGeneSymbol = 5;
            idxGeneChr = 6;
            idxGenePos = 7;
            idxLODPos = 8;
            isProtein = true;
        } else if (global.currentDataset.datatype === 'phos') {
            idxGeneID = 5;
            idxGeneSymbol = 6;
            idxGeneChr = 7;
            idxGenePos = 8;
            idxLODPos = 9;
            isPhos = true;
        }

        logDebug('idxGeneChr=', idxGeneChr);
        logDebug('idxLODPos=', idxLODPos);

        let lodThreshold = +$('#lodSliderValue').val();

        logDebug('lodThreshold=', lodThreshold);

        $.each(global.currentDataset.lodpeaks[covar], function (index, element) {

            if ((element[1] in chrs) && (element[idxGeneChr] in chrs)) {
                let markerChr = chrs[element[1]].chromosome;
                let markerPos = element[2];
                let geneChr = chrs[element[idxGeneChr]].chromosome;
                let genePos = element[idxGenePos];

                if ((lodThreshold != null) && (element[idxLODPos] >= lodThreshold)) {
                    let lod = {
                        geneChr: geneChr,
                        genePos: genePos,
                        genePosOrig: element[idxGenePos],
                        markerChr: markerChr,
                        markerPos: markerPos,
                        markerPOrig: element[2],
                        lod: element[idxLODPos],
                        markerID: element[0],
                        geneID: element[idxGeneID],
                        geneSymbol: element[idxGeneSymbol],
                        proteinID: isPhos ? element[4] : isProtein ? element[3] : null,
                        phosID: isPhos ? element[3] : null,
                        covar: covar,
                        phenotype: false
                    };

                    if (element.length > idxLODPos + 1) {
                        lod['A'] = element[idxLODPos + 1]
                        lod['B'] = element[idxLODPos + 2]
                        lod['C'] = element[idxLODPos + 3]
                        lod['D'] = element[idxLODPos + 4]
                        lod['E'] = element[idxLODPos + 5]
                        lod['F'] = element[idxLODPos + 6]
                        lod['G'] = element[idxLODPos + 7]
                        lod['H'] = element[idxLODPos + 8]
                    }

                    data.push(lod);
                }

                minLOD = Math.min(minLOD, element[idxLODPos]);
                maxLOD = Math.max(maxLOD, element[idxLODPos]);
            }
        });

        minLOD = Math.max(0, Math.floor(minLOD) - 1);
        maxLOD = Math.ceil(maxLOD) + 1;

        logDebug('minLOD=', minLOD, 'maxLOD=', maxLOD);
        logDebug(data);

        trackPeakLOD = {
            "name": "lod",
            "layer": [
                {
                    "title": "Xbound",
                    "data": {
                        "values": global.currentDataset.chromosomes.contigs
                    },
                    "mark": {
                        "type": "rule",
                        "tooltip": {
                            "handler": "nullHandler"
                        },
                    },
                    "encoding": {
                        "x": {
                            "chrom": "name",
                            "pos": "size",
                            "type": "locus"
                        },
                        "color": {
                            "value": "lightgray"
                        }
                    },
                },
                {
                    "title": "Ybound",
                    "data": {
                        "values": global.currentDataset.chromosomes.contigs
                    },
                    "mark": {
                        "type": "rule",
                        "tooltip": {
                            "handler": "nullHandler"
                        },
                    },
                    "encoding": {
                        "y": {
                            "chrom": "name",
                            "pos": "size",
                            "type": "locus"
                        },
                        "color": {
                            "value": "lightgray"
                        }
                    },
                },
                {
                    "data": {
                        "values": data
                    },
                    "title": "LODS",
                    "mark": {
                        "type": "point",
                        "tooltip": {
                            "handler": "lodPeakGeneTooltipHandler"
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
                            "chrom": "markerChr",
                            "pos": "markerPos",
                            "type": "locus",
                            "title": "Marker"
                        },
                        "y": {
                            "chrom": "geneChr",
                            "pos": "genePos",
                            "type": "locus",
                            "title": "Gene"

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

        tracks = [trackPeakLOD];
        handlers = {
            nullHandler: nullHandler,
            lodPeakGeneTooltipHandler: lodPeakGeneTooltipHandler
        };

    } else if (global.currentDataset.datatype === 'pheno') {
        // ["5_137006393","5",137.0064,"MEcyan","MEcyan","MEcyan",9.1161],[

        let seriesData = new Set();
        let data = [];
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

        $.each(global.currentDataset.lodpeaks[covar], function (index, element) {
            // element[0] = marker_id
            let markerChr = chrs[element[1]].chromosome;
            let markerPos = element[2];

            // lookup the phenotype
            //logDebug('element=', element);
            //logDebug('global.datasetID=', global.datasetID);
            //logDebug(global.currentDataset.phenotypes);

            let phenotype = global.currentDataset.phenotypes[element[3]];

            //logDebug(phenotype);
            seriesData.add(phenotype.category);

            data.push({
                lod: element[6],
                phenoDataName: element[3],
                phenoShortName: element[4],
                phenoDescription: element[5],
                phenoCategory: phenotype.category,
                markerPosOrig: element[2],
                markerChr: markerChr,
                markerPos: markerPos,
                markerID: element[0],
                covar: covar,
                phenotype: true
            });

            minLOD = Math.min(minLOD, element[6]);
            maxLOD = Math.max(maxLOD, element[6]);
        });

        minLOD = Math.max(0, Math.floor(minLOD) - 1);
        maxLOD = Math.ceil(maxLOD) + 1;

        let axisTicks = calculateTicks(minLOD, maxLOD, 5);

        let axisLines = [];

        $.each(axisTicks, function (k, v) {
            axisLines.push({
                axisLOD: v
            })
        });


        let phenotypeColorDomain = Array.from(seriesData);
        let phenotypeColorRange = global.PLOT_COLORS.slice(0, phenotypeColorDomain.length);
        let revColors = [];

        for (let x = phenotypeColorRange.length - 1; x >= 0; x--) {
            revColors.push(phenotypeColorRange[x]);
        }

        logDebug('phenotype lod=', data);
        logDebug('minLOD=', minLOD);
        logDebug('maxLOD=', maxLOD);
        logDebug('phenotypeColorDomain=', phenotypeColorDomain);
        logDebug('phenotypeColorRange=', phenotypeColorRange);
        logDebug('revColors=', revColors);

        trackPeakLOD = {
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
                        "values": data
                    },
                    "title": "LODS",
                    "mark": {
                        "type": "point",
                        "tooltip": {
                            "handler": "lodPeakPhenotypeTooltipHandler"
                        },
                        "geometricZoomBound": 4,
                        "inwardStroke": true,
                        "stroke": "#222222",
                        "strokeWidth": 0.7,
                        "fillOpacity": 0.6,
                        "strokeOpacity": 0.8
                    },
                    "encoding": {
                        "x": {
                            "chrom": "markerChr",
                            "pos": "markerPos",
                            "type": "locus",
                            "title": "Marker Location"
                        },
                        "y": {
                            "field": "lod",
                            "type": "quantitative",
                            "title": "LOD",
                            "scale": { "domain": [minLOD, maxLOD] },
                            "axis": {
                                "values": axisTicks
                            },
                        },
                        "color": {
                            "type": "nominal",
                            "field": "phenoCategory",
                            "scale": {
                                "domain": phenotypeColorDomain,
                                "range": revColors,
                            }
                        },
                        "size": {
                            "value": 100
                        },
                        "opacity": {
                            "value": 1
                        },
                    }
                }
            ]
        };
        legend = calcLegend(phenotypeColorDomain, phenotypeColorRange, "peaksLegend");
        tracks = [trackPeakLOD, legend];
        handlers = {
            nullHandler: nullHandler,
            lodPeakPhenotypeTooltipHandler: lodPeakPhenotypeTooltipHandler
        };
    }

    const spec = {
        "genome": {
            "name": global.currentDataset.ensembl_species + " " + global.currentDataset.ensembl_release,
            "contigs": global.currentDataset.chromosomes.contigs
        },

        "vconcat": tracks
    };

    logDebug('SPEC=', spec);

    $('#divLODPeaksMenu').html('');

    $('#divLODPeaksMenu').append(`<div class="col text-center font-weight-bold">LOD Peaks
        <div class="dropdown dropleft float-right" id="lodPeaksMenuDropdown">
          <a class="text-secondary" href="#" role="button" id="peaksDropdownMenuLink" data-toggle="dropdown" aria-expanded="false">
            <i class="fa-solid fa-bars"></i>
          </a>

          <div class="dropdown-menu" aria-labelledby="peaksDropdownMenuLink">
            <a class="dropdown-item" id="peaksDownloadPNG" style="font-size:11px !important">Download PNG image</a>
            <a class="dropdown-item" id="peaksDownloadCSV" style="font-size:11px !important">Download CSV</a>
          </div>
        </div>
    </div>`);

    let n = global.currentDataset.display_name;
    $("#peaksDownloadPNG").click(function (event) {
        downloadGenomeSpy('#plotLodPeaks', `${n}_PEAKS.png`, '255,255,255');
    });

    $("#peaksDownloadCSV").click(function (event) {
        exportLODPeaks(n, global.currentDataset.lodpeaks[covar]);
    });


    genomeSpyEmbed.embed(
        document.querySelector("#plotLodPeaks"),
        spec,
        {
            tooltipHandlers: handlers
        }
    ).then(function (api) {
        api.addEventListener("click", function (event) {
            if (event.datum != null) {
                let datum = event.datum;

                if ('geneID' in datum) {
                    logDebug('lodPeak clicked on', datum);
                    logDebug(datum.geneID, datum.proteinID, global.datasetID, covar);
                    selectGeneProtein(datum.geneID, datum.proteinID, datum.phosID, global.datasetID, covar);
                } else if ('phenoDataName' in datum) {
                    logDebug('lodPeak clicked on', datum);
                    logDebug(datum.phenoDataName, global.datasetID, covar);
                    selectPhenotype(datum.phenoDataName, global.datasetID, covar);
                } else {
                    logDebug('DO NOTHING');
                }
            }
        });
    });
}

/**
 * Generates HTML for the LOD Peaks interface and handles UI events to update the display based on user interaction.
 */
function generateLODPeaksHTML() {
    logDebug('generateLODPeaksHTML()');

    if (isEmpty(global.currentDataset.lodpeaks)) {
        logDebug('LOD peaks data is null, returning');
        return;
    }

    let covar = $('#interactiveCovarPeaks').val();
    logDebug('Covariate:', covar);

    let html = '<div class="row"><div class="col"><div id="plotLodPeaks" style="width: 100%"></div></div></div>';
    if (!['mrna', 'protein', 'phos'].includes(global.currentDataset.datatype)) {
        $('#divLODPeaks').html(html);
        return;
    }

    const lodPosition = {
        'mrna': 7,
        'protein': 8,
        'phos': 9
    };

    let idxLODPos = lodPosition[global.currentDataset.datatype];
    let lods = global.currentDataset.lodpeaks[covar];
    let minLOD = lods.reduce((min, current) => Math.min(min, current[idxLODPos]), Infinity);
    let maxLOD = lods.reduce((max, current) => Math.max(max, current[idxLODPos]), -Infinity);

    minLOD = Math.max(0, Math.floor(minLOD) - 1);
    maxLOD = Math.ceil(maxLOD) + 1;
    logDebug('minLOD:', minLOD, 'maxLOD:', maxLOD);

    html += `
        <div class="row">
            <div class="col-sm-auto my-auto margin y auto font-weight-bold">
                <span class="align-bottom">LOD Threshold:</span>
            </div>
            <div class="col-auto">
                <div class="input-group">
                    <input id="lodSliderValue" type="number" min="${minLOD}" max="${maxLOD}" step=".5" value="${minLOD}" class="form-control" size="6">
                    <span class="input-group-append">
                        <button id="btnGoLOD" class="btn btn-primary"><i class="fas fa-caret-right"></i></button>
                    </span>
                </div>
            </div>
        </div>
        <div class="row justify-content-center">
            <div class="col text-right">
                <span>${minLOD}</span>
            </div>
            <div class="col-8">
                <input type="range" class="custom-range" value="${minLOD}" min="${minLOD}" max="${maxLOD}" id="lodRange">
            </div>
            <div class="col text-left">
                <span>${maxLOD}</span>
            </div>
        </div>
    `;

    $('#divLODPeaks').html(html);

    $('#lodRange').on('change', () => syncSliderWithValue());
    $('#btnGoLOD').on('click', () => syncSliderWithValue());
    $('#lodSliderValue').on('input', () => syncSliderWithValue());

    plotLODPeaks(global.currentDataset.lodpeaks[covar], maxLOD);
}

/**
 * Synchronizes the slider value with the input field and updates the LOD peaks plot.
 * @param {string} covariate - The covariate value to determine which dataset to plot.
 */
function syncSliderWithValue(covariate) {
    let value = parseFloat($('#lodSliderValue').val()); // Ensures the value is a float
    $('#lodRange').val(value);
    plotLODPeaks(global.currentDataset.lodpeaks[covariate], value);
}

/**
 * Asynchronously generates tooltip content for gene-related LOD peaks data.
 * @param {Object} datum - Data object containing gene and LOD peak details.
 * @param {Object} mark - The visual representation of the data in the visualization (unused but required for interface consistency).
 * @param {Object} props - Additional properties related to the data point (unused but required for interface consistency).
 * @returns {Promise<string>} HTML content for the tooltip, correctly handled as HTML.
 */
async function lodPeakGeneTooltipHandler(datum, mark, props) {
    logDebug(datum, mark, props);
    let AH = '';
    let protein = ''
    let phos = ''

    if (('proteinID' in datum) &&
        (datum['proteinID'] != null) &&
        (datum['proteinID'] !== '')) {
        protein = genomeSpyEmbed.html`
            <strong>Protein ID</strong> ${datum.proteinID}
            <br/>`;
    }

    if (('phosID' in datum) &&
        (datum['phosID'] != null) &&
        (datum['phosID'] !== '')) {
        phos = genomeSpyEmbed.html`
            <strong>Phos ID</strong> ${datum.phosID}
            <br/>`;
    }

    if ('A' in datum) {
        AH = genomeSpyEmbed.html`
            <br/>
            <strong>Allele Effects</strong>
            <br/>  A: ${datum.A}
            <br/>  B: ${datum.B}
            <br/>  C: ${datum.C}
            <br/>  D: ${datum.D}
            <br/>  E: ${datum.E}
            <br/>  F: ${datum.F}
            <br/>  G: ${datum.G}
            <br/>  H: ${datum.H}
        `;
    }

    return genomeSpyEmbed.html`
        <div class="title">
            <strong>${datum.lod}</strong>
        </div>
        <p class="summary">
            ${phos}
            ${protein}
            <strong>Gene ID</strong> ${datum.geneID}
            <br/>
            <strong>Symbol</strong> ${datum.geneSymbol}
            <br/>
            <strong>Gene Position</strong> ${datum.geneChr}:${datum.genePos.toLocaleString()}
            <br/>
            <strong>Marker Position</strong> ${datum.markerChr}:${datum.markerPos.toLocaleString()}
            ${AH}
        </p>`;
}

/**
 * Asynchronously generates tooltip content for phenotype-related LOD peaks data.
 * @param {Object} datum - Data object containing phenotype and LOD peak details.
 * @param {Object} mark - The visual representation of the data in the visualization (unused but required for interface consistency).
 * @param {Object} props - Additional properties related to the data point (unused but required for interface consistency).
 * @returns {Promise<string>} HTML content for the tooltip.
 */
async function lodPeakPhenotypeTooltipHandler(datum, mark, props) {
    logDebug('Phenotype tooltip handler:', datum);

    return genomeSpyEmbed.html`
        <div class="title">
            <strong>${datum.lod}</strong>
        </div>
        <p class="summary">
            <strong>ID</strong> ${datum.phenoDataName}
            <br/>
            <strong>Phenotype</strong> ${datum.phenoShortName}
            <br/>
            <strong>Category</strong> ${datum.phenoCategory}
            <br/>
            <strong>Marker Position</strong> ${datum.markerChr}:${datum.markerPos.toLocaleString()}
        </p>`;
}