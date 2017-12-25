'use strict'

module.exports = {
    'env': 'development',
    'host': process.env.DB_HOST || 'projectw-hub-dev-db.cpt9pnrzxvzd.us-east-1.rds.amazonaws.com',
    'user': process.env.DB_USER || 'AQICAHhQLavbN6FJqVGpniLKspBcEk3gZ2+OZ+jxLrsBI7iWcgHnmW1HybP84SmQEh28AaxaAAAAZDBiBgkqhkiG9w0BBwagVTBTAgEAME4GCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMGC9IlaTBrurVDkoNAgEQgCFKmuhNScll+MkTgK6D6SbAjRkFEeQktU/gVZZsOL1Qq18=',
    'password': process.env.DB_PASSWORD || 'AQICAHhQLavbN6FJqVGpniLKspBcEk3gZ2+OZ+jxLrsBI7iWcgH8MLEMZtBQ7eSI3yeQWIbkAAAAZjBkBgkqhkiG9w0BBwagVzBVAgEAMFAGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMh+o15cXr99HgvK9uAgEQgCPbm+SafPaMj3uDW/crIfT8jwEarVy8js3NHW4+YS+QNoYEYA==',
    'database': process.env.DB_NAME || 'projectw_hub_dev_db',
    'region':process.env.AWS_REGION || 'us-east-1'
}