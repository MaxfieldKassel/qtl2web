
// Define logDebug based on the debugMode flag
const logDebug = debugMode ? console.log.bind(window.console) : () => {};
const logInfo = console.info.bind(window.console);
const logWarning = console.warn.bind(window.console);
const logError = console.error.bind(window.console);

