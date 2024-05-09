function plotSNPAssoc(snpData, geneRanking, geneInfo, id, chromosome, location, zoomWindow, domainWindow, covar) {
    logDebug('plotSNPAssoc', chromosome, location, covar);
    logDebug('geneRanking=', geneRanking);
    logDebug('geneInfo=', geneInfo);

    // combine the geneInfo and geneRanking
    let geneInformation = createGeneRankings(geneRanking, geneInfo);

    logDebug('geneInformation=', geneInformation);

    let minZoomPos = Math.max(location - zoomWindow, 0);
    let maxZoomPos = Math.min(location + zoomWindow, global.currentDataset.chromosomes.chr[chromosome].length);
    let minDomainPos = Math.max(location - domainWindow, 0);
    let maxDomainPos = Math.min(location + domainWindow, global.currentDataset.chromosomes.chr[chromosome].length);
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

    snpData.sort(function (a, b) {
        return a.pos - b.pos;
    });

    let snps = [];
    let snpsCovar = [];
    let snpsCovarTitle = '';

    if (snpData) {
        if ((covar !== null) && (covar !== 'additive')) {
            // grab the covar display name
            $.each(global.currentDataset['covar_info'], function (idx, elem) {
                if (covar === elem['sample_column']) {
                    snpsCovarTitle = 'LOD (' + elem['display_name'] + ')';
                }
            });
        }
    }

    /*
    0: SNP:  "rs12345678"
    1: CHR:  "3"
    2: POS:  118281232
    3: REF:  "C"
    4: ALT:  "T,G"
    5: SDPN: 21853
    6: CSQ:  "T||||intergenic_variant||||||||"
    7: LOD:  0.24

    IF covar:
    8: LODC: 0.0029
    */

    $.each(snpData, function (index, element) {
        let snp = {
            snp: element[0],
            chr: element[1],
            pos: element[2],
            ref: element[3],
            alt: element[4],
            sdpn: element[5],
            csq: element[6],
            lod: element[7] * 1.0,
            cov: covar
        };

        if ((covar !== null) && (covar !== 'additive')) {
            snp['lodc'] = element[8] * 1.0;
        }

        snps.push(snp);
    });
    let minLOD = snps.reduce((a, b) => a.lod < b.lod ? a : b).lod;
    let maxLOD = snps.reduce((a, b) => a.lod > b.lod ? a : b).lod;

    logDebug('minLOD=', minLOD);
    logDebug('maxLOD=', maxLOD);

    minLOD = Math.max(0, Math.floor(minLOD) - 1);
    maxLOD = Math.ceil(maxLOD) + 1;

    logDebug('minLOD=', minLOD);
    logDebug('maxLOD=', maxLOD);
    logDebug('minZoomPos', minZoomPos);
    logDebug('maxZoomPos', maxZoomPos);
    logDebug('minDomainPos', minDomainPos);
    logDebug('maxDomainPos', maxDomainPos);
    logDebug('#snps=', snps.length);
    logDebug('snps=', snps);
    logDebug('#snpsCovar=', snpsCovar.length);
    logDebug('snpsCovar=', snpsCovar);

    /**
     * BUILD GENOME SPY
     */

    let tracksAll = [];

    let layers = [];
    layers.push({
        "title": "SNPs",
        "mark": {
            "type": "point",
            "tooltip": {
                "handler": "snpHandler"
            },
            "geometricZoomBound": 4,
            "inwardStroke": true,
            "stroke": "#962e1e",
            "strokeWidth": 0.7,
            "fillOpacity": 0.6,
            "strokeOpacity": 0.8
        },

        "encoding": {
            "x": {
                "chrom": "chr",
                "pos": "pos",
                "type": "locus",
                "scale": {
                    "domain": [
                        {
                            "chrom": chromosome,
                            "pos": minDomainPos
                        },
                        {
                            "chrom": chromosome,
                            "pos": maxDomainPos
                        }
                    ],

                    "zoom": {
                        "extent": [
                            {
                                "chrom": chromosome,
                                "pos": minZoomPos
                            },
                            {
                                "chrom": chromosome,
                                "pos": maxZoomPos
                            }
                        ]
                    }
                }
            },
            "y": {
                "field": "lod",
                "type": "quantitative",
                "title": "LOD",
                "scale": { "domain": [minLOD, maxLOD] }
            },
            "color": {
                "value": "#f35137"
            },
            "size": {
                "value": 30
            },
            "opacity": {
                "value": 0.5
            },
        }
    }
    );

    if ((covar !== null) && (covar !== 'additive')) {
        layers.push({
            "title": "SNPs Covar",
            "mark": {
                "type": "point",
                "tooltip": {
                    "handler": "snpHandler"
                },
                "geometricZoomBound": 4,
                "inwardStroke": true,
                "stroke": "#113c65",
                "strokeWidth": 0.7,
                "fillOpacity": 0.6,
                "strokeOpacity": 0.8

            },

            "encoding": {
                "x": {
                    "chrom": "chr",
                    "pos": "pos",
                    "type": "locus",
                    "scale": {
                        "domain": [
                            {
                                "chrom": chromosome,
                                "pos": minDomainPos
                            },
                            {
                                "chrom": chromosome,
                                "pos": maxDomainPos
                            }
                        ],

                        "zoom": {
                            "extent": [
                                {
                                    "chrom": chromosome,
                                    "pos": minZoomPos
                                },
                                {
                                    "chrom": chromosome,
                                    "pos": maxZoomPos
                                }
                            ]
                        }
                    }
                },
                "y": {
                    "field": "lodc",
                    "type": "quantitative",
                    "title": "LOD",
                    "scale": { "domain": [minLOD, maxLOD] }
                },
                "color": {
                    "value": "#7cb5ec"
                },
                "size": {
                    "value": 30
                },
                "opacity": {
                    "value": 0.5
                },
            }
        }
        );

    }


    logDebug('layers=', layers);



    let trackSNPs = {
        "name": "snps",
        "data": {
            "values": snps
        },
        "layer": layers

    };
    //"value": "#7cb5ec"
    tracksAll.push(trackSNPs);

    let trackGenes = {
        "name": "geneAnnotations",

        "description": [
            "Ensimpl genes scored by their data values",
        ],

        //"height": { "px": 100 },
        "height": 70,

        "data": {
            "values": geneInformation,
        },

        "transform": [{
            "type": "linearizeGenomicCoordinate",
            "chrom": "chr",
            "pos": "start",
            "as": "_start"
        },
        {
            "type": "formula",
            "expr": "ceil(random() * 100)",
            "as": "score"
        },
        {
            "type": "formula",
            "expr": "datum._start + datum.length",
            "as": "_end"
        },
        {
            "type": "formula",
            "expr": "datum._start + datum.length / 2",
            "as": "_centroid"
        },
        {
            "type": "collect",
            "sort": {
                "field": ["_start"]
            }
        },
        {
            "type": "pileup",
            "start": "_start",
            "end": "_end",
            "as": "_lane",
            "preference": "strand",
            "preferredOrder": ["-", "+"]
        },
        {
            "type": "filter",
            "expr": "datum._lane < 5"
        }
        ],

        "encoding": {
            "y": {
                "field": "_lane",
                "type": "ordinal",
                "scale": {
                    "type": "index",
                    "align": 0,
                    "paddingInner": 0.4,
                    "paddingOuter": 0.2,
                    "domain": [0, 5],
                    "reverse": true,
                    "zoom": false
                },
                "axis": null
            }
        },
        "layer": [{
            "name": "transcripts",

            "opacity": {
                "unitsPerPixel": [100000, 40000],
                "values": [0, 1]
            },

            "encoding": {
                "color": {
                    "value": "#909090"
                }
            },

            "layer": [{
                "name": "exons",

                "transform": [{
                    "type": "project",
                    "fields": ["_lane", "_start", "exons"]
                },
                {
                    "type": "flattenCompressedExons",
                    "start": "_start"
                }
                ],

                "mark": {
                    "type": "rect",
                    "minOpacity": 0.2,
                    "minWidth": 0.5,
                    "buildIndex": true,
                    "tooltip": null
                },

                "encoding": {
                    "x": {
                        "field": "exonStart",
                        "type": "locus"
                    },
                    "x2": {
                        "field": "exonEnd"
                    }
                }
            },
            {
                "name": "bodies",

                "mark": {
                    "type": "rule",
                    "minLength": 0.5,
                    "size": 1,
                    "buildIndex": true,
                    "tooltip": null
                },
                "encoding": {
                    "x": {
                        "field": "_start",
                        "type": "locus",
                        "axis": null
                    },
                    "x2": {
                        "field": "_end"
                    },
                    "search": {
                        "field": "symbol",
                        "type": "nominal"
                    }
                }
            }
            ]
        },
        {
            "name": "symbols",

            "transform": [{
                "type": "measureText",
                "fontSize": 11,
                "field": "symbol",
                "as": "_textWidth"
            },
            {
                "type": "filterScoredLabels",
                "lane": "_lane",
                "score": "score",
                "width": "_textWidth",
                "pos": "_centroid",
                "padding": 5
            }
            ],

            "layer": [{
                "name": "labels",
                "mark": {
                    "type": "text",
                    "dynamicData": true,
                    "size": 11,
                    "yOffset": 7,
                    "tooltip": {
                        "handler": "ensimplTooltipHandler"
                    }
                },
                "encoding": {
                    "x": {
                        "field": "_centroid",
                        "type": "locus"
                    },
                    "text": {
                        "field": "symbol",
                        "type": "nominal"
                    }
                }
            },
            {
                "name": "arrows",
                "opacity": {
                    "unitsPerPixel": [100000, 40000],
                    "values": [0, 1]
                },
                "mark": {
                    "type": "point",
                    "dynamicData": true,
                    "yOffset": 7,
                    "size": 50,
                    "tooltip": null
                },
                "encoding": {
                    "x": {
                        "field": "_centroid",
                        "type": "locus"
                    },
                    "dx": {
                        "expr": "(datum._textWidth / 2 + 5) * (datum.strand == '-' ? -1 : 1)",
                        "type": "quantitative",
                        "scale": null
                    },
                    "color": {
                        "value": "black"
                    },
                    "shape": {
                        "field": "strand",
                        "type": "nominal",
                        "scale": {
                            "domain": ["-", "+"],
                            "range": ["triangle-left", "triangle-right"]
                        }
                    }
                }
            }]
        }
        ]
    };

    tracksAll.push(trackGenes);

    const spec = {
        "description": [
            "Put a description....",
            "Here if you would like to!"
        ],

        "genome": {
            "name": global.currentDataset.ensembl_species + " " + global.currentDataset.ensembl_release,
            "contigs": global.currentDataset.chromosomes.contigs
        },

        "resolve": {
            "scale": {
                "x": "shared",
            }
        },

        "vconcat": tracksAll
    };

    $('#snpWindowMenuShift').html(`
        <div class="col">
            <button id="snpShiftLeft" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Shift Plot Left</button>
        </div>
        <div class="col">
            <button id="snpShiftRight" class="btn btn-secondary float-right">Shift Plot Right <i class="fas fa-arrow-right"></i></button>
        </div>`);

    $('#snpShiftLeft').button().on('click', function (event) {
        logDebug(location);
        logDebug(id, chromosome, location - 2000000, covar);
        generateSNPAssocPlot(id, chromosome, location - 2000000, covar);
    });

    $('#snpShiftRight').button().on('click', function (event) {
        logDebug(location);
        logDebug(id, chromosome, location + 2000000, covar);
        generateSNPAssocPlot(id, chromosome, location + 2000000, covar);
    });

    $('#snpWindowMenu').append(`
        <div class="col text-center font-weight-bold">${plotTitle}
        <div class="dropdown dropleft float-right" id="snpMenuDropdown">
          <a class="text-secondary" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-expanded="false">
            <i class="fa-solid fa-bars"></i>
          </a>

          <div class="dropdown-menu" aria-labelledby="dropdownMenuLink">
            <a class="dropdown-item" id="snpDownloadPNG" style="font-size:11px !important">Download PNG image</a>
            <a class="dropdown-item" id="snpDownloadCSV" style="font-size:11px !important">Download CSV</a>
          </div>
        </div>


        <!--
        TODO: change to the following icon when we switch out of highcharts
        <i class="fa-solid fa-file-arrow-down float-right"></i>
        //-->

        </div>`);

    $("#snpDownloadPNG").click(function (event) {
        downloadGenomeSpy('#plotSNPAssociation', `${id}.png`, '255,255,255');
    });

    $("#snpDownloadCSV").click(function (event) {
        exportSNPAssocData(id, snps, geneInfo);
    });

    $('#plotSNPAssociation').height('500');

    genomeSpyEmbed.embed(
        document.querySelector("#plotSNPAssociation"),
        spec,
        {
            // Register the custom handler
            tooltipHandlers: {
                snpHandler: snpHandler,
                ensimplTooltipHandler: ensimplTooltipHandler
            }
        }
    );
}

