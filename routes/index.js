var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
// var DB_CONN_STR = 'mongodb://tcc:tcc@image.limadcw.com:27017/tcc';
var DB_CONN_STR = 'mongodb://tcc:mdao_thinklight_1314@dds-bp1e6f25461e0b041.mongodb.rds.aliyuncs.com:3717/tcc';
var querying = false;

/* GET home page. */
router.get('/', function (req, res, next) {
    if (querying || req.connection.remoteAddress.split(":")[3] != "211.161.198.70") {
        res.send("querying...");
    }
    else {
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
        connection.query("SELECT park_id, COUNT(*) AS count, SUM(actual_fee) AS sum FROM tb_park_charge_order WHERE crt_time >= '" + req.query.startDate + "' AND crt_time < '" + req.query.endDate + "' AND order_category = 'SP' AND ispay = 'Y' AND STATUS = 'R' GROUP BY park_id", function (error, results, fields) {
            if (error) throw error;
            var orders = {};
            results.forEach(function (order) {
                orders[order.park_id] = order;
            });
            connection.query("SELECT park_id, COUNT(*) AS c, SUM(price) AS s FROM tb_park_cost_trade WHERE create_time >= '" + req.query.startDate + "' AND create_time < '" + req.query.endDate + "' AND (type = 'SPOTHER' OR type = 'PAYOTHER') GROUP BY park_id", function (error, results, fields) {
                if (error) throw error;
                results.forEach(function (trade) {
                    if (orders[trade.park_id]) {
                        orders[trade.park_id].c = trade.c;
                        orders[trade.park_id].s = trade.s;
                    } else {
                        orders[trade.park_id] = trade;
                    }
                });
                connection.end();
                var keys = Object.keys(orders);
                var parkInfo = {};
                MongoClient.connect(DB_CONN_STR, function (err, db) {
                    getInfo(db, 0, keys, parkInfo, function () {
                        db.close();
                        querying = false;
                        var str = "park_id,场库,合伙人,包月线上支付笔数,包月线上支付金额,包月总支付笔数,包月总金额";
                        for (var key in orders) {
                            if (!orders[key].count) {
                                orders[key].count = 0;
                                orders[key].sum = 0;
                            }
                            if (!orders[key].c) {
                                orders[key].c = 0;
                                orders[key].s = 0;
                            }
                            str = str + "\n" + key + "," + parkInfo[key].parkName + "," + parkInfo[key].name + "," + orders[key].count + "," + orders[key].sum + "," + (orders[key].count + orders[key].c) + "," + (orders[key].sum - orders[key].s);
                        }
                        res.send(str);
                    });
                });
            });
        });
    }
});

function getInfo(db, index, keys, arr, done) {
    var key = keys[index];
    if (key) {
        arr[key] = {};
        db.collection('conch_ParkBasic').findOne({lmd_parkId: key, isDiscard: 'N'}, function (err, doc) {
            arr[key].parkName = doc.parkName;
            db.collection('conch_ParkUser').findOne({
                parkRole: 'PM',
                parkId: doc._id,
                isDiscard: 'N'
            }, function (err, doc) {
                db.collection('conch_ConchUser').findOne({_id: doc.conchUserId}, function (err, doc) {
                    arr[key].name = doc.name;
                    getInfo(db, index + 1, keys, arr, done);
                });
            });
        });
    } else {
        done();
    }
}

module.exports = router;
