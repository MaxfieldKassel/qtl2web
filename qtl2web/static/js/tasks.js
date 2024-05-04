/**
 * Starts a task, setting the global runningTask flag to true and displaying a processing dialog.
 */
function startTask() {
    global.runningTask = true;
    // Display a processing dialog
    Swal.fire({
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        buttonsStyling: false,
        html: $('#ap').html(),
        showConfirmButton: false,
        showCancelButton: false,
        showCloseButton: true,
        title: 'Processing...',
        width: '20rem'
    }).then((result) => {
        logDebug('then called');
        // If the dialog is closed, stop the task
        if (result.dismiss === 'close') {
            stopTask();
        }
    });
}

/**
 * Stops a task, setting the global runningTask flag to false and closing the processing dialog.
 */
function stopTask() {
    global.runningTask = false;
    // Close the processing dialog
    Swal.close();
}


/**
 * Handles the response from the server for any data status check.
 *
 * @param {Object} data - The data returned from the server.
 * @param {Function} onSuccess - Function to execute on successful data processing.
 * @param {Function} onError - Function to execute on encountering errors.
 */
function handleTaskResponse(data, onSuccess, onError) {
    logDebug('DATA=======', data);
    if (data.status === 'DONE') {
        if ('error' in data) {
            stopTask();
            showErrorMessage(`Unfortunately, there was a problem contacting the server. Please try again.`, null);
        } else if (data.number_tasks_errors !== 0) {
            processErrors(data, onError);
        } else {
            onSuccess(data);
        }
    } else {
        logDebug('Task not done, retrying...');
        onError();
    }
}

/**
 * Processes and displays errors from task data.
 *
 * @param {Object} data - The task data containing potential errors.
 * @param {Function} retryCallback - Function to retry the task.
 */
function processErrors(data, retryCallback) {
    let errorMessages = '';
    $.each(data.response_data, (key, value) => {
        if ('error' in value) {
            errorMessages += `<strong>${key}:</strong> ${value.error}<br>`;
        }
    });

    if (errorMessages) {
        stopTask();
        showErrorMessage(`Unfortunately, we encountered an error. Please try again.`, errorMessages);
    } else {
        retryCallback();
    }
}

/**
 * Checks the response status codes and processes successful responses.
 *
 * @param {Object} data - Data containing response statuses for tasks.
 * @param {Function} onSuccess - Callback to execute if response codes are satisfactory.
 */
function checkResponseStatus(data, onSuccess) {
    let errorMessages = '';
    $.each(data.response_data, (key, value) => {
        if (value.status_code !== 200) {
            errorMessages += `<strong>${key}:</strong> ${value.response.error}<br>`;
        }
    });

    if (errorMessages) {
        stopTask();
        showErrorMessage(`Unfortunately, there was a problem processing your request.`, errorMessages);
    } else {
        onSuccess(data);
    }
}

/**
 * Displays an error message using a modal popup with an optional detailed section that can be toggled.
 * The modal popup prevents interaction with the underlying page until it is closed.
 * 
 * @param {string} message - The main error message to be displayed.
 * @param {string|null} details - Optional detailed information about the error, which can be null if not applicable.
 */
function showErrorMessage(message, details) {
    // Base HTML for displaying the main error message.
    let baseErrorHtml = `
        <div class="row text-left">
            <div class="col">
                <span class="font-weight-bold text-danger">${message}</span>
            </div>
        </div>`;

    // Initializes an empty string for additional error details, if any.
    let detailsHtml = '';
    if (details !== null) {
        // HTML content for the detailed section, which is collapsible.
        detailsHtml = `
            <div class="row row-spacer"></div>
            <div class="row text-left">
                <div class="col">
                    <div id="errorDetailAccordion" data-children=".item">
                        <div class="item">
                            <a class="text-danger" data-toggle="collapse" data-parent="#errorDetailAccordion" href="#errorDetailAccordion1" role="button" aria-expanded="true" aria-controls="errorDetailAccordion1">
                                Details
                            </a>
                            <div id="errorDetailAccordion1" class="collapse" role="tabpanel">
                                <p class="mb-3">${details}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    // Concatenates the base error message HTML with the details HTML.
    const errorHtml = baseErrorHtml + detailsHtml;

    // Configuration for the Swal.fire modal popup.
    Swal.fire({
        allowEnterKey: false,      // Prevents closing or interacting with the modal by pressing the Enter key.
        allowEscapeKey: false,     // Prevents closing the modal by pressing the Escape key.
        allowOutsideClick: false,  // Prevents closing the modal by clicking outside of it.
        buttonsStyling: false,     // Disables default styling for buttons within the modal.
        html: errorHtml,           // Inserts the error HTML into the modal.
        showCancelButton: false,   // Hides the cancel button.
        showCloseButton: true,     // Shows a close button at the top corner of the modal.
        showConfirmButton: false,  // Hides the confirm button.
        title: '<i class="fas fa-exclamation-circle"></i> Error!' // Sets the title of the modal with an icon.
    });
}
