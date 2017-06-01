var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
// var DB_CONN_STR = 'mongodb://tcc:tcc@image.limadcw.com:27017/tcc';
var DB_CONN_STR = 'mongodb://tcc:mdao_thinklight_1314@dds-bp1e6f25461e0b041.mongodb.rds.aliyuncs.com:3717/tcc';

/* GET home page. */
router.get('/', function (req, res, next) {
    // MongoClient.connect(DB_CONN_STR, function (err, db) {
    //     var arr = {};
    //     db.collection('conch_ChargeAppealSum').find({periodType: 'MONTH'}).forEach(function (doc) {
    //         arr[doc._id] = doc;
    //         console.log(doc);
    //     });
    //     res.send(arr);
    //     db.close();
    // });

    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: 'rdstklduzjn711wfde1r7.mysql.rds.aliyuncs.com',
        user: 'tcc',
        password: 'thinkLight',
        database: 'tcc'
    });
    connection.connect();
    connection.query("SELECT park_id, COUNT(*), SUM(price) FROM tb_park_cost_trade WHERE create_time BETWEEN '2017-05-01' AND '2017-05-02' AND (TYPE = 'SPOTHER' OR TYPE = 'PAYOTHER’) GROUP BY park_id", function (error, results, fields) {
        if (error) throw error;
        res.send(results);
    });
    connection.end();
});

module.exports = router;
