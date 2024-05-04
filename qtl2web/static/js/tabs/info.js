 /**
         * Display the gene information.
         * @param {Object} geneData - gene information
         */
 function displayGeneData(geneData) {
    // TODO: link to database based upon ensembl version?

    for(let key in geneData) {
        geneData = geneData[key];
    }

    let startFormat = geneData.start.toLocaleString();
    let endFormat = geneData.end.toLocaleString();
    let strand = geneData.strand;
    let htmlHeader = geneData.id;
    htmlHeader += ` <em>${geneData.symbol}</em>`;

    let htmlBody = '<table class="table table-sm">';
    htmlBody += `<tr><td class="border-0"><strong>ID</strong></td><td class="border-0">${geneData.id}`;
    htmlBody += '<br>';
    htmlBody += `<small><a target="_newwin" href="http://www.ensembl.org/id/${geneData.id}">Ensembl <i class="fas fa-external-link-alt" aria-hidden="true"></i></small></a>`;

    $.each(geneData.external_ids, function(idx, elem) {
        let url = '';
        let urlDesc = '';

        if (elem.db === 'EntrezGene') {
            url = `https://www.ncbi.nlm.nih.gov/gene/?term=${elem.db_id}`;
            urlDesc = `NCBI Gene: ${elem.db_id}`;
        } else if (elem.db === 'MGI') {
            url = `http://www.informatics.jax.org/marker/${elem.db_id}`;
            urlDesc = `${elem.db_id}`;
        } else if (elem.db === 'Uniprot_gn') {
            url = `https://www.uniprot.org/uniprot/${elem.db_id}`;
            urlDesc = `Uniprot: ${elem.db_id}`;
        }

        if (url !== '') {
            htmlBody += ` <small><a target="_newwin" href="${url}">${urlDesc} <i class="fas fa-external-link-alt" aria-hidden="true"></i></small></a>`;
        }
    });

    htmlBody += '</td></tr>';
    htmlBody += `<tr><td><strong>Symbol</strong></td><td>${geneData.symbol}</td></tr>`;
    htmlBody += `<tr><td><strong>Location</strong></td><td>${geneData.chromosome}:${startFormat}-${endFormat} (${strand})</td></tr>`;

    if (geneData.synonyms !== undefined) {
        let synonyms = geneData.synonyms.join(', ');
        htmlBody += `<tr><td><strong>Synonyms</strong></td><td>${synonyms}</td></tr>`;
    }

    if (geneData.name) {
        htmlBody += `<tr><td><strong>Description</strong></td><td>${geneData.name}</td></tr>`;
    }

   /*
    let ensembl = global.currentDataset.ensembl;
    htmlBody += `<tr><td><strong>Source</strong></td><td><a target="_newwin" href="${ensembl.url}">Ensembl ${ensembl.release}<i class="fas fa-external-link-alt" aria-hidden="true"></i>, ${ensembl.assembl_patch}</td></tr>`;
    htmlBody += '</table>';
    */

    $('#div_current_item_information_header').html(htmlHeader);
    $('#div_current_item_information_body').html(htmlBody);
}

/**
 * Display the pheno information.
 * @param {Object} geneData - gene information
 */
function displayPhenoData(phenoID) {
    let pheno = global.currentDataset.phenotypes[phenoID];
    $('#div_current_item_information_header').html(phenoID);
    $('#div_current_item_information_body').html(pheno.desc);
}