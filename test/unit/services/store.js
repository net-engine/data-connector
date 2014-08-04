'use strict';

describe('Service: store', function () {

  beforeEach(module('persistence'));

  var store;
  var $httpBackend;
  beforeEach(inject(function ($injector) {
    store = $injector.get('store');
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should return a Collection method', function () {
    expect(!!store.Collection).toBe(true);
  });

  describe('#Collection', function () {
    var Cat;
    var Dog;

    beforeEach(function () {
      Cat = store.Collection('cats');
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
      beforeEach(function () {
        Cat = store.Collection('cats');
      });

      it('should add an item to the correct collection in the store', function () {
        Cat.add({ id: 1, name: 'Felix' });

        expect(store.dump().cats.length).toBe(1);
      });
    });

    describe('#create', function () {
      beforeEach(function () {
        Cat = store.Collection('cats');
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
      beforeEach(function () {
        Cat = store.Collection('cats');
      });

      it('should return all items from the correct store', function () {
        Cat.add({ id: 1, name: 'Felix' });
        Cat.add({ id: 2, name: 'Silvestor'  })

        expect(Cat.all()[0].name).toBe('Felix');
        expect(Cat.all()[1].name).toBe('Silvestor');
      });
    });

    describe('#fetchAll', function () {
      beforeEach(function () {
        Cat = store.Collection('cats');
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
      beforeEach(function () {
        Cat = store.Collection('cats');
      });

      it('should find the correct item', function () {
        Cat.add({ id: 1, name: 'Felix' });
        Cat.add({ id: 2, name: 'Silvestor' });

        expect(Cat.find(1).name).toBe('Felix');
        expect(Cat.find(2).name).toBe('Silvestor');
      });
    });

    describe('#remove', function () {
      beforeEach(function () {
        Cat = store.Collection('cats');
      });

      it('should remove the correct item', function () {
        Cat.add({ id: 1, name: 'Felix' });
        Cat.remove(1);
        
        expect(Cat.find(1)).toBe(undefined);
      });
    });

    describe('model.relationships', function () {
      describe('#hasMany', function () {
        beforeEach(function () {
          Cat = store.Collection('cats', { 
            relationships: {
              'dogs': {
                kind: 'hasMany',
                collection: 'dogs',
                foreignKey: 'cat_id'
              }
            } 
          });
          Dog = store.Collection('dogs');
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
          Cat = store.Collection('cats', { 
            relationships: {
              'dog': {
                kind: 'hasOne',
                collection: 'dogs',
                foreignKey: 'cat_id'
              }
            } 
          });
          Dog = store.Collection('dogs');
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
