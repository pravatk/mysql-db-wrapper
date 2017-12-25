/*
* Author: Pravat
* Date: 12/01/2017
* Description: Utility function to use AWS KMS to decrypt a given ciphertext.
*/
var AWS = require('aws-sdk');
var kms = new AWS.KMS();
var async = require('async');
var logger = require('kdlogger').logger;

var decodeCipherText = function (cipherText) {
    var encryptedBuffer = new Buffer(cipherText, 'base64');
    var cipherText = { CiphertextBlob: encryptedBuffer };
    return cipherText;
}

/**
 * This is the function to be used to decrypt an encrypted text. 
 * The contract here is that the encrypted text is base64 encoded. 
 * @param {String} encryptedText 
 * @param {Function} callback 
 */
var _decrypt = function (encryptedText, callback) {
    logger.info(encryptedText);
    var cipherText = decodeCipherText(encryptedText);
    kms.decrypt(cipherText, callback);
}

/**
 * Decrypt an Json Object with multiple ciphertext.
 * 
 * @param {Object} input 
 * @param {Function} callback 
 */
var _decryptKeys = function (input, callback) {
    var result = {};
    async.forEachOf(input, (value, key, cb) => {
        _decrypt(value, function (error, data) {
            if (!error) {
                result[key] = data.Plaintext.toString('ascii');
            } else {
                cb(error, key);
            }
            cb();
        });
    }, (err, data) => {
        if (err) {
            logger.error("Error occurred while decrypting index: ", data, err);
            callback(err);
        } else {
            logger.info("Successfully decrypted all keys");
            callback(null, result);
        }
    });
}

module.exports = {
    decrypt_keys: _decryptKeys,
    decrypt: _decrypt
}