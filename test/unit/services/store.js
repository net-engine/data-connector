'use strict';

describe('Service: store', function () {
  angular.module('app', ['dataConnector']).config(function (storeProvider) {
    storeProvider.setBaseUrl('/api/v1/');
  });

  angular.module('app').service('CatService', function (collection) {
    return collection.create('cats-service');
  });

   angular.module('app').service('DogService', function (collection) {
    return collection.create('dogs-service');
  });

  beforeEach(module('app'));

  var store;
  var collection;
  var $httpBackend;
  var CatService1, CatService2;
  var DogService1, DogService2;

  beforeEach(inject(function ($injector) {
    store = $injector.get('store');
    collection = $injector.get('collection');
    CatService1 = $injector.get('CatService'); 
    CatService2 = $injector.get('CatService'); 

    DogService1 = $injector.get('DogService'); 
    DogService2 = $injector.get('DogService');

    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should return a Collection method', function () {
    expect(!!collection.create).toBe(true);
  });

  describe('initialisation', function () {
    it('should always return the same collection from the store', function () {
      CatService1.add({ id: 1, name: 'Felix' });

      expect(CatService1.all()).toEqual(CatService2.all());

      expect(CatService1.all()[0].name).toEqual('Felix');
      expect(CatService2.all()[0].name).toEqual('Felix');

      expect(CatService1.all().length).toEqual(1);
      expect(CatService2.all().length).toEqual(1);

      CatService2.add({ id: 2, name: 'Silvestor' });

      expect(CatService1.all()).toEqual(CatService2.all());

      expect(CatService1.all()[1].name).toEqual('Silvestor');
      expect(CatService2.all()[1].name).toEqual('Silvestor');

      expect(CatService1.all().length).toEqual(2);
      expect(CatService2.all().length).toEqual(2);
    });
  });

  describe('#Collection', function () {
    var Cat;
    var Dog;

    beforeEach(function () {
      Cat = collection.create('cats');
    });    

    it('should build a Collection instance with passed identifier', function () {
      expect(Cat._identifier).toBe('cats');
    });

    it('should build a Collection instance with a URL', function () {
      expect(Cat.url).toBe('/api/v1/cats');
    });

    it('should add the Collection to the store', function () {
      expect(store.dump().cats.length).toEqual(0);
    });

    describe('#add', function () {
      it('should add an item to the correct collection in the store', function () {
        Cat.add({ id: 1, name: 'Felix' });

        expect(store.dump().cats.length).toBe(1);
      });

      it('should extend, not replace, an existing item', function () {
        var felix = Cat.add({ id: 1, name: 'Felix' });
        var felixUpdated = Cat.add({ id: 1, name: 'Felix', legs: 4 });

        expect(felix).toBe(felixUpdated);
        expect(felix.name).toEqual('Felix');
        expect(felixUpdated.name).toEqual('Felix');
      });
    });

    describe('#create', function () {
      beforeEach(function () {
        $httpBackend.when('POST', '/api/v1/cats')
          .respond(201, {
            cats: [{ id: 1, name: 'Felix' }]
          });
      });

      it('should make a request', function () {
        $httpBackend.expect('POST', '/api/v1/cats');
        Cat.create({ name: 'Felix' });
      });

      it('should add to an Item to the correct collection', function () {
        $httpBackend.expect('POST', '/api/v1/cats');
        Cat.create({ name: 'Felix' });
        $httpBackend.flush();
        expect(Cat.all().length).toBe(1);
        expect(Cat.find(1).name).toBe('Felix');
      });
    });

    describe('#all', function () {
      it('should return all items from the correct store', function () {
        Cat.add({ id: 1, name: 'Felix' });
        Cat.add({ id: 2, name: 'Silvestor'  })

        expect(Cat.all()[0].name).toBe('Felix');
        expect(Cat.all()[1].name).toBe('Silvestor');
      });
    });

    describe('#fetchAll', function () {
      beforeEach(function () {
        $httpBackend.when('GET', '/api/v1/cats')
          .respond(201, {
            cats: [
              { id: 1, name: 'Felix' },
              { id: 2, name: 'Silvestor' }
            ]
          });
      });

      it('should make a request', function () {
        $httpBackend.expect('GET', '/api/v1/cats');
        Cat.fetchAll();
      });

      it('should populate the correct collection', function () {
        $httpBackend.expect('GET', '/api/v1/cats');
        Cat.fetchAll();
        $httpBackend.flush();
        expect(Cat.all().length).toBe(2);
      });
    });

    describe('#find', function () {
      it('should find the correct item', function () {
        Cat.add({ id: 1, name: 'Felix' });
        Cat.add({ id: 2, name: 'Silvestor' });

        expect(Cat.find(1).name).toBe('Felix');
        expect(Cat.find(2).name).toBe('Silvestor');
      });
    });

    describe('#remove', function () {
      it('should remove the correct item', function () {
        Cat.add({ id: 1, name: 'Felix' });
        Cat.remove(1);
        
        expect(Cat.find(1)).toBe(undefined);
      });
    });

    describe('model.relationships', function () {
      describe('#hasMany', function () {
        beforeEach(function () {
          Cat = collection.create('cats-related', { 
            relationships: {
              'dogs': {
                kind: 'hasMany',
                collection: 'dogs-related',
                foreignKey: 'cat_id'
              }
            } 
          });
          Dog = collection.create('dogs-related');
        });

        it('should return an array of associated items', function () {
          Cat.add({ id: 1, name: 'Felix' });
          Dog.add({ id: 1, name: 'Fido', cat_id: 1 });
          
          expect(Cat.find(1).dogs[0].name).toEqual('Fido');
        });

        describe('the returned array', function () {
          it('should have a #add collection method', function () {
            Cat.add({ id: 1, name: 'Felix' });
            Dog.add({ id: 1, name: 'Fido', cat_id: 1 });
            Cat.find(1).dogs.add({ id: 2, name: 'Rover', cat_id: 1 });
            
            expect(Cat.find(1).dogs.find(2).name).toEqual('Rover');
          });

          it('should have a #find collection method', function () {
            Cat.add({ id: 1, name: 'Felix' });
            Dog.add({ id: 1, name: 'Fido', cat_id: 1 });
            
            expect(Cat.find(1).dogs.find(1).name).toEqual('Fido');
          });

          it('should have a #remove collection method', function () {
            Cat.add({ id: 1, name: 'Felix' });
            Dog.add({ id: 1, name: 'Fido', cat_id: 1 });
            Cat.find(1).dogs.remove(1);

            expect(Cat.find(1).dogs.find(1)).toEqual(undefined);
          });
        });
      });

      describe('#hasOne', function () {
        beforeEach(function () {
          Cat = collection.create('cats-related', { 
            relationships: {
              'dog': {
                kind: 'hasOne',
                collection: 'dogs-related',
                foreignKey: 'cat_id'
              }
            } 
          });
          Dog = collection.create('dogs-related');
        });

        it('should return the associated items', function () {
          Cat.add({ id: 1, name: 'Felix' });
          Dog.add({ id: 1, name: 'Fido', cat_id: 1 });
          
          expect(Cat.find(1).dog.name).toEqual('Fido');
        });
      });
    });
  });
});
