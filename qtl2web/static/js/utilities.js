
/**
 * @fileoverview A collection of utility functions.
 */


/**
 * Checks if the provided parameter is considered "empty".
 * An object is considered empty if it is null or has no enumerable own properties.
 * @param {Object|null} obj - The object to check for emptiness.
 * @return {boolean} - True if the object is null or has no own properties, false otherwise.
 */
function isEmpty(obj) {
    // Directly return true if obj is null or is not an object.
    if (obj === null || typeof obj !== 'object') {
        return true;
    }

    // Check if the object has no own enumerable properties.
    return Object.keys(obj).length === 0;
}

/**
 * Simple compare function.
 * @param {Object} a The first object to compare.
 * @param {number} a.x Sub element x to compare.
 * @param {Object} b The second object to compare.
 * @param {number} b.x Sub element x to compare.
 * @returns {number} 0 if equal, 1 if a.x > b.x, -1 if a.x < b.x.
 */
function compareX(a, b) {
    if (a.x < b.x)
        return -1;
    if (a.x > b.x)
        return 1;
    return 0;
}


/**
 * Get a random integer between min and max.
 * @param {number} min The minimum number.
 * @param {number} max The maximum number.
 * @return {number} A number between min and max.
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/**
 * Permutate arrays.
 * Example:
 *     let p = permutateArrays(['1', '2', '3'], ['A', 'B']]);
 *     console.log(p);
 *     [['1', 'A'], ['1', 'B'],
 *      ['2', 'A'], ['2', 'B'],
 *      ['3', 'A'], ['3', 'B']]
 *
 * Adapted from:
 * https://stackoverflow.com/questions/15298912/javascript-generating-combinations-from-n-arrays-with-m-elements
 *
 * @param arraysToCombine {Array} - array of arrays
 * @returns {Array} permutated array
 */
function permutateArrays(arraysToCombine) {
    let divisors = [];
    for (let i = arraysToCombine.length - 1; i >= 0; i--) {
        divisors[i] = divisors[i + 1]
            ? divisors[i + 1] * arraysToCombine[i + 1].length
            : 1;
    }

    function getPermutation(n, arraysToCombine) {
        let result = [];
        let curArray;
        for (let i = 0; i < arraysToCombine.length; i++) {
            curArray = arraysToCombine[i];
            result.push(
                curArray[Math.floor(n / divisors[i]) % curArray.length]
            );
        }
        return result;
    }

    let numPerms = arraysToCombine[0].length;
    for (let i = 1; i < arraysToCombine.length; i++) {
        numPerms *= arraysToCombine[i].length;
    }

    let combinations = [];
    for (let i = 0; i < numPerms; i++) {
        combinations.push(getPermutation(i, arraysToCombine));
    }

    return combinations;
}


/**
 * Convert bytes into highest unit.
 * @param x {number} Array of numbers.
 * @returns {string} The converted bytes into the highest unit.
 */
function niceBytes(x) {
    let units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let l = 0;
    let n = parseInt(x, 10) || 0;

    while (n >= 1024 && ++l) {
        n = n / 1024;
    }

    return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]);
}


/**
 * Get the mean of an array of numbers.
 * @param data {Array[number]} Array of numbers.
 * @returns {number} The mean of data.
 */
function mean(data) {
    let len = data.length;
    let sum = 0;
    for (let i = 0; i < len; i++) {
        sum += parseFloat(data[i]);
    }
    return (sum / len);
}


/**
 * Because .sort() doesn't sort numbers correctly
 * @param a {number} The 1st number to compare.
 * @param b {number} The 2nd number to compare.
 * @returns {number} -1, 0, 1.
 */
function numSort(a, b) {
    return a - b;
}


/**
 * Get any percentile from an array.
 * @param data {Array} - array of numbers
 * @param percentile {number} - which percentile to get
 * @returns {number} the "percentile" of "data"
 */
function getPercentile(data, percentile) {
    data.sort(numSort);
    let index = (percentile / 100) * data.length;
    let result;
    if (Math.floor(index) === index) {
        result = (data[(index - 1)] + data[index]) / 2;
    }
    else {
        result = data[Math.floor(index)];
    }
    return result;
}


/**
 * Wrap the percentile calls in one method.
 * @param data {Array} - array of numbers
 * @returns {{low: number, q1: number, median: number, q3: number, high: number}}
 */
function getBoxValues(data) {
    let filteredData = [];

    $.each(data, function (idx, elem) {
        if (!isNaN(elem)) {
            filteredData.push(elem);
        }
    });

    return {
        low: Math.min.apply(Math, filteredData),
        q1: getPercentile(filteredData, 25),
        median: getPercentile(filteredData, 50),
        q3: getPercentile(filteredData, 75),
        high: Math.max.apply(Math, filteredData)
    };
}


