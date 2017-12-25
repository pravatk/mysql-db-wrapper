var db_helper = require("./db_helper");
var Query = require("./models/Query");
var async = require('async');
var kms = require('kms-utils');
var JobStatusModel = require("./models/JobStatusModel");
var logger = require('kdlogger').logger;
var _this = this;
var db_config = undefined;

/**
 * Initializes the DB config object from the environment variables.
 * @param {Function} callback 
 */
exports._init = function (callback, force = false) {
    if (!db_config || force == true) {
        db_config = {};
        db_config.host = process.env.DB_HOST;
        db_config.database = process.env.DB_NAME;
        db_config.log_sql = force;
        db_config.log_error = force;
        var to_decrypt = {};
        to_decrypt.user = process.env.DB_USER;
        to_decrypt.password = process.env.DB_PASSWORD;

        kms.decrypt_keys(to_decrypt, function (err, data) {
            if (err) {
                callback(err);
                return;
            } else {
                db_config.user = data.user;
                db_config.password = data.password;

                callback(null, db_config);
            }
        });
    } else {
        callback(null, db_config);
    }
}

/**
 * API to log generic error for an individual state inside a state machine. 
 * We are just gonna update the JobStatus table about the given Job.
 * 
 * @description This API is rerunnable, i.e. retries are not gonna add new records.
 * @param {JobStatusModel} input 
 * @param {Function} callback 
 */
exports.log_lambda_failure = function (input, callback) {
    this._init(function (err, db_config) {
        db_helper.connect(db_config, function (conError, data) {
            if (conError) {
                logger.fatal("Error in connecting to DB", conError);
                callback(conError);
                return;
            } else {
                var sql = "UPDATE JobStatus js SET js.STATUS_ID = (SELECT ID FROM EventMetadata em WHERE em.EVENT_NAME=?)" +
                    " WHERE js.SRC_SYSTEM = (SELECT ID FROM VendorSystems vs WHERE vs.NAME=?) AND js.SRC_SYSTEM_ID=?";
                var bind = ['HUB_FAILED', input.getSourceVendor(), input.getSourceId()];
                var query = new Query();
                query.setDatabase(db_config.database);
                query.setSql(sql);
                query.setValues(bind);
                db_helper.query(query, function (dbErr, data) {
                    if (dbErr) {
                        logger.fatal("Error while executing the query: ", query, dbErr);
                        callback(dbErr);
                        return;
                    } else {
                        logger.info("Successfully logged the Lambda failure", data);
                        callback(null, true);
                    }
                    db_helper.close(db_config.database);
                });
            }
        });
    });
}

/**
 * Inserts a record into JobMappings table for the source system and source job and target system.
 * @description This API is rerunnable, i.e. retries are not gonna add new records.
 * @param {JobStatusModel} input 
 * @param {*} callback 
 */
exports.add_job_mapping = function (input, callback) {
    this._init(function (err, db_config) {
        db_helper.connect(db_config, function (db_data) {
            var sql = "INSERT INTO JobMappings(SRC_SYSTEM, SRC_SYSTEM_ID, TGT_SYSTEM) " +
                " SELECT vs.id, ? ,tgt.tgt_system from VendorSystems vs, (select id as tgt_system from VendorSystems where name = ?) tgt " +
                " where vs.name = ? and not exists (select 1 from JobMappings where SRC_SYSTEM = vs.ID and SRC_SYSTEM_ID = ?)";
            var bindParam = [input.getSourceId(), input.getTargetVendor(), input.getSourceVendor(), input.getSourceId()];
            var query = new Query(sql, db_config.database, bindParam);

            db_helper.query(query, function (db_err, dbRes) {
                if (db_err) {
                    logger.fatal("Error while saving the mapping to DB", db_err);
                    callback(db_err);
                } else {
                    logger.info("Successfully inserted records into JobMappings table", dbRes);
                    callback(null, true);
                }
            });
        });
    });
}

/**
 * Updates an existing JobMapping record with target creation time and target system id.
 * @description This API is rerunnable, i.e. retries are not gonna add new records.
 * @param {JobStatusModel} input 
 * @param {Function} callback 
 */
exports.update_job_mappings = function (input, callback) {
    this._init(function (err, db_config) {
        db_helper.connect(db_config, function (db_data) {
            var sql = "UPDATE JobMappings SET TGT_SYSTEM_ID=?, TGT_CREATION_TS=CURRENT_TIMESTAMP " +
                " WHERE SRC_SYSTEM = (SELECT ID from VendorSystems vs WHERE vs.NAME = ?) AND SRC_SYSTEM_ID = ? AND TGT_SYSTEM = (SELECT ID from VendorSystems vs WHERE vs.NAME = ?)";
            var bindParam = [input.getTargetId(), input.getSourceVendor(), input.getSourceId(), input.getTargetVendor()];
            var query = new Query(sql, db_config.database, bindParam);

            db_helper.query(query, function (db_err, dbRes) {
                if (db_err) {
                    logger.fatal("Error while updating the job mapping in DB", db_err);
                    callback(db_err);
                } else {
                    logger.info("Successfully updated the target system id in JobMappings table for JobId: ", input.getSourceId(), dbRes);
                    callback(null, true);
                }
            });
        });
    });
}

