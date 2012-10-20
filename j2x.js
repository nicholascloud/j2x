'use strict';

var inflection = require('inflection'),
  entities = require('entities');

var DEFAULT_XML_ROOT = 'root';

function Element(name, obj) {
  this.name = name;
  this.attributes = [];
  this.children = [];

  var self = this;

  if (Array.isArray(obj)) {
    self.name = inflection.pluralize(name);
    obj.forEach(function (item) {
      var singular = inflection.singularize(name);
      self.children.push(new Element(singular, item));
    });
  } else if (obj instanceof Object) {
    Object.keys(obj).forEach(function (key) {
      self.children.push(new Element(key, obj[key]));
    });
  } else if (typeof obj === 'string' || obj instanceof String) {
    self.children.push(entities.encode(obj, 0));
  } else {
    self.children.push(obj);
  }
}

Element.TEMPLATE = '<{name} {attributes}>{children}</{name}>';
Element.NAME_REGEX = /{name}/g;
Element.ATTR_REGEX = /\s{attributes}/g;
Element.CHILD_REGEX = /{children}/g;

Element.prototype.toString = function () {
  var attributes = this.attributes.map(function (attr) {
    return attr.toString();
  }).join(' ');

  if (attributes.length) {
    //pad space left
    attributes = ' ' + attributes;
  }

  var children = this.children.map(function (child) {
    return child.toString();
  }).join('');

  return Element.TEMPLATE.replace(Element.NAME_REGEX, this.name)
    .replace(Element.ATTR_REGEX, attributes)
    .replace(Element.CHILD_REGEX, children)
    .trim();
};

function Attribute(name, value) {
  this.name = name;
  this.value = value;
}

Attribute.TEMPLATE = '{name}="{value}"';
Attribute.NAME_REGEX = /{name}/g;
Attribute.VALUE_REGEX = /{value}/g;

Attribute.prototype.toString = function () {
  return Attribute.TEMPLATE.replace(Attribute.NAME_REGEX, this.name)
    .replace(Attribute.VALUE_REGEX, this.value)
    .trim();
};

module.exports = function (json, rootName, callback) {
  if (arguments.length === 2) {
    callback = rootName;
    rootName = '';
  }

  var error = null,
    xml = '';

  if (typeof json === 'string') {
    try {
      json = JSON.parse(json);
    } catch (e) {
      error = e;
    }
  }

  if (error) return callback(error);

  try {
    var element = new Element(rootName, json);
    xml = element.toString();
  } catch (e) {
    error = e;
  }

  if (error) return callback(error);

  callback(null, xml);
};