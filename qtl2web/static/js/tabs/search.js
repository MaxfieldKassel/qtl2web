/**
         * Perform gene search.
         */
function findGene(searchVal) {
    //let button = $('#btnGo');
    let term = $('#searchTerm');
    term.disable(true);
    //button.button('loading');

    if (searchVal.length === 0) {
        term.focus();
        term.disable(false);
        //button.button('reset');
        return;
    }

    let options = {
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
 * Populate the search results.
 */
function searchCallback() {
    logDebug(global.ENSIMPL);

    if (global.ENSIMPL.response.result.matches === null) {
        $('#searchResultsDiv').html('');
        $('#btnGo').button('reset');
        $('#searchTerm').disable(false);
        $('#searchResultsTableInfo').html('No results found');
        stopTask();
        return;
    }

    let response = global.ENSIMPL.response;
    let currentDataSet = global.currentDataset;
    let searchResults = [];
    let searchResultsObj = {};


    $.each(response.result.matches, function(idx, match) {

        match['match'] = match.ensembl_gene_id in currentDataSet.gene_ids;
        match['datatype'] = currentDataSet.datatype;

        if ((currentDataSet.datatype === 'protein') && (match.match)) {
            match['protein_ids'] = currentDataSet.gene_ids[match.ensembl_gene_id].protein_ids;
        } else if ((currentDataSet.datatype === 'phos')  && (match.match)) {
            match['protein_ids'] = currentDataSet.gene_ids[match.ensembl_gene_id].protein_ids;
        }

        searchResults.push(match);
        searchResultsObj[match.ensembl_gene_id] = match;
    });

    // build the results table
    $('#searchResultsDiv').html(`<table id="searchResultsTable" class="table table-striped table-hover table-sm table-bordered" style="font-size:0.85rem">
                                <thead>
<th data-dynatable-no-sort></th>
                                    <th data-dynatable-sorts="ID">ID</th>
<th >Symbol</th>
<!--
                                    <th style="display: none">category</th>
                                    <th style="display: none">desc</th>
//--->
                                </thead>
                                <tbody>
                                </tbody>
                            </table>`);

    $('#searchResultsTable')
        .dynatable({
            dataset: {
                records: searchResults,
            },
            features: {
                paginate: false,
                pushState: false,
                recordCount: true,
                sort: false,
                search: false,
            },
            inputs: {
                recordCountPlacement: 'before',
            },
            writers: {
                _rowWriter: function(rowIndex, record, columns, cellWriter) {
                    let html = `<tr><td><i id="matchInfo" geneID="${record.ensembl_gene_id}" class="fas fa-info-circle"></i></td>`;

                    if (record.datatype === 'mrna') {
                        if (record.match) {
                            html += `<td><span><a href="#" geneID="${record.ensembl_gene_id}">${record.ensembl_gene_id}</a></span></td>`;
                        } else {
                            html += `<td><span>${record.ensembl_gene_id}</span></td>`;
                        }

                    } else if (record.datatype === 'protein') {
                        html += `<td style="white-space: nowrap;"><span>${record.ensembl_gene_id}</span>`;

                        if (record.match) {
                            html += '<br/>';
                            let proteins = [];
                            for (let p in record.protein_ids) {
                                proteins.push(`<span style="padding-left: 5px;"><i class="fa-solid fa-turn-up fa-rotate-90"></i> <a href="#" geneID="${record.ensembl_gene_id}" proteinID="${record.protein_ids[p]}">${record.protein_ids[p]}</a></span>`);
                            }
                            html += proteins.join('<br/>');
                        }

                        html += '</td>';
                    } else if (record.datatype === 'phos') {
                        html += `<td style="white-space: nowrap;"><span>${record.ensembl_gene_id}</span>`;

                        if (record.match) {
                            html += '<br/>';
                            let proteins = [];
                            for (let p in record.protein_ids) {
                                let protein_id = record.protein_ids[p];

                                let phos = [];
                                for (let j in currentDataSet.protein_ids[protein_id]?.phos_ids) {
                                    let ph = currentDataSet.protein_ids[protein_id].phos_ids[j];
                                    let ph_id = ph.split('_')[1];
                                    phos.push(`<span style="padding-left: 25px;"><i class="fa-solid fa-turn-up fa-rotate-90"></i> <a href="#" geneID="${record.ensembl_gene_id}" proteinID="${protein_id}" phosID="${ph}">${ph_id}</a>`);
                                }

                                proteins.push(`<span style="padding-left: 5px;"><i class="fa-solid fa-turn-up fa-rotate-90"></i> ${protein_id}</span><br/>` + phos.join('<br/>'));
                            }
                            html += proteins.join('<br/>');
                        }



                        html += '</td>';
                    }

                    html += `<td>${record.symbol}</td></tr>`;

                    return html;
                }
            },
        }).data('dynatable');


    $('#searchResultsTable a').on('click', function (evt) {
        let that = $(this);
        evt.preventDefault();
        selectGeneProtein(that.attr('geneid'), that.attr('proteinid'), that.attr('phosid'), global.datasetID, $('#interactiveCovarLODS').val());
        return false;
    });

    setTimeout(function () {
        $('[id="matchInfo"]').each(function (idx, elem) {
            $(this).popover({
                placement: 'right',
                html: true,
                trigger: 'hover',
                container: 'body',
                sanitize: false,
                content: function () {

                    let d = searchResultsObj[this.getAttribute('geneid')];


                    let h = `<table class="table table-sm">
                                <tr><td><strong>Symbol</strong> </td><td>${d.symbol}</td></tr>
                                <tr><td><strong>Location</strong> </td><td>${d.chromosome}:${d.position_start.toLocaleString()}-${d.position_end.toLocaleString()}</td></tr>
                                <tr><td><strong>Name</strong> </td><td>${d.name}</td></tr>
                                <tr><td><strong>Synonyms</strong> </td><td>`;

                    let s = d.synonyms;
                    if (s) {
                        if (s.length > 5) {
                            let s2 = s.slice(1, 6);
                            h += s2.join('<br>');
                            h += '<br><i>(' + (s.length - s2.length) + ' more synonyms)</i>';
                        } else {
                            h += s.join('<br>');
                        }
                    }
                    h += `</td></tr>
                          <tr><td><strong>Match Reason</strong> </td><td>${d.match_reason}</td></tr>
                          <tr><td><strong>Match Value</strong> </td><td>${d.match_value}</td></tr>
                          </table>`;

                    return h;
                }
            });
        });

    });
    $('#btnGo').button('reset');
    $('#searchTerm').disable(false);

    stopTask();

    // simulate a click event if the search yields only 1 result
    if ($('#searchResultsTable a').length === 1) {
        $('#searchResultsTable a')[0].click();
    }

    $('#searchResultsTable').DataTable({
        "info": false,
        "filter": false,
        "scrollY": "300px",
        "false": true,
        "order": [],
        "paging": false,
    });
}