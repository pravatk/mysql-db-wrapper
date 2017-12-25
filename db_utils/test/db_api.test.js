/**
 * Integration test class for db_apis.js and db_helper.js. 
 * Make sure when building locally, you have set the NODE_ENV to test and also have AWS_REGION environment varible set.
 * 
 * @author Pravat
 * @since 16/12/2017
 */
var Query = require("../models/Query");
var db = require('../db_helper');
var db_apis = require('../db_apis');
var JobStatusModel = require('../models/JobStatusModel');
var chai = require('chai');
var expect = chai.expect;
var config = require('../config/index');

console.log(config);

before(function () {
    process.env.DB_PASSWORD = config.password;
    process.env.DB_HOST = config.host;
    process.env.DB_USER = config.user;
    process.env.DB_NAME = config.database;
    process.env.AWS_REGION = config.region;
});

describe('can successfully decrypt db parameters', function () {
    it('test_valid_db_username_password_decryption', function (done) {
        this.timeout(20000);
        db_apis._init(function (err, config) {
            expect(config);
            expect(config.user).to.equal('system');
            expect(config.password).to.equal('qwertasd');
            done();
        }, true);
    });

    it('test_invalid_ciphertext_as_db_paramater', function (done) {
        this.timeout(20000);
        var oldPw = process.env.DB_PASSWORD;
        process.env.DB_PASSWORD = "Invalid Cipher";
        db_apis._init(function (err, config) {
            console.log(err);
            expect(err);
            db_apis.close_connection(function (err, data) {
                process.env.DB_PASSWORD = oldPw;
                done();
            });
        }, true);
    });
});

var src_id = 123;
var src_vendor_name = 'Shiftwise';
var target_id = 432;
var target_vendor_name = 'Wonolo';
var execution_name = "123_position_added";
var execution_arn = "abcde";
var event_name = 'SRC_POSITION_ADDED';

var model = new JobStatusModel(src_id, src_vendor_name, target_id, target_vendor_name, execution_name, execution_arn, event_name);

describe('adds job status into db for a Job', function () {
    it('test_add_job_status', function (done) {
        this.timeout(20000);
        db_apis._init(function (err, config) {
            expect(config);
            console.log(config);
            db_apis.add_job_status(model, function (err, data) {
                expect(!err);
                expect(data).to.equal(true);
                db_apis.close_connection(function (err, data) {
                    done();
                });
            });
        }, true);
    });

    describe('adds job mapping between source and target system', function () {
        it('test_add_job_mappings_between_src_target', function (done) {
            this.timeout(20000);
            db_apis._init(function (err, config) {
                expect(config);
                console.log(config);
                db_apis.add_job_mapping(model, function (err, data) {
                    expect(!err);
                    expect(data).to.equal(true);
                    db_apis.close_connection(function (err, data) {
                        done();
                    });
                });
            }, true);
        });
    });

    describe('successfully add a job trail for job event', function () {
        it('test_add_job_trail_for_job_creation', function (done) {
            this.timeout(20000);
            db_apis._init(function (err, config) {
                expect(config);
                console.log(config);
                model.setEventName('SRC_POSITION_ADDED');
                db_apis.add_job_trail(model, function (err, data) {
                    expect(!err);
                    expect(data).to.equal(true);
                    db_apis.close_connection(function (err, data) {
                        done();
                    });
                });
            }, true);
        });
    });

    describe("successfully audit job creation event with job mapping ", function () {
        it('test_src_job_creation_auditing', function (done) {
            this.timeout(20000);
            db_apis._init(function (err, config) {
                expect(config);
                console.log(config);
                db_apis.audit_src_job_add_event(model, function (err, data) {
                    expect(!err);
                    expect(data).to.equal(true);
                    db_apis.close_connection(function (err, data) {
                        done();
                    });
                });
            }, true);
        });
    });

    describe('get source job, given a target system', function () {
        it('test_get_src_id_from_tgt_id', function (done) {
            this.timeout(20000);
            db_apis._init(function (err, config) {
                expect(config);
                console.log(config);
                db_apis.get_src_job_from_target_id(model.getTargetVendor(), model.getTargetId(), model.getSourceVendor(), function (err, data) {
                    expect(!err);
                    expect(data).to.equal(model.getSourceId());
                    done();
                });
            }, true);
        });
    });
    
    describe('get target job, given a source system', function () {
        it('test_get_tgt_id_from_src_id', function (done) {
            this.timeout(20000);
            db_apis._init(function (err, config) {
                expect(config);
                console.log(config);
                db_apis.get_tgt_job_from_src_id(model.getSourceVendor(), model.getSourceId(), model.getTargetVendor(), function (err, data) {
                    expect(!err);
                    expect(data).to.equal(model.getTargetId());
                    done();
                });
            }, true);
        });
    });
});

describe('audit source job update event', function () {
    it('test_src_job_update_audit', function (done) {
        this.timeout(20000);
        db_apis._init(function (err, config) {
            expect(config);
            console.log(config);
            db_apis.audit_src_job_update_event(model, function (err, data) {
                expect(!err);
                expect(data).to.equal(true);
                done();
            });
        }, true);
    });
});

describe('log lambda generic failure in db', function () {
    it('test_lambda_generic_failure_logging_in_db', function (done) {
        this.timeout(20000);
        db_apis._init(function (err, config) {
            expect(config);
            console.log(config);
            db_apis.log_lambda_failure(model, function (err, data) {
                expect(!err);
                expect(data).to.equal(true);
                done();
            });
        }, true);
    });
});