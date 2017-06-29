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
var Long = require('mongodb').Long;
var ObjectID = require('mongodb').ObjectID;

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
            var db = yield MongoClient.connect(DB_CONN_STR);
            var endTime = new Date(req.query.endTime);
            for (var startTime = new Date(req.query.startTime); startTime < endTime;) {
                var condition = "";
                if (req.query.parkIds) {
                    var arr = req.query.parkIds.split(",");
                    condition = "park_id IN ('" + arr.join("','") + "') AND ";
                }
                var startDate = formatDate(startTime, "yyyy-MM-dd hh:mm:ss");
                var endDate = formatDate(startTime.setDate(startTime.getDate() + 1), "yyyy-MM-dd hh:mm:ss");
                console.log(endDate);
                var data = yield query(connection, "SELECT a.park_id, b.name, a.order_category, a.pay_type, a.count, a.sum FROM (SELECT park_id, order_category, pay_type, COUNT(*) AS count, SUM(actual_fee) AS sum FROM tb_park_charge_order WHERE " + condition + "crt_time >= '" + startDate + "' AND crt_time < '" + endDate + "' AND ispay = 'Y' AND STATUS = 'R' GROUP BY order_category, pay_type, park_id) AS a, tb_park_park AS b WHERE a.park_id = b.id");
                var trade = yield query(connection, "SELECT a.park_id, b.name AS park_name, a.client_id, c.name, a.type, a.count, a.sum FROM (SELECT park_id, client_id, type, COUNT(*) AS count, SUM(price) AS sum FROM tb_park_cost_trade WHERE " + condition + "create_time >= '" + startDate + "' AND create_time < '" + endDate + "' GROUP BY park_id, type, client_id) AS a, tb_park_park AS b, tb_park_user AS c WHERE a.park_id = b.id AND a.client_id = c.id");
                var col = db.collection('STAT_OnlinePay');
                for (var i = 0; i < data.length; i++) {
                    var r = yield col.updateMany({
                        parkId: data[i].park_id,
                        orderCategory: data[i].order_category,
                        payType: data[i].pay_type,
                        time: startDate
                    }, {
                        $set: {
                            count: data[i].count,
                            sum: data[i].sum,
                            parkName: data[i].name,
                            "info.updatedAt": new Date(),
                            "info.updatedBy": ""
                        },
                        $setOnInsert: {
                            "info.createdAt": new Date(),
                            "info.createdBy": "",
                            v: new Long(),
                            _id: new ObjectID().toHexString()
                        }
                    }, {upsert: true});
                }
                col = db.collection('STAT_OfflinePay');
                for (var i = 0; i < trade.length; i++) {
                    var r = yield col.updateMany({
                        parkId: trade[i].park_id,
                        clientId: trade[i].client_id,
                        type: trade[i].type,
                        time: startDate
                    }, {
                        $set: {
                            count: trade[i].count,
                            sum: trade[i].sum,
                            parkName: trade[i].park_name,
                            name: trade[i].name,
                            "info.updatedAt": new Date(), "info.updatedBy": ""
                        },
                        $setOnInsert: {
                            "info.createdAt": new Date(),
                            "info.createdBy": "",
                            v: new Long(),
                            _id: new ObjectID().toHexString()
                        }
                    }, {upsert: true});
                }
            }
            connection.end();
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

function formatDate(date, pattern) {
    var _ptd = {};
    var result = "";
    if (typeof date == "string" || typeof date == "number") {
        var _d = parseInt(date);
        if (_d != NaN) {
            date = new Date(_d);
        }
    }
    if (typeof date == "object" && date.constructor != Date) {
        date = new Date();
    }
    var y = date.getFullYear();
    _ptd["yyyy"] = y;
    _ptd["yy"] = y.toString().substr(2, 2);
    var m = date.getMonth() + 1;
    if (m < 10) {
        m = "0" + m;
    }
    _ptd["MM"] = m;
    var d = date.getDate();
    if (d < 10) {
        d = "0" + d;
    }
    _ptd["dd"] = d;
    var h = date.getHours();
    if (h < 10) {
        h = "0" + h;
    }
    _ptd["hh"] = h;
    var min = date.getMinutes();
    if (min < 10) {
        min = "0" + min;
    }
    _ptd["mm"] = min;
    var s = date.getSeconds();
    if (s < 10) {
        s = "0" + s;
    }
    _ptd["ss"] = s;
    var pts = pattern.split(/[- :]/);
    var idx = 0;
    for (var i = 0; i < pts.length; i++) {
        var pt = pts[i];
        var val = _ptd[pt];
        idx += pt.length;
        var sstr = "";
        //split symbool
        if (idx < pattern.length) {
            sstr = pattern.charAt(idx);
            idx++;
        }
        //length
        result = result + val + sstr;
    }
    return result;
}

module.exports = router;