/**
 * Created by sl on 2017/6/12.
 */
var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var querying = false;
var co = require('co');

router.get('/', function (req, res, next) {
    if (querying || req.connection.remoteAddress.split(":")[3] != "211.161.198.70") res.send("querying...");
    else {
        querying = true;
        var connection = mysql.createConnection({
            host: 'rr-bp16k64rx4lk50917.mysql.rds.aliyuncs.com',
            user: 'tcc_query',
            password: 'querythinkLight123',
            database: 'tcc'
            // host     : '54.222.179.73',
            // user     : 'image',
            // password : 'image@thinkLight',
            // database : 'image'
        });
        co(function*() {
            var data = yield query(connection, "SELECT order_category, pay_type, COUNT(*) AS c, SUM(actual_fee) AS s FROM tb_park_charge_order WHERE crt_time BETWEEN '" + req.query.startDate + "' AND '" + req.query.endDate + "' AND ispay = 'Y' AND STATUS = 'R' GROUP BY order_category, pay_type");
            res.send(data);
            var trade = yield query(connection, "SELECT park_id, client_id, TYPE, COUNT(*), SUM(price) FROM tb_park_cost_trade WHERE create_time BETWEEN '" + req.query.startDate + "' AND '" + req.query.endDate + "' GROUP BY park_id, type, client_id");
            console.log(trade);
            connection.end();
            querying = false;
        });
    }
});

function query(client, sql) {
    var p = new Promise(function (resolve, reject) {
        var callback = function (err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        };
        client.query(sql, callback);
    });
    return p;
}

module.exports = router;