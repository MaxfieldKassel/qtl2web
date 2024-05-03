class Global {
    constructor() {
        this.init();
    }

    init() {
        this.DATASETS = {}; //TODO: switch to a class to make it more readable
        this.ENSEMBL_RELEASE = null;     // Ensembl release for Ensimpl API
        this.SPECIES_ID = 'Mm';          // TODO: do not hard code species
        this.ENSIMPL = null;             // Ensimpl API
        this.CHROMOSOMES = null;         // All chromosome information
        this.PLOT_COLORS = [
            "#3d7cb9", "#c50004", "#38be2f", "#8085e9", "#91e8e1",
            "#f7a35c", "#f15c80", "#deca00", "#2b908f", "#434348"
        ];

        // Current selected information
        this.datasetID = null;           // Selected dataset id
        this.geneID = null;              // Selected gene id
        this.proteinID = null;           // Selected protein id
        this.phenotypeID = null;         // Selected phenotype id
        this.gene = null;                // Selected gene information
        this.correlationDatasetID = null; // Selected correlation dataset id
        this.correlationData = null; 
        this.currentCorrelateID = null;
        this.correlationChartData = null;

        // Interactive stored data
        this.LODChartData = {};
        this.interactiveCovariates = null;  // List of covariates for current dataset
        this.phenoDynaTable = null;
        this.expressionData = null;
        this.orderCount = null;
        this.chartCorrelation = null;

        // For tasks
        this.runningTask = false;
    }

    // Method to reset all properties to their initial values
    reset() {
        this.init();
    }


    /**
     * Adds a new dataset to the global datasets object.
     * @param {Object} dataset - The dataset object to add, must contain an 'id' property.
     */
    addDataset(dataset) {
        if (dataset && dataset.id) {
            this.DATASETS[dataset.id] = dataset;
        } else {
            logError("Dataset must have an 'id' property.");
        }
    }



    /**
     * Resets all datasets stored in the global object to an empty object.
     */
    resetDatasets() {
        this.DATASETS = {};
    }

    /**
     * Retrieves a dataset by its ID from the global datasets.
     * @param {string} datasetID - The ID of the dataset to retrieve.
     * @return {Object|null} The dataset object if found, otherwise null.
     */
    getDataset(datasetID) {
        return this.DATASETS[datasetID] || null;
    }

    /**
     * Gets the current dataset based on the stored datasetID.
     * @return {Object|null} The current dataset object if found, otherwise null.
     */
    get currentDataset() {
        return this.getDataset(this.datasetID);
    }

    /**
     * Gets the current correlation dataset based on the stored correlationDatasetID.
     * @return {Object|null} The current correlation dataset object if found, otherwise null.
     */
    get currentCorrelationDataset() {
        return this.getDataset(this.correlationDatasetID);
    }

    /**
     * Checks if a dataset exists within the global datasets by its ID.
     * @param {string} datasetID - The ID of the dataset to check.
     * @return {boolean} True if the dataset exists, false otherwise.
     */
    datasetExists(datasetID) {
        return !!this.DATASETS[datasetID];
    }

    /**
     * Sets the current dataset ID and logs an error if the ID is not valid.
     * @param {string} datasetID - The ID of the dataset to set as current.
     */
    setDatasetID(datasetID) {
        this.datasetID = datasetID;
        if (!this.datasetExists(datasetID)) {
            logError("Invalid dataset id: " + datasetID);
            logInfo("Available datasets: ", Object.keys(this.DATASETS));
        }
    }

}