/**************************************************************************
 **
 ** LAYOUT ALGORITHMS
 **
 *************************************************************************/

/**
 * Creates a new shelf with a specified width.
 * @param {number} width - The total width available on the shelf.
 * @return {Object} A shelf object with properties for width, free space, used space, and stored elements.
 */
function createShelf(width) {
    return {
        width: width,
        free: width,
        used: 0,
        elements: []
    };
}

/**
 * Adds items to shelves based on their dimensions and available shelf space, considering spacing constraints.
 * If items cannot fit on existing shelves, new shelves are created as needed.
 * @param {Array} shelves - An array of shelf objects that may already contain items.
 * @param {Array} items - An array of items to be added, where each item has 'start', 'end', and other relevant properties.
 * @param {number} width - The width of new shelves to be created if necessary.
 * @return {Array} An updated array of shelves with the new items added where possible.
 */
function addItems(shelves, items, width) {
    if (shelves.length === 0) {
        shelves.push(createShelf(width));
    }

    const spacing = 1000;
    // Sort items by their size (end - start) in descending order
    items.sort((a, b) => (b.position_end - b.position_start) - (a.position_end - a.position_start));

    for (const item of items) {
        let isItemShelved = false;

        for (const shelf of shelves) {
            if (shelf.free >= (item.end - item.start)) {
                let canFit = true;

                for (const element of shelf.elements) {
                    if (((item.start - spacing <= element.start) && (item.end + spacing >= element.start)) ||
                        ((item.start - spacing >= element.start) && (item.start - spacing <= element.end))) {
                        canFit = false;
                        break;
                    }
                }

                if (canFit) {
                    shelf.elements.push(item);
                    shelf.free -= (item.end - item.start);
                    shelf.used += (item.end - item.start);
                    isItemShelved = true;
                    break; // Item has been shelved, move to the next item
                }
            }
        }

        // Create a new shelf if the item wasn't shelved
        if (!isItemShelved) {
            const newShelf = createShelf(width);
            newShelf.elements.push(item);
            newShelf.free -= (item.end - item.start);
            newShelf.used += (item.end - item.start);
            shelves.push(newShelf);
        }
    }

    return shelves;
}


/**
 * Calculates the tick increment for a given range and count.
 * This function determines the appropriate step size between ticks on a scale.
 * @param {number} start - The start of the range.
 * @param {number} stop - The end of the range.
 * @param {number} count - The desired number of ticks.
 * @return {number} The calculated increment value between ticks.
 */
function calculateTickIncrement(start, stop, count) {
    const sqrt50 = Math.sqrt(50),
        sqrt10 = Math.sqrt(10),
        sqrt2 = Math.sqrt(2);

    let step = (stop - start) / Math.max(0, count);
    let power = Math.floor(Math.log(step) / Math.LN10);
    let error = step / Math.pow(10, power);

    let factor;
    if (error >= sqrt50) {
        factor = 10;
    } else if (error >= sqrt10) {
        factor = 5;
    } else if (error >= sqrt2) {
        factor = 2;
    } else {
        factor = 1;
    }

    if (power >= 0) {
        return factor * Math.pow(10, power);
    } else {
        return -Math.pow(10, -power) / factor;
    }
}

/**
 * Calculates an array of tick positions on a scale from start to stop with a specified count.
 * @param {number} start - The starting value of the scale.
 * @param {number} stop - The ending value of the scale.
 * @param {number} count - The desired number of ticks.
 * @return {Array<number>} An array of tick values.
 */
function calculateTicks(start, stop, count) {
    let reverse = false,
        step,
        n,
        ticks;

    start = +start;
    stop = +stop;
    count = +count;

    // Return a single tick if start equals stop and count is positive
    if (start === stop && count > 0) return [start];

    // Handle reverse ranges where stop is less than start
    if (stop < start) {
        reverse = true;
        [start, stop] = [stop, start];
    }

    step = calculateTickIncrement(start, stop, count);

    // Return empty array if step is 0 or not finite
    if (step === 0 || !isFinite(step)) return [];

    if (step > 0) {
        let r0 = Math.round(start / step),
            r1 = Math.round(stop / step);
        if (r0 * step < start) ++r0;
        if (r1 * step > stop) --r1;
        ticks = new Array(n = r1 - r0 + 1);
        for (let i = 0; i < n; i++) {
            ticks[i] = (r0 + i) * step;
        }
    } else {
        step = -step;
        let r0 = Math.round(start * step),
            r1 = Math.round(stop * step);
        if (r0 / step < start) ++r0;
        if (r1 / step > stop) --r1;
        ticks = new Array(n = r1 - r0 + 1);
        for (let i = 0; i < n; i++) {
            ticks[i] = (r0 + i) / step;
        }
    }

    // Reverse the ticks array if the original range was in reverse
    if (reverse) {
        ticks.reverse();
    }

    return ticks;
}

