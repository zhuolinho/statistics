var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
// var DB_CONN_STR = 'mongodb://tcc:tcc@image.limadcw.com:27017/tcc';
var DB_CONN_STR = 'mongodb://tcc:mdao_thinklight_1314@dds-bp1e6f25461e0b041.mongodb.rds.aliyuncs.com:3717/tcc';
var parkInfo = {
    A14332328618895D36D80FB92B7AD2D99EB7116A37A0D6: ["澳门路660弄", "吴慧谦"],
    A1439432767348FB60483788AA86862F8D6E1DA99BB6ED: ["长桥四村", "王佳"],
    A1452043867650CF41BBEC7689753E10DF64BF31C2593E: ["驰骋新苑", "郑元康"],
    A14528223284070C192C3A7F823D544357794BFF2F5E03: ["阳曲小区", "郑元康"],
    A14587101689224DCBF2DEB1EB8BB6AA8A4E9B63CA63D6: ["演示小区", "测试账号_物业"],
    A1458784787046C9806B52B58C1F7E72CE7C17BBB95F07: ["士韵家园（南区）", "陈丽丽"],
    A145880699053916CCB72A6B656D6CC62EB721A78A7F84: ["桂杨园", "吴慧谦"],
    A1460604502348A10C7A1D7920CE92718663AA4AEBD4BA: ["闻喜路251弄小区", "郑元康"],
    A14624162381561CB5339887732C293B6D4C0CBC92EFA7: ["南溪园", "吴慧谦"],
    A1462595511975CD31F726973C52ED79BD9822FCE6E1E2: ["风荷苑", "郑元康"],
    A1462610797477E8A066109B8A2C9A7B56B2AF3648EC7E: ["石岚三村", "吴慧谦"],
    A146348243164861E943B83D79D9058DC0CFF42D93C78B: ["岭南路100弄小区", "郑元康"],
    A1464676192791E7FD7F89C0F1669DCAEA337DFD0401CC: ["长桥八村", "王佳"],
    A14647545177624E293E0CACA0940DCE89A750CB8EC4F4: ["甘泉苑自营", "焦其琛"],
    A14664001892085F2B97CC35191411F9B1018B1A58BB5E: ["凉二小区", "焦其琛"],
    A146665890818493FF54325ED14BB57C3E9EDCB48FAE9F: ["源枫景苑", "徐皓"],
    A1466662952494D8E85652274AE933352390ACDC90102B: ["绿地银春", "徐皓"],
    A147028331709692825A19AF39D15CA5E12D677E7EC5E0: ["中怡家园", "吴慧谦"],
    A1471844624229F1C83FFD8C9A1CC7368539C733123D9B: ["彭五小区自营", "郑元康"],
    A1472435786399216508E070813F9602BA3E88AB054BFD: ["田林十四村多层", "王佳"],
    A147322906459773C36FD710D217D633D5FA158495BC8C: ["光鸿苑", "陈丽丽"],
    A1473394879172B0F718B0521E47DF3CC3201800C311B5: ["平顺小区", "郑元康"],
    A147632132540938C40DC802375E259E809C9D813D110D: ["海富公寓", "董凯敏"],
    A14812474052785291A7D4FBD1E232EE11C40C1E2F6577: ["三泉路424弄", "郑元康"],
    A14887792121510D4E9D588BD9E6467D60FEF3339E7DBA: ["闻喜路1110弄", "郑元康"],
    A148904589353610C8823DDDC4ED7151700B3492A18815: ["闻喜小区", "郑元康"],
    A1490960450517F8F493E132D552487E07D0969E3B6D74: ["泉灵小区", "郑元康"],
    A1432783133629C72746BBA6A29BD9522BC75911678002: ["光新大楼", "吴慧谦"],
    A14332304496799618D405DF8B5B811C98D330C6E1A5B1: ["兰田大楼", "吴慧谦"],
    A1439431528982D5E19B4981A017C888FF974458A68898: ["航天新苑", "陈丽丽"],
    A1440040917602728B8936E303067F35FEFA53FC77B7FA: ["和乐苑", "焦其琛"],
    A14503260351636D8FB8DD77E3A96DE1F0A87ADE38B98C: ["临汾街道（岭南路270弄）", "郑元康"],
    A1450343729077CFECCDDF312E6A108BAA2DE95C4330E8: ["陆一小区", "郑元康"],
    A14576631270104D17E264EA83D2CE153869729BBAECA4: ["普陀一村", "郑元康"],
    A14579449842313B4E644E32620072B6EC19169F5F9CC8: ["武宁一村", "郑元康"],
    A1458006218941C73AAE1F9180C370921D2BFBD0B49D44: ["普雄馨苑", "郑元康"],
    A14587957648060F44E5F3ACE1BCB41F37CB5D9E27347E: ["泰山三村", "吴慧谦"],
    A145879584733530F69D21DBADBA1ED0BCD1CDA87A777D: ["白玉新村(新苑)", "郑元康"],
    A1462595875944FECED58CEBDB0954D2C956CD8C8656D3: ["曹家巷自营", "郑元康"],
    A1462765703032AF9CB326A57D8F6EF06FD99392C9E611: ["长风一村自营", "郑元康"],
    A14634497379316BD95D5FC4B75DCB76F3417C3A913732: ["宋家滩", "郑元康"],
    A1463706393185718428F6C38C245A40ACA013B586BBEA: ["长风馨苑", "郑元康"],
    A1480844021638C57E8D0832BFC31E4C0D78FB6CFF3BD9: ["番禺路定西路自营", "董凯敏"],
    A1491048899345E0D397D677A5060344A015906637F6C6: ["共康四村", "郑元康"],
    A149206574996913FF90364A0A444182E80C06FE956D3D: ["共康三村", "郑元康"]
};
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
            // host     : '54.222.179.73',
            // user     : 'image',
            // password : 'image@thinkLight',
            // database : 'image'
        });
        connection.connect();
        connection.query("SELECT park_id, COUNT(*) AS count, SUM(actual_fee) AS sum FROM tb_park_charge_order WHERE crt_time BETWEEN '" + req.query.startDate + "' AND '" + req.query.endDate + "' AND order_category = 'SP' AND ispay = 'Y' AND STATUS = 'R' GROUP BY park_id", function (error, results, fields) {
            if (error) throw error;
            var orders = {};
            results.forEach(function (order) {
                orders[order.park_id] = order;
            });
            connection.query("SELECT park_id, COUNT(*) AS c, SUM(price) AS s FROM tb_park_cost_trade WHERE create_time BETWEEN '" + req.query.startDate + "' AND '" + req.query.endDate + "' AND (type = 'SPOTHER' OR type = 'PAYOTHER') GROUP BY park_id", function (error, results, fields) {
                if (error) throw error;
                results.forEach(function (trade) {
                    if (orders[trade.park_id]) {
                        orders[trade.park_id].c = trade.c;
                        orders[trade.park_id].s = trade.s;
                    } else {
                        orders[trade.park_id] = trade;
                    }
                });
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
                    // str = str + "\n" + key + "," + parkInfo[key][0] + "," + parkInfo[key][1] + "," + orders[key].count + "," + orders[key].sum + "," + (orders[key].count + orders[key].c) + "," + (orders[key].sum - orders[key].s);
                }
                var keys = Object.keys(orders);
                MongoClient.connect(DB_CONN_STR, function (err, db) {
                    getInfo(db, 0, keys, function (obj) {
                        res.send(obj);
                    });
                    db.close();
                });
                connection.end();
                querying = false;
            });
        });
    }
});

function getInfo(db, index, keys, callback) {
    var obj = db.collection('conch_ParkBasic').findOne({lmd_parkId: keys[index], isDiscard: 'N'});
    callback(obj);
}

module.exports = router;
