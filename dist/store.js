'use strict';

/*!
 * koa-generic-session-mongo
 * Copyright(c) 2013 Pavel Vlasov <freakycue@gmail.com>
 * MIT Licensed
 */

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _events = require('events');

var _mongodb = require('mongodb');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var log = (0, _debug2['default'])('koa-generic-session-mongo:store');
var ONE_DAY = 86400 * 1000;
var DEFAULT_COLLECTION = 'sessions';

var MongoStore = (function (_EventEmitter) {
  _inherits(MongoStore, _EventEmitter);

  /**
   * Initialize MongoStore with the given `options`.
   *
   * @param {Object} options
   * @api public
   */

  function MongoStore() {
    var _this = this;

    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, MongoStore);

    _get(Object.getPrototypeOf(MongoStore.prototype), 'constructor', this).call(this);
    var db = options.db;
    var collection = options.collection;
    var url = options.url;
    var user = options.user;
    var password = options.password;

    if (url && ('host' in options || 'port' in options || 'db' in options || 'ssl' in options)) {
      throw new Error('url option is exclusive from host, port, db and ssl options, please include as a full url connection string');
    }

    this.col = db && typeof db !== 'string' && typeof db.dropDatabase === 'function' ? this._initWithDb({ db: db, collection: collection }) : this._initWithUrl({
      url: url || MongoStore._makeConnectionString(options),
      user: user,
      password: password,
      collection: collection
    });

    this.col.then(MongoStore._ensureIndexes).then(function (collection) {
      _this.emit('connect', collection);
    })['catch'](function (err) {
      _this.emit('error', err);
    });
  }

  /**
   * Init session collection with given database object
   * @param db Database object
   * @param collection Collection name which will store our sessions
   * @returns {Promise.<*>}
   * @private
   */

  _createClass(MongoStore, [{
    key: '_initWithDb',
    value: function _initWithDb(_ref) {
      var db = _ref.db;
      var _ref$collection = _ref.collection;
      var collection = _ref$collection === undefined ? DEFAULT_COLLECTION : _ref$collection;

      return _Promise.resolve(db.collection(collection));
    }

    /**
     *
     * @param url Connection string to db
     * @param user
     * @param password
     * @param collection Collection name which will store our sessions
     * @returns {Promise}
     * @private
     */
  }, {
    key: '_initWithUrl',
    value: function _initWithUrl(_ref2) {
      var url = _ref2.url;
      var user = _ref2.user;
      var password = _ref2.password;
      var _ref2$collection = _ref2.collection;
      var collection = _ref2$collection === undefined ? DEFAULT_COLLECTION : _ref2$collection;

      return new _Promise(function (resolve, reject) {
        new _mongodb.MongoClient().connect(url, function (err, db) {
          if (err) {
            reject(err);
            return;
          }
          var col = db.collection(collection);
          if (user && password) {
            db.authenticate(user, password, function (err, res) {
              if (err) {
                reject(err);
              } else if (!res) {
                reject(new Error('mongodb authentication failed'));
              } else {
                resolve(col);
              }
            });
          } else {
            resolve(col);
          }
        });
      });
    }
  }, {
    key: 'get',

    /**
     * Attempt to fetch session by the given `sid`.
     *
     * @param {String} sid
     * @param {Function} fn
     * @api public
     */
    value: function get(sid) {
      var col;
      return _regeneratorRuntime.async(function get$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            context$2$0.next = 2;
            return _regeneratorRuntime.awrap(this.col);

          case 2:
            col = context$2$0.sent;
            context$2$0.next = 5;
            return _regeneratorRuntime.awrap(col.findOne({ sid: sid }, { _id: 0, ttl: 0, sid: 0 }));

          case 5:
            return context$2$0.abrupt('return', context$2$0.sent);

          case 6:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }

    /**
     * Commit the given `sess` object associated with the given `sid`.
     *
     * @param {String} sid
     * @param {Session} sess
     * @api public
     */
  }, {
    key: 'set',
    value: function set(sid, sess, ttl) {
      var maxAge, col;
      return _regeneratorRuntime.async(function set$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            // clone original sess
            sess = _extends({}, sess);
            maxAge = sess.cookie && (sess.cookie.maxAge || sess.cookie.maxage);
            context$2$0.next = 4;
            return _regeneratorRuntime.awrap(this.col);

          case 4:
            col = context$2$0.sent;

            sess.sid = sid;
            sess.ttl = new Date((ttl || ('number' == typeof maxAge ? maxAge : ONE_DAY)) + Date.now());

            context$2$0.next = 9;
            return _regeneratorRuntime.awrap(col.update({ sid: sid }, sess, { upsert: true }));

          case 9:
            return context$2$0.abrupt('return', context$2$0.sent);

          case 10:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param {String} sid
     * @api public
     */
  }, {
    key: 'destroy',
    value: function destroy(sid) {
      var col;
      return _regeneratorRuntime.async(function destroy$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            context$2$0.next = 2;
            return _regeneratorRuntime.awrap(this.col);

          case 2:
            col = context$2$0.sent;
            context$2$0.next = 5;
            return _regeneratorRuntime.awrap(col.remove({ sid: sid }));

          case 5:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }
  }], [{
    key: '_makeConnectionString',
    value: function _makeConnectionString(_ref3) {
      var _ref3$host = _ref3.host;
      var host = _ref3$host === undefined ? '127.0.0.1' : _ref3$host;
      var _ref3$port = _ref3.port;
      var port = _ref3$port === undefined ? 27017 : _ref3$port;
      var _ref3$db = _ref3.db;
      var db = _ref3$db === undefined ? 'test' : _ref3$db;
      var _ref3$ssl = _ref3.ssl;
      var ssl = _ref3$ssl === undefined ? false : _ref3$ssl;

      return 'mongodb://' + host + ':' + port + '/' + db + '?ssl=' + ssl;
    }

    /**
     * Create ttl and sid indexes
     * @param col
     * @returns {Promise}
     */
  }, {
    key: '_ensureIndexes',
    value: function _ensureIndexes(col) {
      return new _Promise(function (resolve, reject) {
        var times = 2;

        function done(err) {
          if (err) {
            reject(err);
          } else if (--times < 1) {
            resolve(col);
          }
        }

        col.ensureIndex({ ttl: 1 }, { expireAfterSeconds: 0 }, done);
        col.ensureIndex({ sid: 1 }, { unique: true }, done);
      });
    }
  }]);

  return MongoStore;
})(_events.EventEmitter);

exports['default'] = MongoStore;
module.exports = exports['default'];