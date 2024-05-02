/**
 * Extends the jQuery $.ajax method to include a retry mechanism.
 * This enhancement allows specifying retries and retry intervals in the ajax settings.
 */
$.ajax = (($oldAjax) => {
    /**
     * Checks the outcome of the AJAX request and retries if not successful.
     * @param {any} a - First parameter (not explicitly used).
     * @param {string} b - Status of the AJAX call, indicating success or failure types.
     * @param {any} c - Third parameter (not explicitly used).
     */
    function check(a, b, c) {
        logDebug('CHECK', a, b, c);
        let shouldRetry = (b !== 'success' && b !== 'parsererror');
        if (shouldRetry && --this.retries > 0) {
            setTimeout(() => {
                $.ajax(this);
            }, this.retryInterval || 100);
        }
    }

    /**
     * Overrides the original $.ajax to add retry capability.
     * @param {Object} settings - The settings for the jQuery AJAX call.
     * @returns {jQuery.jqXHR} A jQuery jqXHR object that encapsulates the asynchronous request.
     */
    return settings => $oldAjax(settings).always(check);
})($.ajax);

/**
 * Usage Example:
 * $.ajax({
 *     type: 'GET',
 *     url: 'http://www.example.com',
 *     timeout: 2000,
 *     retries: 3, // Optional: Number of retries on failure
 *     retryInterval: 2000 // Optional: Time between retries in milliseconds
 * }).fail(console.warn); // 'fail' is called only once after all retries are exhausted
 */

/**
 * Extends jQuery to include a 'disable' method that can disable or enable elements.
 * This method can be used on form elements or any other element by toggling a 'disabled' class.
 */
jQuery.fn.extend({
    /**
     * Toggles the disabled state of elements or applies a 'disabled' class.
     * @param {boolean} state - True to disable the element, false to enable.
     * @returns {jQuery} Returns the jQuery object to maintain chainability.
     */
    disable: function(state) {
        return this.each(function() {
            let $this = $(this);
            if ($this.is('input, button, textarea, select')) {
                this.disabled = state;
            } else {
                $this.toggleClass('disabled', state);
            }
        });
    }
});
