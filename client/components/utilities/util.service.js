/* Created by Leo on 05/08/2015. */
'use strict';

if (!Array.prototype.last)
  Array.prototype.last = function() {
    if (this.length>0)
      return this[this.length-1];
  };



angular.module('quiApp')
  .factory('util', [function() {

    function merge(v, template) {
      template = template || '00';
      v = ''+v;
      return (v && v.length<template.length) ? template.substr(0,template.length- v.length)+v : v;
    }

    function getDate(d, type) {
      var dt = d ? new Date(d) : new Date();
      switch (type){
        case 'time-full':
        case 'time':
          return merge(dt.getHours()) + ':' + merge(dt.getMinutes()) + ':' + merge(dt.getSeconds());
        case 'time-small':
          return merge(dt.getHours()) + ':' + merge(dt.getMinutes());
        case 'date':
          return merge(dt.getDate()) + '/' + merge(dt.getMonth() + 1) + '/' + dt.getFullYear();
        case 'full':
        default:
          return merge(dt.getDate()) + '/' + merge(dt.getMonth() + 1) + '/' + dt.getFullYear() + ' ' + merge(dt.getHours()) + ':' + merge(dt.getMinutes()) + ':' + merge(dt.getSeconds());
      }
    }

    function forEachX(arr, action){
      if (arr && arr.length)
        arr.forEach(action);
    }

    return {
      getDate:getDate,
      for:forEachX
    };
  }]);