/**
 * Start downloading snp
 */
function generateSNPAssocPlot(id, chromosome, location, covar) {
    // TODO: windowSize needs to be figured out
    let locationMb = location;

    // what data is retrieved
    // [locationMb - zoomWindow, locationMb + zoomWindow]
    let zoomWindow = 3000000;

    // what data is initially displayed
    // [locationMb - domainWindow, locationMb + domainWindow]
    let domainWindow = 500000;

    let minPos = Math.max(locationMb - zoomWindow, 0);
    let maxPos = locationMb + zoomWindow;

    logDebug('location=', location);
    logDebug('locationMb=', locationMb);
    logDebug('zoomWindow=', zoomWindow);
    logDebug('domainWindow=', domainWindow);
    logDebug('minPos=', minPos);
    logDebug('maxPos=', maxPos);

    let snpAssocURL = `${rBaseURL}/snpassoc?dataset=${global.datasetID}&id=${id}&chrom=${chromosome}&location=${locationMb}&window_size=${zoomWindow}`;
    let genesInfoURL = `${window.location.protocol}//${apiURL}/api/exon_info?release=${global.currentDataset.ensembl_release}&species=${global.currentDataset.ensembl_species}&chrom=${chromosome}`;

    if (covar !== 'additive') {
        snpAssocURL += `&intcovar=${covar}`;
    }

    if (rNumCores)
        snpAssocURL += `&cores=${rNumCores}`;


    let submitData = {
        urls: [{
            url_id: 'snpAssoc',
            url: snpAssocURL
        }, {
            url_id: 'genesInfoURL',
            url: genesInfoURL
        }]
    };

    logDebug('global.currentDataset.datatype.toLowerCase()=', global.currentDataset.datatype.toLowerCase());

    if (global.currentDataset.datatype !== 'pheno') {
        let genesRankingURL = `${rBaseURL}/rankings?dataset=${global.datasetID}&chrom=${chromosome}`;
        submitData['urls'].push({
            url_id: 'genesRankingURL',
            url: genesRankingURL
        });
    }

    logDebug('submitData=', submitData);

    startTask();

    // reset the chart and clear it

    $('#snpWindowMenuShift').html('');
    $('#snpWindowMenu').html('');
    $('#plotSNPAssociation').html('');

    $.ajax({
        type: 'POST',
        url: submitURL,
        contentType: 'application/json',
        data: JSON.stringify(submitData),
        retries: 3,
        retryInterval: 1000,
        success: function (data, status, request) {
            logDebug('data=', data);
            updateSNPAssocData(data.group_id, id, chromosome, locationMb, zoomWindow, domainWindow, covar);
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
function updateSNPAssocData(groupID, id, chromosome, location, zoomWindow, domainWindow, covar) {
    // send GET request to status URL
    logDebug('updateSNPAssocData: ', groupID);

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
                        logDebug(data.response_data);
                        $.each(data.response_data, function (key, value) {
                            if (value.status_code !== 200) {
                                errorMessages += (`<strong>${key}:</strong> ${value.response.error}<br>`);
                            }
                        });

                        if (errorMessages !== '') {
                            let message = `Unfortunately, there was a problem calculating the SNP Association Plot.`;
                            stopTask();
                            showErrorMessage(message, errorMessages);
                        } else {
                            // show result, there will be 2 datasets to get
                            let rankings = null;
                            if ('genesRankingURL' in data.response_data) {
                                rankings = data.response_data.genesRankingURL.response.result;
                            }

                            plotSNPAssoc(data.response_data.snpAssoc.response.result,
                                rankings,
                                data.response_data.genesInfoURL.response.genes,
                                id, chromosome, location, zoomWindow, domainWindow, covar);
                            stopTask();
                        }
                    }
                } else {
                    // rerun in 1 seconds
                    logDebug('Not done, keep checking...');
                    setTimeout(function () {
                        updateSNPAssocData(groupID, id, chromosome, location, zoomWindow, domainWindow, covar);
                    }, 1000);  // TODO: change to 1000 (1 second)
                }
            }
        });
    } else {
        // TODO: cleanup
        logDebug('canceling');
        let cancelURL = `${cancelBaseURL}${groupID}`;
        $.getJSON(cancelURL, function (data) {
            $('#snpWindowMenuShift').html('');
            $('#snpWindowMenu').html('');
            $('#plotSNPAssociation').html('');
        });
    }   
}

