/**
 * Created by sl on 2017/6/5.
 */
var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
// var DB_CONN_STR = 'mongodb://tcc:tcc@image.limadcw.com:27017/tcc';
var DB_CONN_STR = 'mongodb://tcc:mdao_thinklight_1314@dds-bp1e6f25461e0b041.mongodb.rds.aliyuncs.com:3717/tcc';
var querying = false;

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
        connection.connect();
        connection.query("SELECT a.park_id, b.name, a.count, a.sum FROM (SELECT park_id, COUNT(*) AS COUNT, SUM(actual_fee) AS SUM FROM tb_park_charge_order WHERE crt_time BETWEEN '" + req.query.startDate + "' AND '" + req.query.endDate + "' AND order_category = 'OP' AND ispay = 'Y' AND STATUS = 'R' GROUP BY park_id) AS a, tb_park_park AS b WHERE a.park_id = b.id", function (error, results, fields) {
            if (error) throw error;
            var orders = {};
            results.forEach(function (order) {
                orders[order.park_id] = order;
            });
            connection.query("SELECT a.park_id, b.name, a.c, a.s FROM (SELECT park_id, COUNT(*) AS c, SUM(price) AS s FROM tb_park_cost_trade WHERE create_time BETWEEN '" + req.query.startDate + "' AND '" + req.query.endDate + "' AND TYPE = 'CONSUME' GROUP BY park_id) AS a, tb_park_park AS b WHERE a.park_id = b.id", function (error, results, fields) {
                if (error) throw error;
                results.forEach(function (trade) {
                    if (orders[trade.park_id]) {
                        orders[trade.park_id].c = trade.c;
                        orders[trade.park_id].s = trade.s;
                    } else {
                        orders[trade.park_id] = trade;
                    }
                });
                // var str = "park_id,场库,合伙人,临停线上支付笔数,临停线上支付金额,临停总笔数,临停总金额";
                // for (var key in orders) {
                //     console.log(key);
                //     if (!orders[key].count) {
                //         orders[key].count = 0;
                //         orders[key].sum = 0;
                //     }
                //     if (!orders[key].c) {
                //         orders[key].c = 0;
                //         orders[key].s = 0;
                //     }
                //     str = str + "\n" + key + "," + orders[key].name + "," + parkInfo[key][1] + "," + orders[key].count + "," + orders[key].sum + "," + (orders[key].count + orders[key].c) + "," + (orders[key].sum - orders[key].s);
                // }
                // res.send(str);
                connection.end();
                var keys = Object.keys(orders);
                var parkInfo = {};
                MongoClient.connect(DB_CONN_STR, function (err, db) {
                    db.collection('conch_ParkUser').aggregate([{$match: {isDiscard: "N", parkRole: "PM"}}, {
                        $lookup: {
                            from: "conch_ConchUser",
                            localField: "conchUserId",
                            foreignField: "_id",
                            as: "userInfo"
                        }
                    }, {$out: "user"}], function (err, result) {
                        db.collection('conch_ParkBasic').aggregate([{
                            $lookup: {
                                from: "user",
                                localField: "_id",
                                foreignField: "parkId",
                                as: "pmInfo"
                            }
                        }, {
                            $lookup: {
                                from: "conch_ContractProject",
                                localField: "_id",
                                foreignField: "paramter.parkBasic._id",
                                as: "projectInfo"
                            }
                        }, {$match: {lmd_parkId: {$ne: null, $exists: true}, isDiscard: "N"}}], function (err, result) {
                            res.send(result);
                            db.close();
                            querying = false;
                        })
                    });
                });
            });
        });
    }
});

module.exports = router;