/**
 * Adds a trail record into JobTrail table for the State machine execution.
 * @description This API is rerunnable, i.e. retries are not gonna add new records.
 * @param {JobStatusModel} input 
 * @param {*} callback 
 */
exports.add_job_trail = function (input, callback) {
    this._init(function (err, db_config) {
        //TODO: Add Logic to insert either Src last update or tgt last update
        db_helper.connect(db_config, function (db_data) {
            var sql = "INSERT INTO JobTrail(JOB_ID,SRC_LAST_UPDATE,TGT_LAST_UPDATE,EXECUTION_ARN,EXECUTION_NAME,EVENT_ID)" +
                " SELECT jm.ID, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP , ?, ?, em.id FROM JobMappings jm, (SELECT ID FROM EventMetadata WHERE EVENT_NAME = ?) em " +
                " WHERE jm.SRC_SYSTEM = (SELECT ID FROM VendorSystems WHERE NAME=?) AND jm.SRC_SYSTEM_ID=?";
            logger.info(input || input.getEventName());
            var bindParam = [input.getExectionArn(), input.getExecutionName(), input.getEventName(), input.getSourceVendor(), input.getSourceId()];
            var query = new Query(sql, db_config.database, bindParam);

            db_helper.query(query, function (db_err, dbRes) {
                if (db_err) {
                    logger.fatal("Error while saving the mapping to DB", db_err);
                    callback(db_err);
                } else {
                    logger.info("Successfully inserted records into JobMappings table", dbRes);
                    callback(null, true);
                }
            });
        });
    });
}

/**
 * Inserts a record into JobStatus table for the source system and source job.
 * @description This API is rerunnable, i.e. retries are not gonna add new records.
 * @param {JobStatusModel} input 
 * @param {*} callback 
 */
exports.add_job_status = function (input, callback) {
    this._init(function (err, db_config) {
        db_helper.connect(db_config, function (db_data) {
            var sql = "INSERT INTO JobStatus SELECT vs.ID AS SRC_SYSTEM, ? AS SRC_SYSTEM_ID, event.ID AS STATUS " +
                " FROM VendorSystems vs, (SELECT em.ID FROM EventMetadata em WHERE EVENT_NAME=?) event WHERE NAME = ? " +
                " and not exists (select 1 from JobStatus where SRC_SYSTEM=vs.ID and SRC_SYSTEM_ID=?)";
            var bindParam = [];
            bindParam.push(input.getSourceId(), 'HUB_IN_PROGRESS', input.getSourceVendor(), input.getSourceId());
            var query = new Query(sql, db_config.database, bindParam);

            db_helper.query(query, function (db_err, dbRes) {
                if (db_err) {
                    logger.fatal("Error occurred while adding the status in DB", db_err);
                    callback(db_err);
                } else {
                    logger.info("Successfully inserted records into JobStatus table", dbRes);
                    callback(null, true);
                }
            });
        });
    });
}

/**
 * Updates an existing JobStatus record with new status.
 * @description This API is rerunnable, i.e. retries are not gonna add new records.
 * @param {JobStatusModel} input 
 * @param {*} callback 
 */
exports.update_job_status = function (input, callback) {
    this._init(function (err, db_config) {
        db_helper.connect(db_config, function (db_data) {
            var sql = "UPDATE JobStatus SET STATUS_ID=(SELECT ID FROM EventMetadata WHERE EVENT_NAME=?)" +
                " WHERE SRC_SYSTEM = (SELECT ID from VendorSystems vs WHERE NAME = ?) AND SRC_SYSTEM_ID = ?";
            var bindParam = [];
            bindParam.push(input.getEventName(), input.getSourceVendor(), input.getSourceId());
            var query = new Query(sql, db_config.database, bindParam);

            db_helper.query(query, function (db_err, dbRes) {
                if (db_err) {
                    logger.fatal("Error occurred while Updating the status in DB", db_err);
                    callback(db_err);
                } else {
                    logger.info("Successfully updated the JobStatus for Job:", input, dbRes);
                    callback(null, true);
                }
            });
        });
    });
}

/**
 * Inserts audit records for a Source position that is added. We will create a JobStatus record and a job mapping record with empty target system id.
 * @description This API is rerunnable, i.e. retries are not gonna add new records.
 * @param {JobStatusModel} input 
 * @param {Function} callback 
 */