/////////
// Constants for base representations
const BASES_LIST = ['A', 'C', 'G', 'T'];
const CC = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Converts a number to a specified base.
 * @param {number} n - The number to convert.
 * @param {number} b - The base for conversion.
 * @return {string} - The number in the new base, as a string.
 */
function numberToBase(n, b) {
    if (n === 0) return '0';
    let digits = [];
    while (n > 0) {
        digits.push(n % b);
        n = Math.floor(n / b);
    }
    return digits.reverse().join('');
}

/**
 * Converts an SDP number to an 8-character SDP base-4 representation.
 * @param {number} sdpn - The SDP number to convert.
 * @param {number} fill - The fill length (default is -1, not used here).
 * @return {string} - The SDP in base-4, padded to 8 characters.
 */
function sdpn_to_sdpN(sdpn) {
    return numberToBase(sdpn, 4).padStart(8, '0');
}

/**
 * Converts an SDP base-4 string back to its numerical representation.
 * @param {string} sdpN - The SDP string in base-4.
 * @return {number} - The numeric representation of the SDP.
 */
function sdpN_to_sdpn(sdpN) {
    return parseInt(sdpN, 4);
}

/**
 * Converts an SDP number to a sequence of DNA bases.
 * @param {number} sdpn - The SDP number to convert.
 * @return {string[]} - An array of DNA bases corresponding to the SDP number.
 */
function sdpn_to_sdpB(sdpn) {
    const spdN = sdpn_to_sdpN(sdpn);
    return spdN.split('').map(digit => BASES_LIST[parseInt(digit)]);
}

/**
 * Converts an SDP number to a formatted string of DNA bases with associated indices.
 * @param {number} sdpn - The SDP number to convert.
 * @param {string[]} sort - Optional sorting array of bases.
 * @return {string} - A colon-separated string of DNA bases and their indices.
 */
function sdpn_to_sdpD(sdpn, sort = null) {
    const sdpB = sdpn_to_sdpB(sdpn);
    let l = {};

    sdpB.forEach((base, index) => {
        l[base] = l[base] ? l[base] + CC[index] : CC[index];
    });

    if (sort !== null) {
        return sort.map(base => l[base] || '').filter(v => v).join(':');
    } else {
        const sortedBases = Object.entries(l)
            .sort((a, b) => b[1].length - a[1].length)
            .map(entry => entry[1]);

        return sortedBases.join(':');
    }
}



/**
 * Downloads content as a file directly from the browser.
 * @param {string} content - The content to be downloaded.
 * @param {string} fileName - The filename for the downloaded file.
 * @param {string} mimeType - The MIME type of the file, defaults to 'application/octet-stream'.
 */
function downloadCSV(content, fileName, mimeType = 'application/octet-stream') {
    const blob = new Blob([content], { type: mimeType });

    // Check for MS IE specific blob save method
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, fileName);
    } else {
        const a = document.createElement('a');
        if ('download' in a) {
            // HTML5 download attribute is supported
            a.href = URL.createObjectURL(blob);
            a.setAttribute('download', fileName);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            // Fallback for browsers without support for download attribute
            location.href = `data:${mimeType},${encodeURIComponent(content)}`;
        }
    }
}
/**
 * Generates a random integer between the specified inclusive minimum and maximum.
 * @param {number} min - The minimum integer value in the range.
 * @param {number} max - The maximum integer value in the range.
 * @return {number} A random integer between min and max, inclusive.
 */
function randomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};


/**
 * Sorts the keys of the given object and returns a new object with sorted keys.
 * This function does not modify the original object but returns a new one where
 * the keys are sorted in ascending alphabetical order.
 *
 * @param {Object} obj - The object whose keys are to be sorted.
 * @return {Object} A new object with the same keys and values as the input, but with keys sorted.
 */
function sortObj(obj) {
    // Use Object.keys to get an array of the object's keys, then sort them alphabetically.
    return Object.keys(obj).sort().reduce((result, key) => {
        // Accumulate each key-value pair in 'result', preserving their original values.
        result[key] = obj[key];
        return result;
    }, {});
}