/**
 * Constructs gene information by assigning rankings and formatting exons.
 * @param {Array} geneRankings - Array of objects containing gene rankings.
 * @param {Array} geneInfo - Array of objects containing gene information.
 * @returns {Array} Updated gene information with rankings and formatted exons.
 */
function createGeneRankings(geneRankings, geneInfo) {
    // Create a map for quick lookup of rankings based on gene_id
    const rankings = geneRankings.reduce((acc, elem) => {
        acc[elem['gene_id']] = elem['ranking'];
        return acc;
    }, {});

    logDebug('rankings=', rankings);

    // Assign rankings to genes and convert exons array to comma-separated string
    return geneInfo.map(elem => ({
        ...elem,
        score: rankings[elem['id']] || randomInterval(10, 80),
        exons: elem['exons'].join(',')
    }));
}

/**
 * Handles the generation of HTML content based on the given SNP data.
 * Logs debug information, converts SDP and CSQ values, and dynamically generates HTML based on the presence of LODC.
 *
 * @param {Object} datum - The data containing SNP information.
 * @param {Object} mark - Additional marker information, not directly used in this function.
 * @param {Object} props - Additional properties, not directly used in this function.
 * @returns {String} HTML content representing the SNP data.
 */
async function snpHandler(datum, mark, props) {
    logDebug(datum, mark, props);  // Log debug information

    // Convert SDPN to SDPD and parse CSQ values.
    const sdp = sdpn_to_sdpD(datum.sdpn);
    const csq = parseCSQ(datum.csq);

    // Generate and return HTML content based on whether 'lodc' is present in the data.
    if ('lodc' in datum) {
        return genomeSpyEmbed.html`
            <div class="title">
                <strong>${datum.snp}</strong>
            </div>
            <p class="summary">
                <strong>Position</strong> ${datum.chr}:${datum.pos.toLocaleString()}
                <br/>
                <strong>REF</strong> ${datum.ref}
                <br/>
                <strong>ALT</strong> ${datum.alt}
                <br/>
                <strong>SDP</strong> ${sdp}
                <br/>
                <strong>CSQ</strong> ${csq}
                <br/>
                <strong>LOD</strong> ${datum.lod}
                <br/>
                <strong>LOD ${datum.cov}</strong> ${datum.lodc}
            </p>`;
    } else {
        return genomeSpyEmbed.html`
            <div class="title">
                <strong>${datum.snp}</strong>
            </div>
            <p class="summary">
                <strong>Position</strong> ${datum.chr}:${datum.pos.toLocaleString()}
                <br/>
                <strong>REF</strong> ${datum.ref}
                <br/>
                <strong>ALT</strong> ${datum.alt}
                <br/>
                <strong>SDP</strong> ${sdp}
                <br/>
                <strong>CSQ</strong> ${csq}
                <br/>
                <strong>LOD</strong> ${datum.lod}
            </p>`;
    }
}