exports.audit_src_job_add_event = function (input, callback) {
    var db_tasks = [];
    db_tasks.push(function (cb) {
        _this.add_job_status(input, function (err, data) {
            if (err)
                cb(err);
            else
                cb(null, data);
        });
    });

    db_tasks.push(function (cb) {
        _this.add_job_mapping(input, function (err, data) {
            if (err)
                cb(err);
            else
                cb(null, data);
        });
    })

    async.parallel(db_tasks, function (err, async_output) {
        if (err) {
            logger.error("Error while inserting to database", err);
            callback(err);
            return;
        } else {
            logger.info("Successfully inserted the Job records for auditing", async_output);
            callback(null, true);
        }
    });
}

/**
 * Update records with the job update event
 * @description This API is rerunnable, i.e. retries are not gonna add new records.
 * @param {JobStatusModel} input 
 * @param {*} callback 
 */
exports.audit_src_job_update_event = function (input, callback) {
    var db_tasks = [];
    db_tasks.push(function (cb) {
        _this.update_job_mappings(input, function (err, data) {
            if (err)
                cb(err)
            cb(null, data);
        });
    });

    db_tasks.push(function (cb) {
        _this.update_job_status(input, function (err, data) {
            if (!err)
                cb(null, data);
            else
                cb(err);
        });
    });

    async.parallel(db_tasks, function (err, async_output) {
        if (err) {
            logger.error("Error while updating job status to database", err);
            callback(err);
            return;
        } else {
            logger.info("Successfully updated the Job records for auditing", async_output);
            callback(null, true);
        }
    });
}

/**
 * Fetches the source system id for a job, when a target job id is known.
 * @param {*} tgt_vendor 
 * @param {*} tgt_id 
 * @param {*} src_vendor 
 * @param {*} callback 
 */
exports.get_src_job_from_target_id = function (tgt_vendor, tgt_id, src_vendor, callback) {
    this._init(function (err, db_config) {
        db_helper.connect(db_config, function (con_err, db_data) {
            var sql = "SELECT jm.SRC_SYSTEM_ID FROM JobMappings jm "
                + " WHERE jm.TGT_SYSTEM_ID = ? AND jm.TGT_SYSTEM = (SELECT ID FROM VendorSystems WHERE NAME=?) "
                + " AND jm.SRC_SYSTEM = (SELECT ID FROM VendorSystems WHERE NAME = ?)";
            var bindParam = [];
            bindParam.push(tgt_id, tgt_vendor, src_vendor);
            var query = new Query(sql, db_config.database, bindParam);

            db_helper.query(query, function (db_err, dbRes) {
                if (db_err) {
                    logger.fatal("Error occurred while fetching the src job details from the target job", db_err);
                    callback(db_err);
                } else {
                    logger.info("Found the source id for the target mapping", dbRes[0].SRC_SYSTEM_ID, tgt_id, dbRes);
                    callback(null, dbRes[0].SRC_SYSTEM_ID);
                }
            });
        });
    });
}

/**
 * Given a Source system name and source system id, fetches the target system id.
 * 
 * @param {String} src_vendor 
 * @param {String} src_id 
 * @param {String} tgt_vendor 
 * @param {Function} callback 
 */
exports.get_tgt_job_from_src_id = function (src_vendor, src_id, tgt_vendor, callback) {
    this._init(function (err, db_config) {
        db_helper.connect(db_config, function (con_err, db_data) {
            var sql = "SELECT jm.TGT_SYSTEM_ID FROM JobMappings jm"
                + " WHERE jm.SRC_SYSTEM_ID = ? AND jm.SRC_SYSTEM = (SELECT ID FROM VendorSystems WHERE NAME=?) "
                + " AND jm.TGT_SYSTEM = (SELECT ID FROM VendorSystems WHERE NAME = ?)";
            var bindParam = [];
            bindParam.push(src_id, src_vendor, tgt_vendor);
            var query = new Query(sql, db_config.database, bindParam);

            db_helper.query(query, function (db_err, dbRes) {
                if (db_err) {
                    logger.fatal("Error occurred while fetching the tgt job details from the source job", db_err);
                    callback(db_err);
                } else {
                    logger.info("Found the target job id for the source job", dbRes[0].TGT_SYSTEM_ID, src_id, dbRes);
                    callback(null, dbRes[0].TGT_SYSTEM_ID);
                }
            });
        });
    });
}
/**
 * Close the DB connection.
 * @param {Function} callback 
 */
exports.close_connection = function (callback) {
    this._init(function (err, db_config) {
        db_helper.close(db_config.database, function (err, data) {
            if (!err) {
                logger.info("cleared the connection");
            }
            db_config = undefined;
            callback(err, data);
        });
    });
}