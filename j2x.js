'use strict';

var inflection = require('inflection'),
  entities = require('entities');

function Element(name, data) {
  this.name = name;
  this.attributes = [];
  this.children = [];

  var self = this;

  if (Array.isArray(data)) {
    self.name = inflection.pluralize(name);
    data.forEach(function (item) {
      var singular = inflection.singularize(name);
      self.children.push(new Element(singular, item));
    });
  } else if (data instanceof Object) {
    Object.keys(data).forEach(function (key) {
      var property = data[key];
      if (Array.isArray(property) || property instanceof Object) {
        self.children.push(new Element(key, property));
      } else {
        self.attributes.push(new Attribute(key, entities.encode(property.toString(), 0)));
      }

    });
  } else if (typeof data === 'string' || data instanceof String) {
    self.children.push(entities.encode(data, 0));
  } else {
    self.children.push(data);
  }
}

Element.TEMPLATE = '<{name} {attributes}>{children}</{name}>';
Element.SELF_CLOSING_TEMPLATE = '<{name} {attributes} />';
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

  if (this.children.length) {
    return Element.TEMPLATE.replace(Element.NAME_REGEX, this.name)
      .replace(Element.ATTR_REGEX, attributes)
      .replace(Element.CHILD_REGEX, children)
      .trim();
  }

  return Element.SELF_CLOSING_TEMPLATE.replace(Element.NAME_REGEX, this.name)
    .replace(Element.ATTR_REGEX, attributes)
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