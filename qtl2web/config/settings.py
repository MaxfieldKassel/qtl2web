###############################################################################
#
# This file is replaced by project.viewer.settings in the Docker container
#
###############################################################################


###############################################################################
#
# API CONFIGURATION
#
###############################################################################

API_R_BASE = 'http://qtl2rest:8001'

###############################################################################
#
# DISPLAY CONFIGURATION (Overrides)
#
###############################################################################

# HTML PAGE TITLE
MAIN_TITLE = 'QTL Viewer'

# NAV TEXT
NAV_TITLE = 'QTL Viewer'
NAV_DATASET = 'Current Data Set'

# OPENING PAGE TEXT
JUMBO_TITLE = 'QTL Viewer'
JUMBO_TEXT = 'Please search for a term of interest.'

# SEARCH SECTION
TAB_SEARCH_MRNA_PROTEIN_TEXT = 'Search'
TAB_SEARCH_PHENOTYPE_TEXT = 'Phenotypes'
TAB_LOD_PEAKS_TEXT = 'LOD Peaks'
SEARCH_BOX_TEXT = 'Please type a term to search for...'

# LOD CARD
LOD_CARD_TITLE = 'LOD Plot'

# TAB PROFILE/CORRELATION
TAB_PROFILE_PLOT_TEXT = 'Profile Plot'
TAB_CORRELATION_TEXT = 'Correlation'

CORRELATION_SELECT_DATASET_TEXT = 'Select Correlation Dataset'
CORRELATION_BUTTON_DOWNLOAD_TEXT = 'Download Correlations'
CORRELATION_SELECT_COVARIATE_TEXT = 'Covariate Adjustment'
CORRELATION_SELECT_ID_TEXT = 'Select an ID from above to plot the correlation data.'
CORRELATION_SELECT_SERIES_TEXT = 'Select a series to color'

TAB_EFFECT_PLOT_TEXT = 'Effect'
TAB_MEDIATION_PLOT_TEXT = 'Mediation'
TAB_SNP_ASSOCIATION_TEXT = 'SNP Association'

SWITCH_BLUP_TEXT = 'Best Linear Unbiased Predictors (BLUPs)'

CREATED_BY_TEXT = 'Created by'

# FOOTER
LAB_URL = 'http://churchill-lab.jax.org'
LAB_NAME = 'The Churchill Lab'

CHROMOSOMES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
               '11', '12', '13', '14', '15', '16', '17', '18', '19',
               'X']

#PLOT_LOD_LINES = [
#    {'val':6.52, 'color':'#DAA520', 'text':'80%'},
#    {'val':7.38, 'color':'red', 'text':'95%'}
#]

PLOT_LOD_XAXIS_TEXT = 'LOD'

PLOT_EFFECT_STRAINS = [
    {'key':'A', 'color':"#f9c922", 'name':"A/J"},
    {'key':'B', 'color':"#888888", 'name':"C57BL/6J"},
    {'key':'C', 'color':"#F08080", 'name':"129S1/SvImJ"},
    {'key':'D', 'color':"#0064C9", 'name':"NOD/ShiLtJ"},
    {'key':'E', 'color':"#7FDBFF", 'name':"NZO/H1LtJ"},
    {'key':'F', 'color':"#2ECC40", 'name':"CAST/EiJ"},
    {'key':'G', 'color':"#FF4136", 'name':"PWK/PhJ"},
    {'key':'H', 'color':"#B10DC9", 'name':"WSB/EiJ"}
]


LOGIN_REQUIRED=False
LOGIN_USERID='ADMIN'
LOGIN_PASSWORD='PASSWORD'


PLOT_BLUP = False

API_R_NUM_CORES = 5

CELERY_RESULT_BACKEND = 'redis://redis:6379/0'
CELERY_BROKER_URL = 'redis://redis:6379/0'

LOG_LEVEL = 'DEBUG' # CRITICAL / ERROR / WARNING / INFO / DEBUG

COMPRESS_MIMETYPES = [
    'text/html',
    'text/css',
    'text/xml',
    'application/json',
    'application/javascript'
]


