function exportLODChartData(id, data, covar, exportName) {
    let csvContent = '"id","chromosome","position","lod"\n';
    $.each(data, function (k, v) {
        csvContent += `"${v.id}","${v.chr}",${v.chrPos},${v.y}\n`;
    });

    if (exportName !== null) {
        downloadCSV(csvContent, `${id}_LOD_${covar}_${exportName}.csv`, 'text/csv;encoding:utf-8');
    } else {
        downloadCSV(csvContent, `${id}_LOD.csv`, 'text/csv;encoding:utf-8');
    }
}

/**
 * Plot the LOD chart.
 *
 * @param {Array} dataLOD Array of objects containing LOD scores.
 * @param {string} covar The covariate (additive) for default.
 * @param {Array} dataDiff Array of covariate objects containing LOD score.
 */
function plotLODChart(dataLOD, covar, dataDiff) {
    // "1_3000000", "1", 3, 1.4975
    let maxLOD = -Infinity;
    let minLOD = Infinity;
    let xAxisTitle = '';
    let xAxisSubTitle = '';
    let newLodData = [];
    let currentID = null;
    let isCovar = false;
    let renderTo = 'lodPlotChart';
    let lineColor = 'black';
    let isFull = true;
    let exportName = null;

    if (covar !== 'additive') {
        isCovar = true;
        renderTo = 'lodPlotChartCovariateFull';
        exportName = 'FULL';

        if (dataDiff !== null) {
            lineColor = '#146582';
            isFull = false;
            renderTo = 'lodPlotChartCovariateDiff';
            exportName = 'DIFF';
        }
    } else {
        //
    }

    logDebug('dataLOD=', dataLOD);
    logDebug('covar=', covar);
    logDebug('dataDiff=', dataDiff);
    logDebug('renderTo=', renderTo);

    if (dataLOD !== null) {
        maxLOD = dataLOD[0][3];
        minLOD = -2;

        if (global.currentDataset.datatype === 'mrna') {
            currentID = global.geneID;
            xAxisTitle = global.geneID + ' (' + global.gene.gene[global.geneID].symbol + ')';
        } else if (global.currentDataset.datatype === 'protein') {
            currentID = global.proteinID;
            xAxisTitle = global.proteinID + ' (' + global.gene.gene[global.geneID].symbol + ')';
        } else if (global.currentDataset.datatype === 'phos') {
            currentID = global.phosID;
            xAxisTitle = global.phosID;
        } else if (global.currentDataset.datatype === 'pheno') {
            // pheno
            xAxisTitle = global.phenotypeID;
            currentID = global.phenotypeID;
            if (currentID !== global.currentDataset.phenotypes[currentID]['short_name']) {
                xAxisTitle += (' (' + global.currentDataset.phenotypes[currentID]['short_name'] + ')');
            }
        } else {
            // TODO: handle error
            logError('MAJOR PROBLEM');
        }

        if (isCovar) {
            xAxisSubTitle = `${covar} ${exportName}`;
        }

        $.each(dataLOD, function (index, element) {
            //
            // element = {"[id]","[chr]",[position],[data]}
            //
            if (element[1] in global.currentDataset.chromosomes.chr) {

                let chr = global.currentDataset.chromosomes.chr[element[1]];
                let x = chr.start + element[2];
                let y = element[3];

                if (!isFull) {
                    y = y - dataDiff[index][3];
                }

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
                maxLOD = Math.max(element[3], maxLOD);
            }
        });

        logDebug('MAX LOD = ', maxLOD);

        maxLOD = Math.ceil(maxLOD) + 1;

        logDebug('MAX LOD = ', maxLOD);
    }

    newLodData.sort(compareX);

    logDebug('newLodData=', newLodData);

    //
    // build the vertical chromosome bars
    //
    let chromosomeAxisVals = [];
    let chromosomeAxisText = {};
    let chromosomeBands = [];

    $.each(global.currentDataset.chromosomes.idx, function (index, element) {

        chromosomeAxisVals.push(element.mid);
        chromosomeAxisText[element.mid] = element.chromosome;

        // TODO: style this
        let fillColor = '#eeeeee';
        if ((index % 2) === 1) {
            chromosomeBands.push({
                color: fillColor,
                from: element.start,
                to: element.end
            });

            logDebug(fillColor);
        }
    });

    let plotShapes = [];
    let plotAnnotations = [];
    let _plotLines = [];

    if (plotLODLines) {
        // Generate the lineVals array from plotLODLines
        let lineVals = plotLODLines.map(l => ({
            val: l.val,
            color: l.color,
            text: l.text
        }));

        // Generate the _plotLines array for plotting configurations
        _plotLines = plotLODLines.map(l => ({
            value: l.val,
            color: l.color,
            zIndex: 5,
            width: 2,
            label: {
                text: l.text,
                align: 'right'
            }
        }));

        // Create shapes and annotations based on lineVals
        lineVals.forEach(line => {
            plotShapes.push({
                type: 'line',
                xref: 'paper',
                x0: 0,
                y0: line.val,
                x1: 1,
                y1: line.val,
                line: {
                    color: line.color,
                    width: 1.5
                },
                layer: 'above',
            });

            plotAnnotations.push({
                x: 1,
                y: line.val,
                xref: 'paper',
                yref: 'y',
                text: line.text,
                xanchor: 'left',
                yanchor: 'middle',
                showarrow: false,
            });
        });
    }


    let exporting = appendExportButton('Download CSV', function () {
        exportLODChartData(currentID, newLodData, covar, exportName);
    });

    exporting.filename = currentID + '_LOD';

    if (isCovar) {
        exporting.filename = `${currentID}_LOD_${covar}_${exportName}`;
    }


    let series = {
        boostThreshold: 1,
        color: lineColor,
        data: newLodData,
        name: covar,
        lineWidth: 0.5,
        marker: {
            enabled: false
        },
        showInLegend: false,
        turboThreshold: 0,
        type: 'line',
    };

    let chartLOD = Highcharts.chart({
        boost: {},
        chart: {
            alignTicks: false,
            renderTo: renderTo,
            zoomType: 'x',
            events: {
                click: function (event) {
                    if (event.target.tagName === 'tspan') {
                        // do not generate secondary plot for user clicking "Reset zoom"
                        return;
                    }

                    let plot = $('#secondaryPlotTabs').find('.active').attr('id');
                    let markerID = this.hoverPoint.id;
                    let chromosome = this.hoverPoint.chr;
                    let location = this.hoverPoint.chrPos;
                    let covar = this.hoverPoint.covar;


                    logDebug('event', markerID, chromosome, location, this.hoverPoint.covar);

                    generateSecondaryPlot(plot, currentID, markerID, chromosome, location, covar);
                }
            }
        },
        exporting: exporting,
        plotOptions: {
            series: {
                findNearestPointBy: 'xy',
                cursor: 'pointer',
                events: {
                    click: function (event) {
                        logDebug('plotOptions, series', event);

                        let plot = $('#secondaryPlotTabs').find('.active').attr('id');
                        let markerID = event.point.id;
                        let chromosome = event.point.chr;
                        let location = event.point.chrPos;
                        let covar = event.point.covar;

                        logDebug('series', markerID, chromosome, location, event.point.covar);

                        generateSecondaryPlot(plot, currentID, markerID, chromosome, location, covar);

                    }
                }
            }
        },

        series: [series],
        title: {
            text: xAxisTitle
        },
        subtitle: {
            text: xAxisSubTitle
        },
        tooltip: {
            outside: true,
            /*
            positioner: function(labelWidth, labelHeight, point) {
                let tooltipX, tooltipY;
                let chart = chartLOD;

                if (point.plotX + labelWidth > chart.plotWidth) {
                    tooltipX = point.plotX + chart.plotLeft - labelWidth - 20;
                } else {
                    tooltipX = point.plotX + chart.plotLeft + 20;
                }

                if (point.plotY + labelHeight > chart.plotHeight) {
                    tooltipY = point.plotY + chart.plotTop - labelHeight - 20;
                } else {
                    tooltipY = point.plotY + chart.plotTop - 20;
                }

                return {
                    x: tooltipX,
                    y: tooltipY
                };
            },
            */
            useHTML: true,
            formatter: function () {
                let p = this.point;
                return `<b>${p.id}</b><br/>LOD: ${p.y}<br/>Position: ${p.chr}:${p.chrPos.toLocaleString()}`;
            }
        },
        xAxis: {
            opposite: true,
            gridLineWidth: 0,
            labels: {
                formatter: function () {
                    return chromosomeAxisText[this.value];
                }
            },
            tickPositions: chromosomeAxisVals,
            plotBands: chromosomeBands,

        },
        yAxis: {
            min: 0,
            max: maxLOD,
            title: {
                text: 'LOD'
            },
            plotLines: _plotLines
        },
    });
}