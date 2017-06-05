/**
 * Created by sl on 2017/6/5.
 */
var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var querying = false;

router.get('/', function (req, res, next) {
    if (querying || req.connection.remoteAddress.split(":")[3] != "211.161.198.70") res.send("querying...");
    else {
        querying = true;
        var connection = mysql.createConnection({
            host: 'rdstklduzjn711wfde1r7.mysql.rds.aliyuncs.com',
            user: 'tcc',
            password: 'thinkLight',
            database: 'tcc'
            // host     : '54.222.179.73',
            // user     : 'image',
            // password : 'image@thinkLight',
            // database : 'image'
        });
        connection.connect();
        connection.query("SELECT b.id, b.name, a.count, a.sum FROM (SELECT park_id, COUNT(*) AS COUNT, SUM(actual_fee) AS SUM FROM tb_park_charge_order WHERE crt_time BETWEEN '" + req.query.startDate + "' AND '" + req.query.endDate + "' AND order_category = 'OP' AND ispay = 'Y' AND STATUS = 'R' GROUP BY park_id) AS a, tb_park_park AS b WHERE a.park_id = b.id", function (error, results, fields) {
            if (error) throw error;
            var orders = {};
            results.forEach(function (order) {
                orders[order.client_id] = order;
            });
            res.send(orders);
            connection.end();
            querying = false;
        });
    }
});

module.exports = router;