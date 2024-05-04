 /**
 * Display the gene information.
 * @param {Object} geneData - gene information
 */
 function displayGeneData(geneDataMap) {
    let geneData = geneDataMap[Object.keys(geneDataMap)[0]];
    let htmlHeader = `${geneData.id} <em>${geneData.symbol}</em>`;
    let htmlBody = `<table class="table table-sm">
        <tr><td class="border-0"><strong>ID</strong></td><td class="border-0">${geneData.id}<br>
        <small><a target="_newwin" href="http://www.ensembl.org/id/${geneData.id}">Ensembl <i class="fas fa-external-link-alt" aria-hidden="true"></i></small></a>`;

    if (geneData.external_ids) {
        for (let elem of geneData.external_ids) {
            let url = '', urlDesc = '';
            switch (elem.db) {
                case 'EntrezGene':
                    url = `https://www.ncbi.nlm.nih.gov/gene/?term=${encodeURIComponent(elem.db_id)}`;
                    urlDesc = `NCBI Gene: ${elem.db_id}`;
                    break;
                case 'MGI':
                    url = `http://www.informatics.jax.org/marker/${encodeURIComponent(elem.db_id)}`;
                    urlDesc = elem.db_id;
                    break;
                case 'Uniprot_gn':
                    url = `https://www.uniprot.org/uniprot/${encodeURIComponent(elem.db_id)}`;
                    urlDesc = `Uniprot: ${elem.db_id}`;
                    break;
            }
            if (url) {
                htmlBody += ` <small><a target="_newwin" href="${url}">${urlDesc} <i class="fas fa-external-link-alt" aria-hidden="true"></i></small></a>`;
            }
        }
    }

    htmlBody += '</td></tr>';
    htmlBody += `<tr><td><strong>Symbol</strong></td><td>${geneData.symbol}</td></tr>`;
    htmlBody += `<tr><td><strong>Location</strong></td><td>${geneData.chromosome}:${geneData.start.toLocaleString()}-${geneData.end.toLocaleString()} (${geneData.strand})</td></tr>`;

    if (geneData.synonyms) {
        let synonyms = geneData.synonyms.join(', ');
        htmlBody += `<tr><td><strong>Synonyms</strong></td><td>${synonyms}</td></tr>`;
    }

    if (geneData.name) {
        htmlBody += `<tr><td><strong>Description</strong></td><td>${geneData.name}</td></tr>`;
    }

    htmlBody += '</table>';

    $('#div_current_item_information_header').html(htmlHeader);
    $('#div_current_item_information_body').html(htmlBody);
}


/**
 * Display the phenotype information for a given phenotype ID.
 * @param {string} phenoID - The ID of the phenotype to display information for.
 */
function displayPhenoData(phenoID) {
    let pheno = global.currentDataset.phenotypes[phenoID];

    if (!pheno) {
        logError(`Phenotype ID ${phenoID} not found in the dataset.`);
        $('#div_current_item_information_header').html('Error: Phenotype not found');
        $('#div_current_item_information_body').html('The requested phenotype information is unavailable.');
        return;
    }

    // Update the HTML content of the page elements to display phenotype information.
    $('#div_current_item_information_header').html(phenoID);
    $('#div_current_item_information_body').html(pheno.desc);
}