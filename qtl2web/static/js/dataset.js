/**
         * Switch the datasets.
         *
         * @param {string} datasetID - the dataset identifier
         */
function switchDataSet(datasetID) {
    global.datasetID = datasetID;

    let html = `<div class="col">
                    <div class="jumbotron jumbotron-fluid" style="background: none">
                        <div class="container">
                            <h1 class="display-3">${mainTitle}</h1>
                            <p class="lead">Please search for a term of interest.</p>
                        </div>
                    </div>
                </div>`;

    $('#divWelcomeMesage').html(html);

    $('#divItemInfo').addClass('invisible').removeClass('visible');
    $('#divLOD').addClass('invisible').removeClass('visible');
    $('#divSecondRow').addClass('invisible').removeClass('visible');
    $('#divProfileCorrelation').addClass('invisible').removeClass('visible');
    $('#div_current_item_information_header').html('');
    $('#div_current_item_information_body').html('');
    $('#divProfilePlotOptions').html('');

    configureCovarInfo(true);

    setDataSet(datasetID, true);
}

/**
 * Display the gene information.
 * @param {Object} geneData - gene information
 */
function setDataSet(datasetID, force) {
    logDebug('setDataSet=', datasetID);

    if (!(force) && (global.datasetID === datasetID)) {
        logDebug('Same dataset selected, do nothing');
        return;
    }

    if (!isEmpty(global.currentDataset.lodpeaks)) {
        generateLODPeaksHTML();
    }


    let ds = global.getDataset(datasetID);
    global.setDatasetID(datasetID);

    $('#divGenome').html(`<b>${ds.display_name}</b> is utilizing Ensembl Release <b>${ds.ensembl.release}</b>, Genome <b>${ds.ensembl.assembly_patch}</b> <div style='height: 10px'></div>`);

    // clear LOD Plot
    // TODO: clear LOD PLOT, Profile PLOT
    global.chartCorrelation = null;
    $('#lodPlotChart').html('');
    $('#lodPlotChartCovariateFull').html('');
    $('#lodPlotChartCovariateDiff').html('');
    $('#correlationCovariateSelectionText').addClass('hidden').removeClass('visible');
    $('#correlationImputation').html('');

    resetSecondaryPlots();

    // make tabs invisible
    $('#navGene').hide();
    $('#navPheno').hide();
    if (isEmpty(global.currentDataset.lodpeaks)) {
        $('#navLodPeaks').hide();
    } else {
        $('#navLodPeaks').show();
    }


    // show correlation
    if (isEmpty(ds['covar_info'])) {
        $('#profilePlot a[href="#tabCorrelation"]').tab('show');
        $('#navProfile').hide();
    } else {
        $('#profilePlot a[href="#tabProfile"]').tab('show');
        $('#navProfile').show();
    }


    // show the correct tab
    if ((ds.datatype === 'mrna') || (ds.datatype === 'protein') || (ds.datatype === 'phos')) {
        $('#navGene').show();
        $('#navGene').tab('show');

        // show some secondary plots
        $('#navPlotMediation').show();

        // reset the screen
        $('#searchResultsDiv').html('');
        $('#searchResultsTableInfo').html('');

    } else if (ds.datatype === 'pheno') {
        $('#navPheno').show();
        $('#navPheno').tab('show');

        // hide some secondary plots

        // phenotype data can only mediate against mrna or protein (not itself)
        let showMed = false;
        $.each(global.DATASETS, function (k, v) {
            if ((v.datatype === 'mrna') || (v.datatype === 'protein') || (v.datatype === 'phos')) {
                showMed = true;
            }
        });

        if (showMed) {
            $('#navPlotMediation').show();
        } else {
            $('#navPlotMediation').hide();
        }

        $('#searchPheno').html('');
        $('#searchPhenoCategoryText').html('');
        $('#searchPhenoCategory').html('');
        $('#searchPhenoResultsInfo').html('');
        $('#searchPhenoResultsDiv').html('');

        //let numResults = ds.phenotypes.length;

        // transform the phenotypes into a different structure
        let categories = new Set([]);
        let newPhenotypes = [];
        $.each(ds.phenotypes, function (index, element) {
            if ((element['is_pheno']) && (element['is_numeric'])) {
                categories.add(element.category);
                element.display = element['short_name'];
                newPhenotypes.push({
                    phenotype_id: element['data_name'], // use for id
                    phenotype: element['short_name'],   // display on screen
                    category: element.category,
                    desc: element.description
                });
            }
        });

        // build the search area
        if (categories.size === 0) {
            logError('No categories - ERROR');
        } else {
            $('#searchPheno').html('<input type="text" id="searchTermPheno" name="searchTermPheno" class="form-control" placeholder="Please enter a phenotype to filter results...">');

            // build the phenotypes table
            $('#searchPhenoResultsDiv').html(`<table id="phenotypesTable" class="table table-striped table-hover table-sm table-bordered">
                                        <thead>
                                            <th style="background-color: #20a8d8" data-dynatable-sorts="Phenotype">Phenotype</th>
                                            <th style="display: none">category</th>
                                            <th style="display: none">desc</th>
                                        </thead>
                                        <tbody>
                                        </tbody>
                                    </table>`);

            global.phenoDynaTable = $('#phenotypesTable')
                .bind('dynatable:init', function (e, dynatable) {
                    dynatable.queries.functions.phenotype = function (record, queryValue) {
                        if ((record.phenotype.toLowerCase().indexOf(queryValue.toLowerCase()) !== -1) ||
                            (record.desc.toLowerCase().indexOf(queryValue.toLowerCase()) !== -1)) {
                            return true;
                        }
                    };
                }).dynatable({
                    dataset: {
                        records: newPhenotypes,
                    },
                    features: {
                        paginate: false,
                        pushState: false,
                        recordCount: true,
                        sort: true,
                        search: false,
                    },
                    inputs: {
                        recordCountPlacement: 'before',
                    },
                    writers: {
                        _rowWriter: function (rowIndex, record, columns, cellWriter) {
                            return `<tr><td><span class="font-weight-bold"><a href="#" phenotypeid="${record.phenotype_id}">${record.phenotype}</a></span><br><span class="font-italic">${record.category}</span><br><span class="font-weight-light">${record.desc}</span></td></tr>`;
                        }
                    },
                }).data('dynatable');

            // build the category select, if more than 1 category
            categories = Array.from(categories);

            if (categories.length > 1) {
                $('#searchPhenoCategoryText').html('Category Filter');

                let htmlOptions = '<select id="phenoCategorySelect" data-style="btn-secondary btn-sm" data-width="100%" class="selectpicker">';
                htmlOptions += '<option>All</option>';
                $.each(categories, function (i, val) {
                    htmlOptions += `<option>${val}</option>`;
                });
                htmlOptions += '</select>';
                $('#searchPhenoCategory').html(htmlOptions);

                $('#phenoCategorySelect').selectpicker();

                $('#phenoCategorySelect').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
                    let selected = $(this).find(':selected').val();
                    if (selected === 'All') {
                        global.phenoDynaTable.queries.remove('category');
                    } else {
                        global.phenoDynaTable.queries.add('category', selected);
                    }

                    global.phenoDynaTable.process();
                    $('#phenotypesTable tbody a').on('click', function (evt) {
                        evt.preventDefault();
                        let that = $(this);
                        selectPhenotype(that.attr('phenotypeid'), global.datasetID, $('#interactiveCovarLODS').val());
                        return false;
                    });
                });
            }

            $('#searchTermPheno').keyup(function (event) {
                if (event.which === 13) {
                    event.preventDefault();
                }
                let q = $(this).val();

                if (q === '') {
                    q = undefined;
                }

                if (q) {
                    global.phenoDynaTable.queries.add('phenotype', q);
                } else {
                    logDebug('removing');
                    global.phenoDynaTable.queries.remove('phenotype');
                }

                logDebug('global.phenoDynaTable.process()');
                global.phenoDynaTable.process();
                $('#phenotypesTable tbody a').on('click', function (evt) {
                    evt.preventDefault();
                    let that = $(this);
                    selectPhenotype(that.attr('phenotypeid'), global.datasetID, $('#interactiveCovarLODS').val());
                    return false;
                });

            });

            $('#phenotypesTable tbody a').on('click', function (evt) {
                evt.preventDefault();
                let that = $(this);
                selectPhenotype(that.attr('phenotypeid'), global.datasetID, $('#interactiveCovarLODS').val());
                return false;
            });
        }

    } else {
        // TODO: handle error
        logDebug('ERROR in setDataSet:', ds);
    }


    // hide or show the mediation based upon if there are datasets that can mediate against
    let allDS = [];
    $.each(global.DATASETS, function (key, value) {
        if (value.datatype !== 'pheno') {
            allDS.push(value);
        }
    });

    $('#divMediationSelect').html('');

    if (allDS.length === 1) {
        $('#divMediationSelect').html(`<p class="font-weight-bold">Mediating against: </p>${allDS[0]['display_name']}`);
        $('#divMediationSelect').append(`<input type="hidden" id="dsMediateAgainstID" value="${allDS[0].id}"/>`);
    } else if (allDS.length > 1) {

        let htmlMediate = `<div class="row">
                               <div class="col-auto align-self-center font-weight-bold">
                                   Mediate Against
                              </div>
                              <div class="col">
                                  <select id="dsMediateAgainstID" data-style="btn-secondary btn-sm" data-width="100%" class="selectpicker">`;

        $.each(allDS, function (idx, elem) {
            logDebug(idx, elem);
            if (elem.id === datasetID) {
                htmlMediate += `<option selected value="${elem.id}">${elem['display_name']}</option>`;
            } else {
                htmlMediate += `<option value="${elem.id}">${elem['display_name']}</option>`;
            }
        });
        htmlMediate += '</select></div></div>';

        $('#divMediationSelect').html(htmlMediate);
        $('#dsMediateAgainstID').selectpicker();
    }
}