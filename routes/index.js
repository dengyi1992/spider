var express = require('express');
var request = require('request');
var mysql = require('mysql');
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'dengyi',
    database: 'douyu',
    port: 3306
});
var page=0;
var EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});
router.get('/sendjson', function (req, res, next) {
    //防止多次提交

    if(page==0){
        sub();
    }else {
        return res.json({err: '正在传输数据中...'})

    }
    return res.json({success: 'copy that'})

});

myEvents.on('douyu', function () {
    var times=[];
    for (var i = 0; i < 60; i = i + 5) {
        times.push(i);
    }
// schedule.scheduleJob(rule, function () {
//     var page = timeTask.timeTask1();
//     if (page > 40) {
//         this.cancel()
//
//     }
//     console.log("------------" + new Date())
// });
    rule.second = times;
    schedule.scheduleJob(rule, function () {
        if (page<42){
            selectAndSend();
        }else {
            page=0;
            this.cancel();
        }
    });
});


function selectAndSend() {
    var selectSql='SELECT * FROM dy ORDER BY id desc limit ' +parseInt(page)*100+ ', 100;';
    conn.query(selectSql,function (err,rows,fields) {
        if (err){
            return console.log(err)
        }
        console.log(rows);
        var options = {
            headers: {"Connection": "close"},
            url: 'http://127.0.0.1:3000/douyu',
            method: 'POST',
            json: true,
            body: {data:rows}
        };

        function callback(error, response, data) {
            if (!error && response.statusCode == 200) {
                console.log('----info------', data);

            }
        }

        request(options, callback);
    });
    page++;
};
var mypretime=0;
function sub(){
    var Today = new Date();
    var NowHour = Today.getHours();
    var NowMinute = Today.getMinutes();
    var NowSecond = Today.getSeconds();
    var mysec = (NowHour*3600)+(NowMinute*60)+NowSecond;
    if((mysec-mypretime)>10){
//10只是一个时间值，就是10秒内禁止重复提交，值随便设
        mypretime=mysec;
    }else{
        return;
    }
    myEvents.emit('douyu');
}
module.exports = router;
