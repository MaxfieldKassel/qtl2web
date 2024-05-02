/**
 * Extends Highcharts to include custom methods for exporting charts as SVG.
 * Each method is documented to provide clarity on its purpose and usage.
 */

/**
 * Gathers SVG data from an array of charts and returns a combined SVG using a callback.
 * @param {Array} charts - Array of Highcharts chart objects.
 * @param {Object} options - Configuration options for exporting SVG.
 * @param {Function} callback - Callback to handle the resulting SVG.
 */
Highcharts.getSVG = function (charts, options, callback) {
    console.log('getSVG options=', options);
    var svgArr = [],
        top = 0,
        width = 0;

    // Helper function to extract and transform SVG from individual charts.
    function addSVG(svgRes) {
        let svgWidth = +svgRes.match(/^<svg[^>]*width\s*=\s*\"?(\d+)\"?[^>]*>/)[1];
        let svgHeight = +svgRes.match(/^<svg[^>]*height\s*=\s*\"?(\d+)\"?[^>]*>/)[1];

        let svg = svgRes.replace('<svg', '<g transform="translate(0,' + top + ')" ');
        svg = svg.replace('</svg>', '</g>');
        top += svgHeight;
        width = Math.max(width, svgWidth);
        svgArr.push(svg);
    }

    // Recursively exports each chart and accumulates their SVG.
    function exportChart(i) {
        if (i === charts.length) {
            return callback('<svg height="' + top + '" width="' + width +
                '" version="1.1" xmlns="http://www.w3.org/2000/svg">' + svgArr.join('') + '</svg>');
        }
        charts[i].getSVGForLocalExport(options, {}, function () {
            console.error("Failed to get SVG");
        }, function (svg) {
            addSVG(svg);
            exportChart(i + 1);
        });
    }

    exportChart(0);
};

/**
 * Exports an array of charts into an SVG file and initiates a download.
 * @param {Array} charts - Array of Highcharts chart objects.
 * @param {Object} options - Configuration options for exporting.
 */
Highcharts.exportCharts = function (charts, options) {
    console.log('Initial export options:', options);
    options = Highcharts.merge(Highcharts.getOptions().exporting, options);
    console.log('Merged export options:', options);

    Highcharts.getSVG(charts, options, function (svg) {
        Highcharts.downloadSVGLocal(svg, options, function () {
            console.error("Failed to export on client side");
        });
    });
};

/**
 * Adds a custom button to the Highcharts export menu.
 * @param {string} myText - Title for the custom button.
 * @param {Function} myFunction - Handler function to execute on button click.
 * @return {Object} Object containing the updated buttons for Highchart export.
 */
function appendExportButton(myText, myFunction) {
    let defaultButtons = Highcharts.getOptions().exporting.buttons;
    let myButtons = $.extend(true, {}, defaultButtons);

    myButtons.contextButton.menuItems.push({
        text: myText,
        onclick: myFunction
    });

    return {
        buttons: myButtons
    };
}
