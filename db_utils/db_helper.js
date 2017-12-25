var mysql = require('mysql');

var _db_data = {}
var _default_db_name = ""
var _log_sql = false;
var _log_errors = true;
/**
 * Connects to the MySQL DB with the given config. 
 * The config is an object with following attributes:
 *  host - Hostname of the DB
 *  database - Database Name
 *  user - Username
 *  password - Password for the above user.
 *  log_sql: true/false. mentions if the queries needs to be logged.
 *  log_errors: true/false 
 * 
 * @param {Object} config 
 * @param {Function} callback 
 */
exports.connect = function (config, callback) {
    var db_name = config.database;
    if (config.log_sql)
        _log_sql = config.log_sql;
    if (_db_data[db_name] == undefined) {
        var connection = mysql.createConnection(config);
        _db_data[db_name] = {
            'conn': connection
        };
        _default_db_name = db_name;

        console.log("MySQL connected to database %s.", db_name);
        console.log("%s is now the current Database.", db_name);
    }
    callback(null, _db_data);
};

/**
 * Queries the database and return the result. 
 * Sample query_obj: 
 * {
 *      sql:"",
 *      db_name:"",
 *      values:[]
 * }
 * @param {Query} query_obj 
 * @param {Function} cb 
 */
exports.query = function (query_obj, cb) {
    query_obj = clean_query_obj(query_obj)
    var sql = query_obj.getSql();
    var db_name = query_obj.getDatabase();
    var con = _db_data[db_name].conn
    var query_values = null;
    if (query_obj.getValues()) {
        query_values = query_obj.getValues();
    }

    if (con) {
        if (query_values) {
            sql = mysql.format(sql, query_values);
        }
        if (_log_sql) {
            console.log(sql)
        }

        con.query(sql, function (err, results, fields) {
            if (err) {
                error(err, sql)
            }
            cb(err, results, fields)
        });
    } else {
        cb(null, null, null)
    }
};

/**
 * Destroys the connection and releases the resources.
 * @param {String} db_name 
 * @param {Function} callback 
 */
exports.close = function (db_name, callback) {
    if (db_name && _db_data[db_name]) {
        var connection = _db_data[db_name].conn;
        _db_data[db_name] = undefined;
        connection.end(function (err, data) {
            callback(err, data);
        });
    } else {
        console.log("Not connected to %s", db_name);
        callback(null);
    }
};

/**
 * Validates the query object. If the query does not have database name details, updates it to default db.
 * @param {Query} query_obj 
 */
var clean_query_obj = function (query_obj) {
    var isNull = (!query_obj.getDatabase());
    var isUndefined = (query_obj.getDatabase() == undefined);
    if (isNull || isUndefined) {
        query_obj.setDatabase(_default_db_name);
    }
    if (query_obj.getValues() == undefined) {
        query_obj.setValues(null);
    }
    return query_obj;
};

/**
 * Logs the error and the sql after a failure
 * @param {Error} err 
 * @param {String} sql 
 */
var error = function (err, sql) {
    if (_log_errors) {
        console.log("ERROR: ");
        console.log(err);
        console.log("SQL:  ");
        console.log(sql);
    }
};