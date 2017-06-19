/**
 * Created by sl on 2017/6/12.
 */
var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
// var DB_CONN_STR = 'mongodb://tcc:tcc@image.limadcw.com:27017/tcc';
var DB_CONN_STR = 'mongodb://tcc:mdao_thinklight_1314@dds-bp1e6f25461e0b041.mongodb.rds.aliyuncs.com:3717/tcc';
var querying = false;
var co = require('co');

router.get('/', function (req, res, next) {
    var remoteAddress = req.connection.remoteAddress.split(":")[3];
    if (querying || remoteAddress != "211.161.198.70" && remoteAddress) res.send("querying...");
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
            var data = yield query(connection, "SELECT a.park_id, b.name, a.order_category, a.pay_type, a.count, a.sum FROM (SELECT park_id, order_category, pay_type, COUNT(*) AS count, SUM(actual_fee) AS sum FROM tb_park_charge_order WHERE crt_time BETWEEN '" + req.query.startDate + "' AND '" + req.query.endDate + "' AND ispay = 'Y' AND STATUS = 'R' GROUP BY order_category, pay_type, park_id) AS a, tb_park_park AS b WHERE a.park_id = b.id");
            var trade = yield query(connection, "SELECT a.park_id, b.name AS park_name, a.client_id, c.name, a.type, a.count, a.sum FROM (SELECT park_id, client_id, type, COUNT(*) AS count, SUM(price) AS sum FROM tb_park_cost_trade WHERE create_time BETWEEN '" + req.query.startDate + "' AND '" + req.query.endDate + "' GROUP BY park_id, type, client_id) AS a, tb_park_park AS b, tb_park_user AS c WHERE a.park_id = b.id AND a.client_id = c.id");
            connection.end();
            var db = yield MongoClient.connect(DB_CONN_STR);
            var col = db.collection('STAT_OnlinePay');
            for (var i = 0; i < data.length; i++) {
                var r = yield col.updateMany({
                    parkId: data[i].park_id,
                    orderCategory: data[i].order_category,
                    payType: data[i].pay_type
                }, {
                    $set: {count: data[i].count, sum: data[i].sum, parkName: data[i].name, updateTime: new Date()},
                    $setOnInsert: {createTime: new Date}
                }, {upsert: true});
            }
            col = db.collection('STAT_OfflinePay');
            for (var i = 0; i < trade.length; i++) {
                var r = yield col.updateMany({
                    parkId: trade[i].park_id,
                    clientId: trade[i].client_id,
                    type: trade[i].type
                }, {
                    $set: {
                        count: trade[i].count,
                        sum: trade[i].sum,
                        parkName: trade[i].park_name,
                        name: trade[i].name,
                        updateTime: new Date()
                    },
                    $setOnInsert: {createTime: new Date}
                }, {upsert: true});
            }
            db.close();
            querying = false;
            res.send("done.");
        });
    }
});

function query(client, sql) {
    return new Promise(function (resolve, reject) {
        client.query(sql, function (err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = router;