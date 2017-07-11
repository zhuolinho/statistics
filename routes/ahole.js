/**
 * Created by sl on 2017/7/11.
 */
var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var querying = false;
var co = require('co');

router.get('/', function (req, res, next) {
    var remoteAddress = req.connection.remoteAddress.split(":")[3];
    if (querying || remoteAddress != "211.161.198.70" && remoteAddress != "114.55.3.90" && remoteAddress) {
        res.send(remoteAddress);
    }
    else {
        co(function*() {
            querying = true;
            var connection = mysql.createConnection({
                host: 'rr-bp16k64rx4lk50917.mysql.rds.aliyuncs.com',
                user: 'tcc_query',
                password: 'querythinkLight123',
                database: 'tcc'
                // host: '54.222.179.73',
                // user: 'image',
                // password: 'image@thinkLight',
                // database: 'image'
            });
            var data = yield query(connection, "SELECT a.*, b.name FROM(SELECT id, crt_time, park_id, validto, validfrom, platenumber, fee, actual_fee, product_start_time, product_end_time, is_renewal FROM tb_park_charge_order WHERE crt_time >= '" + req.query.startTime + "' AND crt_time < '" + req.query.endTime + "' AND order_category = 'SP' AND ispay = 'Y' AND STATUS = 'R')AS a, tb_park_park AS b WHERE a.park_id = b.id");
            connection.end();
            connection = mysql.createConnection({
                host: '54.222.179.73',
                user: 'image',
                password: 'image@thinkLight',
                database: 'test'
            });
            for (var i = 0; i < data.length; i++) {
                var msg = yield query(connection, "INSERT INTO stat_sp SET ? ON DUPLICATE KEY UPDATE id = id", data[i]);
            }
            connection.end();
            querying = false;
            res.send(data);
        });
    }
});

function query(client, sql, values) {
    return new Promise(function (resolve, reject) {
        client.query(sql, values, function (err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = router;
