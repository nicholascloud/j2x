var fs = require('fs'),
  path = require('path'),
  mocha = require('mocha'),
  assert = require('chai').assert,
  j2x = require('../j2x');

var ALBUMS_PATH = path.join(__dirname, 'fake', 'artists.json');

describe('j2x', function () {

  var data = {};

  beforeEach(function (done) {
    fs.readFile(ALBUMS_PATH, function (err, read) {
      if (err) return done(err);
      try {
        data = JSON.parse(read);
      } catch (e) {
        err = e;
      }
      if (err) return done(err);
      done();
    });
  });

  it('should spit out xml', function (done) {
    j2x(data, function (err, xml) {
      if (err) return done(err);
      assert.isTrue(xml.length > 0);
      console.log(xml);
      done();
    });
  });
});