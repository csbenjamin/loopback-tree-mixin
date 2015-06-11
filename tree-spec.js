var app = require('loopback');

// https://github.com/strongloop/loopback-boot/blob/master/lib/executor.js#L57-L71
// the loopback-boot module patches in the loopback attribute so we can assume the same
app.loopback = require('loopback');

//console.log(app)

var dataSource = app.createDataSource({
    connector: app.Memory
});

// import our Tree mixin

require('./')(app);

describe('loopback datasource tree', function () {

    var Category = dataSource.createModel('Category',
        {name: String},
        {mixins: {Tree: true}}
    );
    beforeEach(function (done) {
        Category.destroyAll(done);
    });
    //afterEach(function (done) {
    //    Category.find({}, function (err, results) {
    //        console.log('\nall data after it\n', results);
    //        done();
    //    })
    //});
    it('create some categories and check the lft and rgt properties', function (done) {
        var p = new pp(done);
        Category.create({name: 'Food'}, p.add(function (err, food) {

            expect(err).not.toBeTruthy();
            expect(food.lft).toBe(1);
            expect(food.rgt).toBe(2);


            var fruits = new Category({name: 'fruits'});
            fruits.parent(food);

            fruits.save(p.add(function (err) {
                expect(fruits.lft).toBe(2);
                expect(fruits.rgt).toBe(3);
                expect(err).not.toBeTruthy();
                expect(fruits.parentId).toBe(food.id);
                food.name = 'food new name';
                food.reload(function (err, food) {
                    expect(err).not.toBeTruthy();
                    expect(food.lft).toBe(1);
                    expect(food.rgt).toBe(4);

                    var vegetables = new Category({name: 'vegetables'});
                    vegetables.save(p.add(function (err) {
                        expect(err).not.toBeTruthy();
                        expect(vegetables.lft).toBe(5);
                        expect(vegetables.rgt).toBe(6);
                        expect(vegetables.id).toBeTruthy();
                        expect(vegetables.parentId).toBeUndefined();
                        vegetables.parent(food);
                        expect(vegetables.parentId).toBe(food.id);
                        vegetables.save(p.add(function (err) {
                            expect(err).not.toBeTruthy();
                            expect(vegetables.parentId).toBe(food.id);
                            food.reload(p.add(function (err, food) {
                                expect(vegetables.lft).toBe(4);
                                expect(vegetables.rgt).toBe(5);
                                expect(food.lft).toBe(1);
                                expect(food.rgt).toBe(6);
                                vegetables.parentId = null;
                                vegetables.save(p.add(function () {
                                    food.reload(p.add(function (err, food) {
                                        expect(vegetables.lft).toBe(5);
                                        expect(vegetables.rgt).toBe(6);
                                        expect(food.lft).toBe(1);
                                        expect(food.rgt).toBe(4);
                                        fruits.parentId = null;
                                        fruits.save(p.add(function () {
                                            food.reload(p.add(function (err, food) {
                                                vegetables.reload(p.add(function (err, vegetables) {
                                                    expect(vegetables.lft).toBe(3);
                                                    expect(vegetables.rgt).toBe(4);
                                                    expect(food.lft).toBe(1);
                                                    expect(food.rgt).toBe(2);
                                                    expect(fruits.lft).toBe(5);
                                                    expect(fruits.rgt).toBe(6);
                                                }))
                                            }));
                                        }))
                                    }));
                                }));
                            }));
                        }));
                    }));
                });
            }))

        }));
    })
});

function pp(done) {
    this.callbacks = [];
    this.done = done;
}

pp.prototype.add = function (fn) {
    var self = this;

    function fn2() {
        fn.apply(this, arguments);
        var index = self.callbacks.indexOf(fn2);
        if (index > -1) {
            self.callbacks.splice(index, 1);
        }
        if (self.callbacks.length == 0) {
            self.done();
        }
    }

    this.callbacks.push(fn2);

    return fn2;
};