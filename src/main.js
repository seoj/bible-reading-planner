const angular = require('angular');
const IndexCtrl = require('./index-ctrl');

angular.module('brp', [])
  .controller('IndexCtrl', IndexCtrl);
