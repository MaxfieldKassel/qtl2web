/**
 * Download data from a specified URL and handle the response.
 * Uses jQuery's AJAX method to perform the GET request.
 *
 * From the d3.js documentation:
 * - When a task completes, it must call the provided callback.
 * - The first argument to the callback should be null if the task is successful, or the error if the task failed.
 * - The optional second argument to the callback is the return value of the task.
 *   (To return multiple values from a single callback, wrap the results in an object or array.)
 *
 * @param {string} URL - the URL to download data
 * @param {string} description - descriptive text for logging
 * @param {function} callback - the callback function to handle the response
 */
function downloadData(URL, description, callback) {
    logDebug('Downloading:', description, 'from', URL);

    $.ajax({
        url: URL,
        method: 'GET',
        dataType: 'json'  // Assuming the data expected is JSON. Modify as needed.
    }).done(function(data) {
        logInfo(`Successful download of ${description}.`);
        logDebug('Data:', data);

        
        // Enhance data with additional metadata
        data._url = URL;
        data._description = description;

        // Successful callback with data
        callback(null, data);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        logError(`Error downloading ${description} from ${URL}: ${textStatus} - ${errorThrown}`);
        
        // Error callback with the error provided
        callback(errorThrown, null);
    });
}

/**
 * Download chromosomes
 * @param release
 * @param species
 * @param _id
 * @param callback
 */
function downloadChromosomes(release, species, _id, callback) {
    let chromosomeURL = chromosomeBaseURL;
    let amp = '';

    if (release !== null) {
        chromosomeURL += `?release=${release}`;
        amp = '&';
    }

    if (species !== null) {
        chromosomeURL += `${amp}species=${species}`;
    }

    downloadData(chromosomeURL, `Chromosomes ${_id}`, callback);
}

/**
 * Download LOD Peaks
 * @param dataSetID
 * @param callback
 */
function downloadLODPeaks(dataSetID, callback) {
    let lodPeaksURL = `${lodPeaksBaseURL}?dataset=${dataSetID}`;
    downloadData(lodPeaksURL, 'LODPeaks', callback);
}

/**
 * Download environmental information
 * @param callback
 */
function downloadEnvInfo(callback) {
    downloadData(envInfoURL, 'envInfo', callback);
}

/**
 * Download data sets
 * @param callback
 */
function downloadDataSets(callback) {
    downloadData(dataSetsURL, 'dataSets', callback);
}