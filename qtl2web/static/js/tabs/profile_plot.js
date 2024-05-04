/**
 * Exports profile data to a CSV file, including sample IDs, expressions, and additional factors.
 * Each factor is represented as a column in the resulting CSV.
 *
 * @param {string} id - Identifier for the data set, used to name the download file.
 * @param {Object} data - Object containing an array of data, each item is an object with properties for sample_id, expression, and any factors.
 * @param {Array} factors - Array of objects representing factors to be included in the CSV. Each factor has a 'display_name' and a 'sample_column' property.
 */
function exportProfileData(id, data, factors) {
    // Initialize CSV content with headers
    let csvContent = '"sample_id","expression"';
    
    // Add factor names as additional column headers
    $.each(factors, function(k, v) {
        csvContent += `,"${v['display_name']}"`;
    });
    csvContent += '\n';  // End of header row

    // Add data rows for each sample
    $.each(data.data, function(k, v) {
        // Start with sample ID and expression value
        let line = `"${v['sample_id']}",${v.expression}`;

        // Append each factor value for the current sample
        $.each(factors, function(fk, fv) {
            line += `,"${v[fv['sample_column']]}"`;
        });

        // Add the completed line to the CSV content
        csvContent += `${line}\n`;
    });

    // Trigger the download of the CSV file
    downloadCSV(csvContent, `${id}_PROFILE.csv`, 'text/csv;encoding:utf-8');
}

/**
 * Retrieves an ordered list of selected factor values from a select dropdown.
 * The factors are sorted based on a custom order attribute.
 * 
 * @returns {Array<string>} An array of strings representing the ordered factor values.
 */
function getFactorOrder() {
    // Extract selected options along with their order attributes
    let selected = $('#factor-view-select option:selected').map(function() {
        return {
            value: $(this).val(),
            order: parseInt($(this).attr('order'))
        };
    }).get();

    // Sort selected items based on the order attribute
    selected.sort((a, b) => a.order - b.order);

    // Extract and return only the values, now in the correct order
    return selected.map(item => item.value);
}


/**
 * Renders a profile plot with options for categorization and coloring based on factors.
 * The function integrates data transformation and visualization using Highcharts.
 *
 * @param {string} id - The unique identifier for the plot, used in data export and axis labeling.
 */
function plotProfile(id) {
    logDebug(`plotProfile(${id})`);

    let data = global.expressionData;
    let ds = global.currentDataset;

    // Determine selected covariates for plotting; use user-selected order if available
    let selectedCovars = isEmpty(ds['covar_info']) ? null : getFactorOrder();
    logDebug('selectedCovars=', selectedCovars);

    // Determine the series to be colored by
    let seriesToColor = $('#factorSeries').find(':selected').val();
    logDebug('seriesToColor=', seriesToColor);

    if (!selectedCovars || selectedCovars.length === 0) {
        // Handle cases with no covariate factors
    } else {
        // Map sample columns to their display names
        let columnToDisplayName = {};
        $.each(ds['covar_info'], function (idx, elem) {
            columnToDisplayName[elem['sample_column']] = elem['display_name'];
        });

        // Prepare titles and covariate permutations for charting
        let title = selectedCovars.map(elem => columnToDisplayName[elem]);
        let covarPermutations = permutateArrays(selectedCovars.map(elem => data.datatypes[elem]));
        logDebug('covarPermutations=', covarPermutations);

        // Track category names and their indices
        let categoryData = {};
        let covarCategories = covarPermutations.map((elem, idx) => {
            let catName = elem.join(':');
            categoryData[catName] = [];
            return catName;
        });

        // Organize series data by the selected coloring factor
        let seriesData = {};
        $.each(data.datatypes[seriesToColor], function (idx, val) {
            seriesData[val] = { values: [] };
        });

        // Populate series data and category data
        $.each(data.data, function (idx, val) {
            if (val.expression !== undefined) {
                let categoryKey = selectedCovars.map(v => val[v]).join(':');
                seriesData[val[seriesToColor]].values.push({
                    x: covarCategories.indexOf(categoryKey),
                    y: val.expression,
                    obj: val
                });
                categoryData[categoryKey].push(val.expression);
            }
        });

        // Prepare boxplot and scatter series
        let colors = ['#ed3215', '#7cb5ec', '#8085e9', '#f7a35c', '#90ed7d', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'];
        let series = Object.keys(seriesData).map((key, index) => ({
            data: seriesData[key].values,
            name: key,
            marker: { radius: 2 },
            color: colors[index % colors.length],
            jitter: { x: 0.24 },
            zIndex: 10
        }));

        // Compute and add boxplot data
        let boxSeries = Object.keys(categoryData).map(key => {
            let boxValues = getBoxValues(categoryData[key]);
            return { ...boxValues, x: covarCategories.indexOf(key), name: key, enableMouseTracking: false };
        });

        series.push({
            type: 'boxplot',
            data: boxSeries,
            showInLegend: false,
            zIndex: 1,
        });

        // Setup chart export options
        let exporting = appendExportButton('Download CSV', function () {
            exportProfileData(id, data, ds['covar_info']);
        });
        exporting.filename = id + '_PROFILE';

        // Render chart
        Highcharts.chart({
            chart: {
                type: 'scatter',
                renderTo: 'profilePlotChart',
            },
            title: { text: title.join(' x '), verticalAlign: 'bottom' },
            xAxis: { categories: covarCategories, labels: { rotation: -45 } },
            yAxis: { title: { text: id } },
            series: series,
            exporting: exporting,
            plotOptions: {
                boxplot: {
                    color: '#000000', enableMouseTracking: false, lineWidth: 1,
                    medianColor: '#000000', medianWidth: 1, stemColor: '#000000',
                    stemWidth: 1, whiskerColor: '#000000', whiskerLength: '50%', whiskerWidth: 1
                },
                scatter: {
                    tooltip: {
                        headerFormat: null,
                        outside: true,
                        pointFormatter: function () {
                            let hoverText = `<b>${this.obj['sample_id']}</><br><p>${this.obj.expression}</p>`;
                            $.each(data.datatypes, (i, e) => {
                                hoverText += `<br><p>${columnToDisplayName[i]}: ${this.obj[i]}</p>`;
                            });
                            return hoverText;
                        }
                    }
                }
            }
        });
    }
}