// TODO: Switch to LRU cache for better performance
const symbolSummaryCache = new Map();

/**
 * Fetches and displays tooltip information for genes from the Ensimpl database, using a Map for caching to optimize repeated queries.
 * This function fetches gene summary only if it's not already present in the cache, enhancing efficiency.
 *
 * @param {Object} datum - The data object containing gene identifiers.
 * @param {Object} mark - Marker information, not directly used in this function.
 * @param {Object} params - Additional parameters, not directly used in this function.
 * @returns {Promise<String|null>} HTML content for the tooltip, or null if no data is found.
 */
async function ensimplTooltipHandler(datum, mark, params) {
    const ensembl_id = datum.id;

    // Attempt to retrieve the gene summary from cache; fetch from API if not found.
    let summary = symbolSummaryCache.get(ensembl_id);
    if (!summary) {
        try {
            summary = await debouncedFetchEnsimplSummary(ensembl_id);
            if (summary) {
                symbolSummaryCache.set(ensembl_id, summary);  // Cache the fetched summary
                logDebug('Fetched and cached new summary for:', ensembl_id);
            }
        } catch (error) {
            logDebug('Error fetching Ensimpl summary for:', ensembl_id, error);
            return null;  // Return null if there is an error during fetch
        }
    } else {
        logDebug('Retrieved summary from cache for:', ensembl_id);
    }

    // If summary is available, construct and return the HTML content.
    if (summary) {
        const e = global.currentDataset.ensembl_version;
        return genomeSpyEmbed.html`
            <div class="title">
                <strong>${summary.id}</strong>
            </div>
            <p class="summary">
                <strong>Symbol</strong> ${summary.symbol}
                <br/>
                <strong>Name</strong> ${summary.name}
                <br/>
                <strong>Location</strong> ${summary.chromosome}:${summary.start}-${summary.end}
            </p>
            <p class="source">
                Source: Ensimpl ${e}
            </p>
        `;
    } else {
        return null;
    }
}


