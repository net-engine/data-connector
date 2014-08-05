# Data Connector

[WIP]!

Kind of a little client side DB, mostly an ajax abstraction layer.

## Intended Use

Include `dataConnector` in your app initialization.

Make collections with the store's collection method.

```js
angular.module('myApp')
  .factory('Cat', ['store', function Cat(store) {
    return store.collection('cats');
  });

angular.module('myApp')
  .factory('Dog', ['store', function Dog(store) {
    return store.collection('dogs');
  });
```

The store is a POJO with a key for each collection.

```js
{ cats: [], dogs: [] }
```

Collections are decorated instances of Array. 
They look and behave like arrays, they just have some extra juice.

```js
var felix = Cat.add({ id: 1, name: 'Felix' });

Cat.forEach(function (cat) {
  console.log(cat);
});
// logs { id: 1, name: 'Felix' }

Cat.all();
// returns [{ id: 1, name: 'Felix' }]

Cat.find(1);
// returns { id: 1, name: 'Felix' }
```

Before you use your collection in a controller you should load your data in a resolve function.
Collections have #fetch and fetchAll methods for making get requests to your API.

```js
$stateProvider.state('app.cats', {
  url: '/cats',
  title: 'Cats',
  resolve: {
    load: function(Cat) {
      return Cat.fetchAll();
    }
  }
});

$stateProvider.state('app.cats.cat', {
  url: '/:catId',
  title: 'Cat',
  resolve: {
    load: function($stateParams, Cat) {
      return Cat.fetch($stateParams.id);
    }
  }
});
```

When the promise returned by the #fetchAll method resolves the `store` will be full of cats...

Now use your collection service whenever you need something from the collection.

```js
angular.module('myApp')
  .controller('CatIndexCtrl', ['Cat', function ($scope, Cat) {
    $scope.cats = Cat.all();
  }]);
```

Because Angular has instanitated both our `store` and `Cat` services only once, the same collection is available throughout your app.

**From the docs**

"Note: All services in Angular are singletons. That means that the injector uses each recipe at most once to create the object. The injector then caches the reference for all future needs."

```js
angular.module('myApp')
  .controller('DogIndexCtrl', function ($scope, Dog, Cat) {
    $scope.dogs = Dog.all();
    $scope.cats = Cat.all(); // This is exactly the same collection as above
  }]);
```

## Model Relationships

When you define a collection you get the chance to provide some relationship data.

```js
// The Cat service
return store.Collection('cats', { 
  relationships: {
    'dogs': {
      kind: 'hasMany',
      collection: 'dogs',
      foreignKey: 'cat_id'
    }
  } 
});

// The Dog service
return store.Collection('dogs');

// ... after data has been recieved from an API records are added to the store.
Cat.add({ id: 1, name: 'Felix' });
Dog.add({ id: 1, name: 'Fido', cat_id: 1 });

// Some controller
Cat.find(1).dogs
// returns [{ id: 1, name: 'Fido', cat_id: 1 }]
```

Arrays returned from a relationship are similarly decorated with helper functions. 
They also contain a reference to their master collection in the sore.
