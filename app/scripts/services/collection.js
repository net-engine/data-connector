'use strict';

angular.module('dataConnector')
  .factory('collection', ['$http', 'store', function ($http, store) {
    var baseUrl = store.baseUrl;
    var store = store.store;

    var relationshipMethods = {
      hasMany: hasMany,
      hasOne: hasOne
    };

    function all () {
      return this;
    }

    function find (id) {
      return _.find(this, { id: id });
    }

    function add (content) {
      var resource;
      var existingItem;
      var collection = store[this._identifier];

      if (this !== collection) {
        resource = collection.add(content);
        return this.push(resource);

      } else {   
        existingItem = collection.find(content.id);

        if (existingItem) {
          return _.extend(existingItem, content);
        
        } else {
          resource = new Item(this, content)
          this.push(resource);
          return resource;
        
        }
      }
    }

    function remove (id) {
      var resource = this.find(id);
      var collection = store[this._identifier];

      if (this !== collection) {
        collection.remove(id);
      } 

      this.splice(_.indexOf(this, resource), 1);
      return 1;
    }

    function collectionMaker (identifier, model) {
      if (store[identifier]) {
        throw new Error(identifier + ' collection already exists');
      }

      var collection = new Array();
      var model = model || {};
      var url = model.url || (baseUrl + identifier);

      Object.defineProperties(collection, {
        '_identifier': {
          value: identifier
        },
        '_model': {
          value: model
        },
        'url': {
          writeable: true,
          value: url
        },
        'all': {
          value: all
        },
        'add': {
          value: add
        },
        'find': {
          value: find
        },
        'remove': {
          value: remove 
        },
        'receiveCollection': {
          writeable: true,
          value: function (response) {
            var collection = this;
            response.data[this._identifier].forEach(function(item) {
              collection.add(item);
            });
          } 
        },
        'create': {
          writable: true,
          value: function create (attributes) {
            var collection = this;
            var payload = {};
            payload[collection._identifier] = [attributes];

            return $http.post(collection.url, payload)
              .then(function (response) {
                collection.receiveCollection(response);
              });
          }
        },
        'fetchAll': {
          writable: true,
          value: function fetchAll () {
            var collection = this;

            return $http.get(collection.url)
              .then(function (response) {
                collection.receiveCollection(response);
              });
          }
        },
        'fetch': {
          writable: true,
          value: function fetch (id) {
            var collection = this;

            return $http.get(collection.url + '/' + id)
              .then(function (response) {
                collection.receiveCollection(response);
              });
          }
        }
      });

      store[identifier] = collection;

      return collection;
    }

    function relationMaker (identifier, items) {
      var subset = Array.apply([], items);

      Object.defineProperties(subset, {
        '_identifier': {
          value: identifier
        },
        'add': {
          value: add
        },
        'find': {
          value: find
        },
        'remove': {
          value: remove
        }
      });

      return subset;
    }

    function hasMany (rel) {
      var collection = store[rel.collection];
      var query = {};
      query[rel.foreignKey] = this.id;
      var items = _.where(collection, query);

      return relationMaker(collection._identifier, items);
    }

    function hasOne (rel) {
      var query = {};
      query[rel.foreignKey] = this.id;

      return _.find(store[rel.collection], query);
    }

    function Item (collection, content) {
      var model = collection._model;
      var relationships = model.relationships;

      this._identifier = collection._identifier;

      for (var identifier in relationships) {
        var rel = relationships[identifier];

        Object.defineProperty(this, identifier, {
          get: function () {
            return relationshipMethods[rel.kind].call(this, rel);
          }
        });
      }

      _.extend(this, content);
    }

    Item.prototype.update = function update (attributes) {
      function create (attributes) {
        var collection = store[this._identifier];
        var payload = {};
        payload[this._identifier] = [attributes];

        return $http.put(collection.url + '/' + this.id, payload)
          .then(function (response) {
            collection.receiveCollection(response);
            
            return this;
          });
      }
    };

    Item.prototype.destroy = function destroy () {
      var collection = store[this._identifier];
      var item = this;

      return $http.delete(collection.url + '/' + item.id)
        .then(function(response) {
          collection.remove(item.id);
          
          return response.data;
        });
    }

    return {
      create: collectionMaker
    };
  }]);