/**
 * Parses a CSQ (Consequence) string from genomic data, extracting unique consequence types.
 * The input string is expected to be semicolon-separated entries, with each entry containing
 * data fields separated by '|'. The consequence data is assumed to be in the 5th field (0-indexed),
 * and multiple consequences in a field are separated by '&'.
 *
 * @param {string} strCSQ - The CSQ string to be parsed.
 * @returns {string} A comma-separated string of unique consequences.
 */
function parseCSQ(strCSQ) {
    if (strCSQ.length <= 1) {
        return "";
    }

    const consequences = new Set();
    const csq_info_split = strCSQ.split(';');

    csq_info_split.forEach(info => {
        const consequenceData = info.split('|')[4];
        if (consequenceData) { // Ensure the consequence data exists
            consequenceData.split('&').forEach(consequence => consequences.add(consequence));
        }
    });

    return Array.from(consequences).join(', ');
}

const debouncedFetchEnsimplSummary = debounce(fetchEnsimplSummary, 500);

/**
 * Creates a debounced version of a function that delays invoking `func` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @param {boolean} rejectOnDebounce - If true, rejects the promise on a subsequent call during the wait time.
 * @returns {Function} A new debounced function.
 */
function debounce(func, wait, rejectOnDebounce = true) {
    let timeout;
    let rejectPrevious = _ => undefined;

    return function debouncer(...args) {
        return new Promise((resolve, reject) => {
            const later = () => {
                clearTimeout(timeout);
                rejectPrevious = _ => undefined;
                resolve(func(...args));
            };

            if (rejectOnDebounce) {
                rejectPrevious("debounced");
            }
            clearTimeout(timeout);
            rejectPrevious = reject;
            timeout = setTimeout(later, wait);
        });
    };
}

