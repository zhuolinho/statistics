/**
 * Created by sl on 2017/6/2.
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
        connection.query("SELECT client_id, COUNT(*) AS count, SUM(actual_fee) AS sum FROM tb_park_charge_order WHERE crt_time BETWEEN '2017-05-01' AND '2017-06-01' AND order_category = 'QR' AND ispay = 'Y' AND STATUS = 'R' GROUP BY client_id", function (error, results, fields) {
            if (error) throw error;
            var orders = {};
            results.forEach(function (order) {
                orders[order.client_id] = order;
            });
            connection.query("SELECT a.client_id, b.name, b.phone, a.c, a.s, c.name AS park_name FROM (SELECT client_id, COUNT(*) AS c, SUM(price) AS s, park_id FROM tb_park_cost_trade WHERE create_time BETWEEN '2017-05-29' AND '2017-06-05' AND TYPE = 'CONSUME' GROUP BY client_id) AS a, tb_park_user AS b, tb_park_park AS c WHERE a.client_id = b.id AND a.park_id = c.id", function (error, results, fields) {
                if (error) throw error;
                var str = "client_id,场库,保安,联系方式,当面付支付笔数,当面付支付金额,该保安总临停支付笔数,该保安总临停金额";
                results.forEach(function (trade) {
                    var count = 0, sum = 0;
                    if (orders[trade.client_id]) {
                        count = orders[trade.client_id].count;
                        sum = orders[trade.client_id].sum;
                    }
                    str = str + "\n" + trade.client_id + "," + trade.park_name + "," + trade.name + "," + trade.phone + "," + count + "," + sum + "," + (trade.c + count) + "," + (sum - trade.s);
                });
                res.send(str);
                connection.end();
            });
        });
    }
});

module.exports = router;