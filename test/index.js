var J = require('../lib/index')
    , should = require('should')
    , mocha = require('mocha');

describe('Jiggler', function() {

  describe('define', function() {
    it('should add representations to a class', function() {
      var User = function() {
        this.firstName = '';
        this.lastName = '';
      };

      J.define(User, 'public', []);

      var newUser = new User();
      newUser.should.have.property(J.JIGGLER_KEY);
      var r = newUser[J.JIGGLER_KEY];
      r.public.should.be.a('object');
    });

    it('should not add representations to an instance', function() {
      var user = {
        firstName: '',
        lastName: ''
      };

      (function() {
        J.define(user, 'public', []);
      }).should.throw();
    });

    it('should create representations not associated with anything', function() {
      var template = J.define('public', [
        J.Field('firstName')
      ]);
      should.exist(template);
      template.should.have.property('fields').with.lengthOf(1);
    });

    it('should define fields in a representation', function() {
      var User = function() {
        this.firstName = '';
        this.lastName = '';
      };
      var user = new User();

      J.define(User, 'public', [
        J.Field('firstName')
      ]);


      var r = user[J.JIGGLER_KEY];
      r.public.should.have.property('fields').with.lengthOf(1);
      var field = r.public.fields[0];
      field.should.have.property('name', 'firstName');
    });

    it('should create extended representations', function() {
      var User = function() {
        this.firstName = '';
        this.lastName = '';
      };
      var user = new User();

      J.define(User, 'public', [
        J.Field('firstName')
      ]);
      J.define(User, 'extended', [
          J.Field('lastName')
      ], {extends: 'public'});

      var r = user[J.JIGGLER_KEY];
      r.extended.should.have.property('fields').with.lengthOf(2);
      var field = r.extended.fields[0];
      field.should.have.property('name', 'firstName');
      field = r.extended.fields[1];
      field.should.have.property('name', 'lastName');
    });

    it('should throw if the extended template does not exist', function() {
      var User = function(){};

      J.define(User, 'public', []);

      (function() {
        J.define(User, 'extended', [], {extends: 'undefined'});
      }).should.throw();
    });

    it('should allow extended representations to override base implementations', function() {
      var User = function() {
        this.firstName = '';
        this.lastName = '';
      };
      var user = new User();

      J.define(User, 'public', [
        J.Field('firstName'),
        J.Field('lastName')
      ]);
      J.define(User, 'extended', [
        J.Field('lastName', {
          formatter: function(value) {
            return value.charAt(0);
          }
        })
      ], {extends: 'public'});

      var r = user[J.JIGGLER_KEY];
      r.extended.should.have.property('fields').with.lengthOf(2);
      var field = r.extended.fields[1];
      field.should.have.property('name', 'lastName');
      field.should.have.property('formatter');
      field.formatter.should.be.a('function');
    });
  });

  describe('represent', function() {

    var Car = function() {
      this.year = 2012;
      this.make = '';
    };

    it('should require a template name', function() {
      var User = function() {
        this.firstName = '';
        this.lastName = '';
      };
      var user = new User();
      J.define(User, 'public', []);

      (function() {
        J.represent(user, undefined, function() { });
      }).should.throw();
    });

    it('should require a valid template name', function() {
      var User = function() {
        this.firstName = '';
        this.lastName = '';
      };
      var user = new User();
      J.define(User, 'public', []);

      (function() {
        J.represent(user, 'alternative', function() { });
      }).should.throw();
    });

    it('should accept optional arguments', function(done) {
      var User = function() {
        this.firstName = '';
        this.lastName = '';
      };
      var user = new User();
      J.define(User, 'public', []);

      J.represent(user, 'public', {}, function(err, rep) {
        should.not.exist(err);
        should.exist(rep);
        done();
      });
    });

    it('should represent an instance with simple properties', function(done) {
      var User = function() {
        this.firstName = '';
        this.lastName = '';
      };
      var user = new User();
      user.firstName = 'Davos';
      user.lastName = 'Seaworth';

      J.define(User, 'public', [
        J.Field('firstName'),
        J.Field('lastName')
      ]);

      J.represent(user, 'public', function(err, rep) {
        should.not.exist(err);
        should.exist(rep);

        rep.should.have.property('firstName', 'Davos');
        rep.should.have.property('lastName', 'Seaworth');

        done();
      });
    });

    it('should represent an instance with object properties', function(done) {
      var user = new User();
      user.firstName = 'Davos';
      user.car = {
        year: 2001,
        make: 'Ford'
      };

      J.define(user, 'public', [
        J.Field('firstName'),
        J.Field('car')
      ]);

      J.as.pojo(user, 'public', function(err, rep) {
        should.not.exist(err);
        should.exist(rep);

        rep.should.have.property('firstName', 'Davos');
        rep.should.have.property('car');

        done();
      });
    });

    it('should represent an instance property with an alternative template', function(done) {
      var user = new User();
      user.firstName = 'Davos';
      var car = new Car();
      car.make = 'BMW';
      user.car = car;

      J.define(user, 'public', [
        J.Field('firstName'),
        J.Field('car', {template: 'different'})
      ]);
      J.define(car, 'different', []);

      J.as.pojo(user, 'public', function(err, rep) {
        should.not.exist(err);
        should.exist(rep);

        rep.should.have.property('firstName', 'Davos');
        rep.should.have.property('car');
        rep.car.should.not.have.property('year');
        rep.car.should.not.have.property('make');

        done();
      });
    });

    it('should represent an array', function(done) {
      var user = new User();
      user.firstName = 'Davos';
      user.lastName = 'Seaworth';
      var user2 = new User();
      user2.firstName = 'Sandor';
      user2.lastName = 'Clegane';

      var fields = [
        J.Field('firstName'),
        J.Field('lastName')
      ];
      J.define(user, 'public', fields);
      J.define(user2, 'public', fields);

      J.as.pojo([user, user2], 'public', function(err, rep) {
        should.not.exist(err);
        should.exist(rep);

        rep.should.be.an.instanceOf(Array);
        rep.should.have.lengthOf(2);
        rep[0].should.have.property('firstName', 'Davos');
        rep[0].should.have.property('lastName', 'Seaworth');
        rep[1].should.have.property('firstName', 'Sandor');
        rep[1].should.have.property('lastName', 'Clegane');

        done();
      });
    });

    it('should represent an instance with an array property', function(done) {
      var user = {
        test: ['one', 'two']
      };

      J.define(user, 'public', [
        J.Field('test')
      ]);

      J.as.pojo(user, 'public', function(err, rep) {
        should.not.exist(err);
        should.exist(rep);

        rep.should.have.property('test').with.lengthOf(2);
        rep.test.should.include('one');
        rep.test.should.include('two');

        done();
      });
    });

    it('should represent an instance with a formatter', function(done) {
      var user = new User();
      user.firstName = 'Davos';
      user.lastName = 'Seaworth';

      J.define(user, 'public', [
        J.Field('firstName', {
          formatter: function(value) {
            return value.charAt(0);
          }
        })
      ]);

      J.as.pojo(user, 'public', function(err, rep) {
        should.not.exist(err);
        should.exist(rep);

        rep.should.have.property('firstName', 'D');

        done();
      });
    });

    it('should strip undefined values by default', function(done) {
      var user = new User();
      user.firstName = undefined;
      user.lastName = 'Seaworth';

      J.define(user, 'public', [
        J.Field('firstName'),
        J.Field('lastName')
      ]);

      J.as.pojo(user, 'public', function(err, rep) {
        should.not.exist(err);
        should.exist(rep);

        ('firstName' in rep).should.equal(false);
        rep.should.have.property('lastName');

        done();
      });
    });

    it('should not strip undefined values if stripUndefined is set to false', function(done) {
      var user = new User();
      user.firstName = undefined;
      user.lastName = 'Seaworth';

      J.define(user, 'public', [
        J.Field('firstName'),
        J.Field('lastName')
      ]);

      J.as.pojo(user, 'public', {stripUndefined: false}, function(err, rep) {
        should.not.exist(err);
        should.exist(rep);

        ('firstName' in rep).should.equal(true);
        should.equal(undefined, rep.firstName);
        rep.should.have.property('lastName');

        done();
      });
    });
  });

  describe('as', function() {
    var User = function() {
      this.firstName = '';
      this.lastName = '';
    };
    var user = new User();

    J.define(User, 'public', []);

    it('should add json serializer', function(done) {
      J.as.json(user, 'public', function(err, representation) {
        should.not.exist(err);
        should.exist(representation);
        done();
      });
    });
  });
});