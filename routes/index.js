var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
// var DB_CONN_STR = 'mongodb://tcc:tcc@image.limadcw.com:27017/tcc';
var DB_CONN_STR = 'mongodb://tcc:tcc@192.168.10.200:27017/tcc';

/* GET home page. */
router.get('/', function (req, res, next) {
    // MongoClient.connect(DB_CONN_STR, function (err, db) {
    //     var arr = {};
    //     db.collection('conch_ChargeAppealSum').find({periodType: 'MONTH'}).forEach(function (doc) {
    //         arr[doc._id] = doc;
    //
    //     });
    //     db.close();
    // });
    var mysql      = require('mysql');
    var connection = mysql.createConnection({
        host     : 'rdstklduzjn711wfde1r7.mysql.rds.aliyuncs.com',
        user     : 'tcc',
        password : 'thinkLight',
        database : 'tcc'
    });
    connection.connect();
    connection.query('SELECT * FROM image.tb_park_plate LIMIT 0, 10', function (error, results, fields) {
        if (error) throw error;
        res.send(results);
        console.log(results[0].isneed);
    });
    connection.end();
});

module.exports = router;
