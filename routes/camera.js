/**
 * Created by sl on 2017/6/19.
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
    if (querying || remoteAddress != "211.161.198.70" && remoteAddress != "114.55.3.90" && remoteAddress) res.send(remoteAddress);
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
            var startTime = new Date(req.query.startTime);
            startTime.setMinutes(0);
            startTime.setSeconds(0);
            for (; startTime < endTime;) {
                var condition = "";
                if (req.query.parkIds) {
                    var arr = req.query.parkIds.split(",");
                    condition = "park_id IN ('" + arr.join("','") + "') AND ";
                }
                var time = startTime;
                var startDate = formatDate(startTime, "yyyy-MM-dd hh:mm:ss");
                var hours = startTime.getHours();
                var endDate = formatDate(startTime.setHours(hours + 1), "yyyy-MM-dd hh:mm:ss");
                console.log(endDate);
                var data = yield query(connection, "SELECT b.ID, b.cameraname, a.status, a.count, b.park_id, c.name FROM (SELECT cameraid, status, COUNT(*) AS COUNT, park_id FROM tb_park_plate WHERE " + condition + "date_time >= '" + startDate + "' AND date_time < '" + endDate + "' GROUP BY cameraid, status) AS a, tb_park_camera AS b, tb_park_park AS c WHERE a.cameraid = b.ID AND a.park_id = c.id");
                var col = db.collection('STAT_Camera');
                for (var i = 0; i < data.length; i++) {
                    var r = yield col.updateMany({
                        cameraId: data[i].ID,
                        status: data[i].status,
                        time: time
                    }, {
                        $set: {
                            cameraName: data[i].cameraname,
                            count: data[i].count,
                            parkId: data[i].park_id,
                            parkName: data[i].name,
                            hours: hours,
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