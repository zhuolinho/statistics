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
                connection.end();
                var parkInfo = {};
                co(function*() {
                    var db = yield MongoClient.connect(DB_CONN_STR);
                    // var keys = ["051f8968-a497-4a1e-90fc-461e739075de", "A14364339555198B0A8DC8757B1E97F63AFE5C0B60CAB7", "A14799531829431CC1172F30415774A79D2CC02C131025", "A1409734578950DFDF21E7FD13B0C21C9D80EB91831DFE", "A1409734327205384BED524595139E428F616EC59F8C5E", "A1400229753243993D1A5C52AC1F56ADDC3D0A8B437708", "A14327963443665CBAA4A3A93A5BDBDCF0E9B2156FF48F", "A142310322837451A40CB69F64A4FD66A10719CCE9ECD2"];
                    for (var key in orders) {
                        var cursor = db.collection("conch_ParkBasic").aggregate([{
                            $match: {
                                lmd_parkId: key,
                                isDiscard: "N"
                            }
                        }, {
                            $lookup: {
                                from: "conch_ContractProject",
                                localField: "_id",
                                foreignField: "paramter.parkBasic._id",
                                as: "projectInfo"
                            }
                        }, {
                            $lookup: {
                                from: "conch_ParkUser",
                                localField: "_id",
                                foreignField: "parkId",
                                as: "pmInfo"
                            }
                        }, {
                            $project: {
                                projectInfo: 1,
                                parkName: 1,
                                lmd_parkId: 1,
                                pmInfo: {
                                    $filter: {
                                        input: "$pmInfo",
                                        as: "pm",
                                        cond: {$and: [{$eq: ["$$pm.isDiscard", 'N']}, {$eq: ["$$pm.parkRole", "PM"]}]}
                                    }
                                }
                            }
                        }, {$unwind: {path: "$pmInfo", preserveNullAndEmptyArrays: true}}, {
                            $lookup: {
                                from: "conch_ConchUser",
                                localField: "pmInfo.conchUserId",
                                foreignField: "_id",
                                as: "userInfo"
                            }
                        }]);
                        var doc = yield cursor.toArray();
                        if (doc.length) {
                            var pm = "";
                            var needAmount = "";
                            doc.forEach(function (obj) {
                                if (obj.userInfo[0] && !pm) pm = obj.userInfo[0].name;
                                obj.projectInfo.forEach(function (ele) {
                                    if (needAmount != "Y") needAmount = ele.needAmount;
                                });
                            });
                            parkInfo[key] = {pm: pm, needAmount: needAmount};
                        } else {
                            parkInfo[key] = {pm2: "", needAmount: ""};
                        }
                    }
                    db.close();
                    querying = false;
                    var str = "park_id,场库,合伙人,是否自营,临停线上支付笔数,临停线上支付金额,临停总笔数,临停总金额";
                    for (var key in orders) {
                        console.log(key);
                        if (!orders[key].count) {
                            orders[key].count = 0;
                            orders[key].sum = 0;
                        }
                        if (!orders[key].c) {
                            orders[key].c = 0;
                            orders[key].s = 0;
                        }
                        str = str + "\n" + key + "," + orders[key].name + "," + parkInfo[key].pm + "," + parkInfo[key].needAmount + "," + orders[key].count + "," + orders[key].sum + "," + (orders[key].count + orders[key].c) + "," + (orders[key].sum - orders[key].s);
                    }
                    res.send(str);
                });
            });
        });
    }
});

module.exports = router;