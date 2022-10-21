const http = require('http');
const https = require('https');
const cheerio = require('cheerio');
const Datastore = require('nedb');
const db = {};

// 获取正确的请求头
function getHttp(url) {
  if (url.indexOf('https' !== -1)) {
    return https;
  } else {
    return http;
  }
}

// 初始化
function dbInit(type, isInitAll = false) {
  switch (type) {
    case 1: {
      db.test = new Datastore({
        filename: './database/test.nedb',
        autoload: true,
        timestampData: true,
      });
      if (!isInitAll) break;
    }
    default: {
      alert('init all success');
    }
  }
}

// 增
function dbInsert(type) {
  // 获取内容
  const getCon1 = (str) => ({
    id: str.toLocaleLowerCase(),
    name: `友人${str.toLocaleUpperCase()}`,
  });
  switch (type) {
    case 1: {
      db.test.insert(getCon1('a'), function (err, newDocs) {
        console.log('insert 1:', newDocs);
      });
      break;
    }
    case 2: {
      // 26英文字母
      const letterArr = 'abcdefghijklmnopqrstuvwxyz'.split('');
      letterArr.forEach((item) => {
        db.test.insert(getCon1(item), function (err, newDocs) {
          console.log('insert 2:', newDocs);
        });
      });
      break;
    }
    default: {
      console.log('dbInsert no type');
    }
  }
}

// 删
function dbRemove(type) {
  switch (type) {
    case 1: {
      // 删除1条记录
      db.test.remove({ id: 'a' }, {}, function (err, numRemoved) {
        console.log('remove one', numRemoved);
      });
      break;
    }
    case 2: {
      // 删除多条记录
      db.test.remove({ a: 5 }, { multi: true }, function (err, numRemoved) {
        console.log('remove multi', numRemoved);
      });
    }
    case 3: {
      // 删除所有记录
      db.test.remove({}, { multi: true }, function (err, numRemoved) {
        console.log('remove all', numRemoved);
      });
      break;
    }
    default: {
      console.log('dbRemove no type');
    }
  }
}

// 改
function dbUpdate(type) {
  switch (type) {
    case 1: {
      db.test.update(
        { id: 'a' },
        { id: 'b', change: true },
        {},
        function (err, numAffected, affectedDocuments, upsert) {
          console.log('update 1', numAffected, affectedDocuments, upsert);
        }
      );
      break;
    }
    case 2: {
      // 设定一个不存在字段的值
      db.test.update(
        { id: 'a' },
        { $set: { change: true, arr: [1] } },
        {},
        function (err, numAffected, affectedDocuments, upsert) {
          console.log('update 2', numAffected, affectedDocuments, upsert);
        }
      );
      break;
    }
    case 3: {
      // 删除一个字段
      db.test.update(
        { id: 'a', change: true },
        { $unset: { arr: [1] } },
        {},
        function (err, numAffected, affectedDocuments, upsert) {
          console.log('update 3', numAffected, affectedDocuments, upsert);
        }
      );
      break;
    }
    case 4: {
      // 设置upsert
      db.test.update(
        { id: 'a', change: true },
        { change: false, arr: [1] },
        { upsert: true },
        function (err, numAffected, affectedDocuments, upsert) {
          console.log('update 4', err, numAffected, affectedDocuments, upsert);
        }
      );
      break;
    }
    case 5: {
      // 设置upsert
      db.test.update(
        { id: 'a' },
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
        { upsert: true },
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
      db.test.find({ id: 'a' }, function (err, docs) {
        console.log('find 1:', docs.length, docs);
      });
      break;
    }
    case 2: {
      // 单字段查询单数据查询
      db.test.findOne({ id: 'a' }, function (err, docs) {
        console.log('find 2:', docs);
      });
      break;
    }
    case 3: {
      // 正则表达式查询
      db.test.find({ id: /[bc]/ }, function (err, docs) {
        console.log('find 3:', docs.length, docs);
      });
      break;
    }
    case 4: {
      // 多条件查询
      db.test.find({ id: 'b', change: true }, function (err, docs) {
        console.log('find 4:', docs.length, docs);
      });
      break;
    }
    case 5: {
      // 查询所有结果集
      db.test.find({}, function (err, docs) {
        console.log('find 5:', docs.length, docs);
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
      db.test.find(
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
      db.test.find(
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
      db.test.find(
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
  const url = 'https://juejin.cn/';
  getHttp(url).get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => {
      rawData += chunk;
    });
    res.on('end', () => {
      try {
        console.log(rawData);
      } catch (e) {
        console.error(e.message);
      }
    });
  });
  const $ = cheerio.load('<div id="fruits">apple</div>');
}

dbInit(1);
// dbInsert(1);
// dbRemove(1);
dbUpdate(5);
dbFind(1);
