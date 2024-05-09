/**
 * Perform gene search and handle the UI state accordingly.
 * @param {string} searchVal - The search string input by the user.
 */
function findGene(searchVal) {
    let term = $('#searchTerm');
    term.prop('disabled', true);

    if (!searchVal) {
        term.focus().prop('disabled', false);
        return;
    }

    const options = {
        species: global.currentDataset.ensembl_species,
        release: global.currentDataset.ensembl_release,
        limit: 100,
        greedy: true
    };

    logDebug(options);
    startTask();
    global.ENSIMPL.search(searchVal, options, searchCallback);
}


/**
 * Processes the search callback by populating the search results based on the response.
 * If no matches are found, the function will reset the UI and show a message.
 */
function searchCallback() {
    logDebug(global.ENSIMPL);

    if (!global.ENSIMPL.response.result.matches) {
        $('#searchResultsDiv').empty();
        $('#btnGo').button('reset');
        $('#searchTerm').prop('disabled', false);
        $('#searchResultsTableInfo').text('No results found');
        stopTask();
        return;
    }

    const response = global.ENSIMPL.response;
    const currentDataSet = global.currentDataset;
    const searchResults = [];

    response.result.matches.forEach(match => {
        match.match = currentDataSet.gene_ids.hasOwnProperty(match.ensembl_gene_id);
        match.datatype = currentDataSet.datatype;

        if (match.match) {
            match.protein_ids = currentDataSet.gene_ids[match.ensembl_gene_id].protein_ids;
        }

        searchResults.push(match);
    });

    // build and update the results table
    const tableHtml = generateResultsTableHtml(searchResults);
    $('#searchResultsDiv').html(tableHtml);
    attachTableEvents(); // Handles events such as clicks on table rows
    stopTask();

    // Handling special case: if only one result, simulate click
    if (searchResults.length === 1) {
        $('#searchResultsTable a').first().click();
    }

    initializeDataTable();
}

/**
 * Generates the HTML for the results table based on the search results.
 * This function maps over each record in the search results to create table rows.
 * @param {Array} searchResults - The array of search result objects.
 * @returns {string} A string containing the HTML representation of the results table.
 */
function generateResultsTableHtml(searchResults) {
    return `<table id="searchResultsTable" class="table table-striped table-hover table-sm table-bordered" style="font-size:0.85rem">
                <thead>
                    <th data-dynatable-no-sort></th>
                    <th data-dynatable-sorts="ID">ID</th>
                    <th>Symbol</th>
                </thead>
                <tbody>
                    ${searchResults.map(record => generateRowHtml(record)).join('')}
                </tbody>
            </table>`;
}

/**
 * Generates the HTML for a single row in the results table based on a record.
 * This function checks if there is a match for the record and adjusts the HTML content accordingly.
 * @param {Object} record - The individual search result record, containing necessary data like gene ID and symbol.
 * @returns {string} A string containing the HTML for one row of the results table.
 */
function generateRowHtml(record) {
    let rowHtml = `<tr><td><i id="matchInfo" geneID="${record.ensembl_gene_id}" class="fas fa-info-circle"></i></td>`;

    if (record.match) {
        rowHtml += `<td><span><a href="#" geneID="${record.ensembl_gene_id}">${record.ensembl_gene_id}</a></span></td>`;
    } else {
        rowHtml += `<td><span>${record.ensembl_gene_id}</span></td>`;
    }

    rowHtml += `<td>${record.symbol}</td></tr>`;
    return rowHtml;
}

/**
 * Attaches click event handlers to links in the results table.
 * When a link is clicked, it prevents the default action and triggers a custom function to handle gene, protein, or phosphorylation ID selection.
 * This setup facilitates interaction with the search results.
 */
function attachTableEvents() {
    $('#searchResultsTable a').on('click', function (evt) {
        evt.preventDefault();
        const { geneid, proteinid, phosid } = $(this).data();
        selectGeneProtein(geneid, proteinid, phosid, global.datasetID, $('#interactiveCovarLODS').val());
        return false;
    });
}

/**
 * Initializes a DataTable for the search results table.
 * This configuration disables various default features like pagination and filtering to suit specific requirements.
 * The table is designed to handle a potentially large number of entries without performance issues, using a fixed scroll area.
 */
function initializeDataTable() {
    $('#searchResultsTable').DataTable({
        info: false,
        filter: false,
        scrollY: "300px",
        false: true,
        order: [],
        paging: false
    });
}