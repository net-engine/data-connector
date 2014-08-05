'use strict';

angular.module('dataConnector')
  .provider('store', function () {
    var store = {};
    var baseUrl = '/';

    this.setBaseUrl = function (url) {
      baseUrl = url;
      return baseUrl;
    };

    this.dump = function () {
      return store;
    };

    this.$get = function () {
      this.store = store;
      this.baseUrl = baseUrl;
      return this;
    };
  });
