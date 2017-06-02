/**
 * Created by sl on 2017/6/2.
 */
var express = require('express');
var mysql = require('mysql');
var router = express.Router();

router.get('/', function (req, res, next) {
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
    connection.query("SELECT client_id, COUNT(*) AS count, SUM(actual_fee) AS sum FROM tb_park_charge_order WHERE crt_time BETWEEN '2017-05-29' AND '2017-06-05' AND order_category = 'QR' AND ispay = 'Y' AND STATUS = 'R' GROUP BY client_id", function (error, results, fields) {
        if (error) throw error;
        res.send(results);
        connection.end();
    });
});

module.exports = router;