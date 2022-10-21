const http = require('http');
const https = require('https');
const cheerio = require('cheerio');
const Datastore = require('nedb');
const iconv = require('iconv-lite');
const fs = require('fs');
const { prepend } = require('cheerio/lib/api/manipulation');
// const { URL } = require('url');

// 仅针对 https://www.sangwu8.com/
let db = null;

function wait(ms) {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

// await wait(5000);

function compareNumberZH(num, str, rowStr) {
  const numberArr = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const unit = ['', '十', '百', '千', '万'];
  let zhNum = '';
  let remainderStr = String(num);
  for (i = 0; i < remainderStr.length; i++) {
    if (remainderStr[i] * 1 === 0 && zhNum[zhNum.length - 1] !== '零') {
      zhNum += numberArr[remainderStr[i] * 1];
    } else if (remainderStr[i] * 1 === 0 && zhNum[zhNum.length - 1] === '零') {
      zhNum += '';
    } else {
      zhNum += numberArr[remainderStr[i] * 1] + unit[remainderStr.length - 1 - i];
    }
  }
  if (zhNum[zhNum.length - 1] === '零') {
    zhNum = zhNum.slice(0, zhNum.length - 1);
  }
  if (zhNum.search(/^一十[一二三四五六七八九]?$/) !== -1) {
    zhNum = zhNum.replace('一十', '十');
  }
  const zhNumArr = [zhNum, zhNum.replace('二', '两')];

  if (zhNumArr.indexOf(str) === -1) {
    console.log('error:', num, str, rowStr, zhNumArr);
    return false;
  }
  return true;
}

// 获取正确的请求头
function getHttp(url) {
  if (url.indexOf('https' !== -1)) {
    return https;
  } else {
    return http;
  }
}

// 初始化
function dbInit() {
  db = new Datastore({
    filename: './database/fanren.nedb',
    autoload: true,
    timestampData: true,
  });
}

// 增
function dbInsert(type, options) {
  switch (type) {
    case 1: {
      db.insert(options, function (err, newDocs) {
        console.log('insert 1:', newDocs.title, newDocs.url);
      });
      break;
    }
    default: {
      console.log('。。。');
    }
  }
}

// 改
function dbUpdate(type) {
  switch (type) {
    case 1: {
      db.update({ id: 'a' }, { id: 'b', change: true }, {}, function (err, numAffected, affectedDocuments, upsert) {
        console.log('update 1', numAffected, affectedDocuments, upsert);
      });
      break;
    }
    case 2: {
      // 设定一个不存在字段的值
      db.update({ id: 'a' }, { $set: { change: true, arr: [1] } }, {}, function (err, numAffected, affectedDocuments, upsert) {
        console.log('update 2', numAffected, affectedDocuments, upsert);
      });
      break;
    }
    case 3: {
      // 删除一个字段
      db.update({ id: 'a', change: true }, { $unset: { arr: [1] } }, {}, function (err, numAffected, affectedDocuments, upsert) {
        console.log('update 3', numAffected, affectedDocuments, upsert);
      });
      break;
    }
    case 4: {
      // 设置upsert
      db.update({ id: 'a', change: true }, { change: false, arr: [1] }, { upsert: true }, function (err, numAffected, affectedDocuments, upsert) {
        console.log('update 4', err, numAffected, affectedDocuments, upsert);
      });
      break;
    }
    case 5: {
      // 设置upsert
      db.update(
        { id: 'a', change: true },
        // { $push: { arr: 6 } },
        // { $set: {value: 6} },
        { $set: { address: { a: 111, b: 222 } } },
        // { $pop: {arr: 1} },
        // { $pop: {arr: -1} },
        // { $addToSet: {arr: 6} },
        // { $pull: {arr: 6} },
        // { $pull: {arr: {$in: [2, 3]}} },
        // { $push: {arr: {$each: [7, 8]}} },
        // { $push: {arr: {$each: [7, 8], $slice: 5}} },
        // { $min: {value: 5} },
        // { $min: {value: 7} },
        // { $max: {value: 4} },
        // { $max: {value: 7} },
        // { upsert: true },
        function (err, numAffected, affectedDocuments, upsert) {
          console.log('update 5', err, numAffected, affectedDocuments, upsert);
        }
      );
      break;
    }
    default: {
      console.log('dbUpdate no type');
    }
  }
}

// 查
function dbFind(type) {
  switch (type) {
    case 1: {
      // 单字段查询
      db.find({ id: 'a' }, function (err, docs) {
        console.log('find 1:', docs.length, docs);
      });
      break;
    }
    case 2: {
      // 单字段查询单数据查询
      db.findOne({ id: 'a' }, function (err, docs) {
        console.log('find 2:', docs);
      });
      break;
    }
    case 3: {
      // 正则表达式查询
      db.find({ id: /[bc]/ }, function (err, docs) {
        console.log('find 3:', docs.length, docs);
      });
      break;
    }
    case 4: {
      // 多条件查询
      db.find({ id: 'b', change: true }, function (err, docs) {
        console.log('find 4:', docs.length, docs);
      });
      break;
    }
    case 5: {
      // 查询所有结果集
      db.find({})
        .sort({ id: 1 })
        .exec(async function (err, docs) {
          // for (let i = 0; i < docs.length; i++) {
            const item = docs[1];
            // if(item.id % 5 === 0){
            //   console.log(1,(new Date()).toLocaleString());
            //   await wait(10000);
            //   console.log(2,(new Date()).toLocaleString());
            // }
            getChapter(item.url, item.id, item.title);
            
          // }
        });
      break;
    }
    case 6: {
      // 运算符
      // $lt, $lte: 小于，小于等于
      // $gt, $gte: 大于，大于等于
      // $in: 属于
      // $ne, $nin: 不等于，不属于
      // $exists: 取值为true或者false，用于检测文档是否具有某一字段
      // $regex: 检测字符串是否与正则表达式相匹配
      db.find(
        // { 'address.a': 111 },
        // { id: {$gt: 'y'} },
        // { 'address.a': { $gt: 110 } },
        // { 'address.a': { $lt: 112 } },
        // { 'address.a': { $in: [110, 111] } },
        // { id: 'a', 'address.a': { $nin: [110, 111] } },
        { id: 'a', change: { $exists: true } },
        function (err, docs) {
          console.log('find 6:', docs.length, docs);
        }
      );
      break;
    }
    case 7: {
      // 精确查找
      // $size: 匹配数组的大小
      // $elemMatch: 匹配至少一个数组元素
      db.find(
        // { arr: [4, 5, 7, 8] },
        // { arr: {$elemMatch: 7} },
        { arr: { $size: 4 } },
        function (err, docs) {
          console.log('find 7:', docs.length, docs);
        }
      );
      break;
    }
    case 8: {
      // 逻辑运算符
      // $or, $and: 并集，交集 { $op: [query1, query2, ...] }
      // $not: 取非 { $not: query }
      // $where: 条件 { $where: function () { /* object is "this", return a boolean */ } }
      db.find(
        { $or: [{ id: 'c' }, { id: 'd' }] },
        // { $and: [{ change: true }, { id: 'a' }] },
        // { $not: { change: true }, change: {$exists: true} },
        // { id: 'a', $where: function () { return this.address? this.address.a === 111 : false; } },
        function (err, docs) {
          console.log('find 8:', err, docs.length, docs);
        }
      );
      break;
    }
    case 9: {
      // 排序和分页
      // sort: 1 正序 -1 逆序
      // skip: 跳过前面 xx 个再取值
      // limit: 取前面的 xx 个值

      db.test
        .find({})
        // .sort({ id: 1 })
        // .sort({ id: -1 })
        .sort({ id: 1, value: 1 })
        .skip(0)
        .limit(10)
        .exec(function (err, docs) {
          console.log(
            'docs=',
            docs.length,
            docs.map((item) => item._id + '--' + item.id + '--' + item.value)
          );
        });
      break;
    }
    default: {
      console.log(' dbFind no type');
    }
  }
}

// 开始
function start() {
  const url = 'https://www.sangwu8.com/book/4/4247/';
  // const options = new URL(url);
  getHttp(url).get(url, (res) => {
    var chunks = [];
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    res.on('end', () => {
      try {
        const decodedData = iconv.decode(Buffer.concat(chunks), 'gbk');
        // console.log(decodedData);
        const $ = cheerio.load(decodedData);
        // const titleMap = new Map();
        dbInit();
        let index = 1;
        $('.main')
          .find('dl dd>a')
          .each(function () {
            const that = $(this);
            if (that.text().search(/第[零一二两三四五六七八九十百千万]+章/) !== -1) {
              // titleMap.set(that.text(), that.attr('href'))
              dbInsert(1, {
                id: index,
                title: that.text(),
                url: `https://www.sangwu8.com/book/4/4247/${that.attr('href')}`,
              });
              index++;
            }
          });
        // console.log(titleMap);
      } catch (e) {
        console.error(e.message);
      }
    });
  });
}

function getChapter(url, id, title) {
  console.log("begin", id);
  console.log(url);
  getHttp(url).get(url, (res) => {
    console.log(url, res);
    var chunks = [];
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    res.on('end', () => {
      try {
        const decodedData = iconv.decode(Buffer.concat(chunks), 'gbk');
        // console.log(decodedData);
        const $ = cheerio.load(decodedData);
        const txt = $('.centent').prepend(`&nbsp;&nbsp;&nbsp;&nbsp;${title}\n\n`).text().replace(/\s+/g, '\n');
        console.log("获取成功", txt.length, title);
        if (txt.length > 1000) {
          db.update(
            { id },
            {
              $set: {
                haveCon: true,
                content: txt,
              },
            },
            {},
            function () {
              console.log('update success', title);
            }
          );
        } else {
          db.update(
            { id },
            {
              $set: {
                haveCon: false,
              },
            },
            {},
            function () {
              console.log('update error', title);
            }
          );
          fs.appendFileSync('./log/mainLog.txt', "resion 1");
        }
      } catch (e) {
        console.error(e.message);
        fs.appendFileSync('./log/mainLog.txt', "resion 2");
      }
    });
    console.log("end", id);
  });
}

// start()

dbInit();
dbFind(5);

// fs.appendFileSync('./book/凡人修仙传.txt', txt);
