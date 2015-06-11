var async = require('async');
var Q = require('q');

module.exports = function timestamp(Model) {
    'use strict';

    Model.defineProperty('lft', {type: Number, required: true});
    Model.defineProperty('rgt', {type: Number, required: true});
    Model.belongsTo(Model, {foreignKey: 'parentId', as: 'parent'});


    Model.observe('before save', function event(ctx, next) {
            //TODO: We need check if the lft and rgt properties was changed. We should not allow that

            //sometimes this function will save others instances and will
            //add the __treeDoNothing option. If so, we must do nothing
            if (ctx.options.__treeDoNothing) return next();

            if (ctx.instance) { //update
                if (ctx.instance.id) {
                    ctx.Model.findById(ctx.instance.id, function (err, oldInstance) {
                        //check if the parent changes
                        if (oldInstance.parentId !== ctx.instance.parentId) {
                            //we have a parent. We need to move this instance to the right place
                            if (ctx.instance.parentId) {
                                //get the parent reference
                                ctx.Model.findById(ctx.instance.parentId, function (err, parent) {
                                    var myLft = ctx.instance.lft;
                                    var myRgt = ctx.instance.rgt;
                                    var myWidth = myRgt - myLft + 1;
                                    var parentRgt = parent.rgt;
                                    var newLft, moveRgt;
                                    //Temporary remove subtree being moved.
                                    updateMultiples(ctx.Model, {where: {and: [{rgt: {lt: myRgt + 1}}, {lft: {gt: myLft - 1}}]}}, function (result) {
                                        result.lft = -result.lft;
                                        result.rgt = -result.rgt;
                                    }).then(function () {
                                        //Close hole left behind
                                        return updateMultiples(ctx.Model, {where: {lft: {gt: myRgt}}}, function (result) {
                                            result.lft -= myWidth;

                                        });
                                    }).then(function () {
                                        //Close hole left behind
                                        return updateMultiples(ctx.Model, {where: {rgt: {gt: myRgt}}}, function (result) {
                                            result.rgt -= myWidth;
                                        });
                                    }).then(function () {
                                        //Make a hole for the new items
                                        newLft = (parentRgt > myRgt) ? parentRgt - myWidth : parentRgt;
                                        return updateMultiples(ctx.Model, {where: {lft: {gt: newLft - 1}}}, function (result) {
                                            result.lft += myWidth;
                                        });
                                    }).then(function () {
                                        //Make a hole for the new items
                                        return updateMultiples(ctx.Model, {where: {rgt: {gt: newLft - 1}}}, function (result) {
                                            result.rgt += myWidth;
                                        });
                                    }).then(function () {
                                        // Move node and subnodes
                                        moveRgt = (parentRgt > myRgt) ? parentRgt - myRgt - 1 : parentRgt - myRgt - 1 + myWidth;
                                        return updateMultiples(ctx.Model, {
                                            where: {
                                                rgt: {gt: -myRgt - 1},
                                                lft: {lt: -myLft + 1}
                                            }
                                        }, function (result) {
                                            result.lft = -result.lft + moveRgt;
                                            result.rgt = -result.rgt + moveRgt;
                                            if (ctx.instance.id == result.id) {
                                                ctx.instance.lft = result.lft;
                                                ctx.instance.rgt = result.rgt;
                                            }
                                        });
                                    }).catch(function (err) {
                                        console.error('there is a  error: ', err);
                                    }).done(function () {
                                        next();
                                    });


                                });
                            } else { //we are setting parentId to null.

                                //find the last node of the tree
                                ctx.Model.find({
                                    order: 'rgt DESC',
                                    limit: 1
                                }, function (err, results) {
                                    var newLft = results[0].rgt + 1;
                                    var myLft = ctx.instance.lft;
                                    var myRgt = ctx.instance.rgt;
                                    var myWidth = myRgt - myLft + 1;
                                    var moveRgt = newLft - myLft - myWidth;
                                    updateMultiples(ctx.Model, {where: {and: [{rgt: {lt: myRgt + 1}}, {lft: {gt: myLft - 1}}]}}, function (result) {
                                        result.lft = -result.lft;
                                        result.rgt = -result.rgt;
                                    }).then(function () {
                                        return updateMultiples(ctx.Model, {where: {lft: {gt: myRgt}}}, function (result) {
                                            result.lft -= myWidth;

                                        });
                                    }).then(function () {
                                        return updateMultiples(ctx.Model, {where: {rgt: {gt: myRgt}}}, function (result) {
                                            result.rgt -= myWidth;
                                        });
                                    }).then(function () {
                                        return updateMultiples(ctx.Model, {
                                            where: {
                                                rgt: {gt: -myRgt - 1},
                                                lft: {lt: -myLft + 1}
                                            }
                                        }, function (result) {
                                            result.lft = -result.lft + moveRgt;
                                            result.rgt = -result.rgt + moveRgt;
                                            if (ctx.instance.id == result.id) {
                                                ctx.instance.lft = result.lft;
                                                ctx.instance.rgt = result.rgt;
                                            }
                                        });
                                    }).catch(function (err) {
                                        console.error('there is a  error: ', err);
                                    }).done(function () {
                                        next();
                                    });
                                });
                            }
                        } else { //there is no change in parentId, so we don't need do nothing
                            next();
                        }

                    });
                } else { //this is a new item

                    //if it has parent, we need to do a hole in the tree to insert it there.
                    if (ctx.instance.parentId) {
                        ctx.Model.findById(ctx.instance.parentId, function (err, parent) {
                                var parentRgt = parent.rgt;
                                ctx.instance.lft = parentRgt;
                                ctx.instance.rgt = parentRgt + 1;
                                parent.rgt += 2;
                                updateMultiples(ctx.Model, {where: {rgt: {gt: parentRgt - 1}}}, function (result) {
                                    result.rgt += 2;
                                }).then(function () {

                                    return updateMultiples(ctx.Model, {where: {lft: {gt: parentRgt}}}, function (result) {
                                        result.lft += 2;
                                    });
                                }).catch(function (err) {
                                    console.error(err);
                                }).done(function () {
                                    next();
                                });
                            }
                        );
                    }

                    else {//there is no parent. It will be a root.
                        ctx.Model.find({
                            order: 'rgt DESC',
                            limit: 1
                        }, function (err, results) {
                            if (!results || !results.length) {
                                ctx.instance.lft = 1;
                                ctx.instance.rgt = 2;
                            } else {
                                ctx.instance.lft = results[0].rgt + 1;
                                ctx.instance.rgt = results[0].rgt + 2;
                            }
                            next();
                        });

                    }


                }
            }
            else {//for now, we don't need do nothing here
                next();
            }

        }
    );


};

//help function
function updateMultiples(model, where, change) {
    var deferred = Q.defer();

    model.find(where, function (err, results) {
        var parallel = [];
        results.forEach(function (result) {
            parallel.push(function () {
                return result.save.apply(result, [{__treeDoNothing:true}, arguments[0]]);
            });
            change(result);
        });
        async.parallel(parallel, function (err) {
            if (err) return deferred.reject(err);
            deferred.resolve();
        });
    });

    return deferred.promise;
}