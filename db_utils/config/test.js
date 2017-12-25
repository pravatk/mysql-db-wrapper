'use strict'
/**
 * Environment variables for local testing.
 */
module.exports = {
    'env': 'local',
    'host': process.env.DB_HOST || 'kickdrum.ccv0t8bhxaj4.us-east-1.rds.amazonaws.com',
    'user': process.env.DB_USER || 'AQICAHiH13KUFzsgYLKk0P7SlDYjzrHAX/LIGrIoyKRnIOlcfgGUJupSH5/iHhpN5/3bq2XrAAAAZDBiBgkqhkiG9w0BBwagVTBTAgEAME4GCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMdDJEb3Xw4XCklR6YAgEQgCFQaMs7J7RFCraqHfe5mc4zfyfuPR5ZYlKaFIf7ZuqL9wk=',
    'password': process.env.DB_PASSWORD || 'AQICAHiH13KUFzsgYLKk0P7SlDYjzrHAX/LIGrIoyKRnIOlcfgHP05myF8WsiVX2rJP8nDJHAAAAZjBkBgkqhkiG9w0BBwagVzBVAgEAMFAGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQM0PIL2kGJRtqS3UuSAgEQgCOznruZIuZdzHoKMWXj4Ued407MBMYPku7YoKA2IVEgiUbobw==',
    'database': process.env.DB_NAME || 'shiftwise',
    'region': process.env.AWS_REGION || 'us-east-1'
}