/**
 * Asynchronously fetches the Ensimpl summary for a given Ensembl ID.
 * @param {string} ensemblID - The Ensembl ID to fetch the summary for.
 * @returns {Promise<Object|null>} A promise resolving to the gene summary or null if an error occurs.
 */
async function fetchEnsimplSummary(ensemblID) {
    logDebug("Searching: " + ensemblID);
    const ensembl = global.currentDataset.ensembl_version;
    const opts = {};

    try {
        const response = await fetch(`https://${apiURL}/api/gene/${ensemblID}?species=Mm&release=${ensembl}`, opts);
        const searchResult = await response.json();
        if ('message' in searchResult) {
            throw new Error(searchResult.message);
        }
        return searchResult['gene'][ensemblID];
    } catch (error) {
        logError(`Fetching gene summary failed: ${error.message}`);
        return null;
    }
}

/**
 * Exports SNP association data as a CSV file.
 * @param {string} id - Identifier for the dataset.
 * @param {Array} snps - Array of SNP objects containing id, chromosome (chr), position (pos), alleles, consequence (csq), and LOD score.
 * @param {Array} genes - (Unused) Array of gene data, potentially for future use.
 */
function exportSNPAssocData(id, snps, genes) {
    const header = `"id","chr","position","alleles","csq","lod"\n`;
    const rows = snps.map(snp => `"${snp.id}","${snp.chr}",${snp.pos},"${snp.alleles}","${snp.csq}",${snp.lod}`).join('\n');
    const csvContent = header + rows;

    downloadCSV(csvContent, `${id}_SNPASSOC.csv`, 'text/csv;encoding:utf-8');
}
