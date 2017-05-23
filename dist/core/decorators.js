"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constance_1 = require("./constance");
var state_1 = require("./state");
/**
 * Bind data for give key and target using a selector function
 *
 * @param {any} target
 * @param {any} key
 * @param {any} selectorFunc
 */
function bindData(target, key, selector) {
    return state_1.State.select(selector)
        .subscribe(function (data) {
        if (typeof target[key] === 'function')
            return target[key].call(target, data);
        target[key] = data;
    });
}
exports.bindData = bindData;
/**
 * Binds action to a function
 *
 * @example
 * class TodoStore {
 *
 *    @action
 *    addTodo(state: State, action: AddTodoAction): State {
 *       // return modified state
 *    }
 * }
 *
 * @export
 * @param {*} target
 * @param {string} propertyKey
 * @param {PropertyDescriptor} descriptor
 * @returns
 */
function action(target, propertyKey, descriptor) {
    var metadata = Reflect.getMetadata('design:paramtypes', target, propertyKey);
    if (metadata.length < 2)
        throw new Error('@action() must be applied to a function with two arguments. ' +
            'eg: reducer(state: State, action: SubclassOfAction): State { }');
    var refluxActions = {};
    if (Reflect.hasMetadata(constance_1.REFLUX_ACTION_KEY, target)) {
        refluxActions = Reflect.getMetadata(constance_1.REFLUX_ACTION_KEY, target);
    }
    refluxActions[propertyKey] = metadata[1];
    Reflect.defineMetadata(constance_1.REFLUX_ACTION_KEY, refluxActions, target);
    return {
        value: function (state, action) {
            return descriptor.value.call(this, state, action);
        }
    };
}
exports.action = action;
/**
 * Add @data meta
 *
 * @export
 * @param {*} target
 * @param {any} propertyKey
 * @param {any} selector
 * @param {any} bindImmediate
 */
function addDataMeta(target, propertyKey, selector, bindImmediate) {
    var bindingsMeta = Reflect.getMetadata(constance_1.REFLUX_DATA_BINDINGS_KEY, target.constructor);
    if (!Reflect.hasMetadata(constance_1.REFLUX_DATA_BINDINGS_KEY, target.constructor)) {
        bindingsMeta = { selectors: {}, subscriptions: [], destroyed: !bindImmediate };
    }
    bindingsMeta.selectors[propertyKey] = selector;
    if (bindImmediate) {
        bindingsMeta.subscriptions.push(bindData(target, propertyKey, selector));
    }
    Reflect.defineMetadata(constance_1.REFLUX_DATA_BINDINGS_KEY, bindingsMeta, target.constructor);
}
exports.addDataMeta = addDataMeta;
/**
 * Subscribe to the state events and map it to properties
 *
 * @export
 */
function subscribe() {
    var _this = this;
    var dataBindings = Reflect.getMetadata(constance_1.REFLUX_DATA_BINDINGS_KEY, this);
    if (dataBindings != undefined && dataBindings.destroyed === true) {
        dataBindings.subscriptions = dataBindings.subscriptions.concat(Object.keys(dataBindings.selectors)
            .map(function (key) { return bindData(_this, key, dataBindings.selectors[key]); }));
        dataBindings.destroyed = false;
        Reflect.defineMetadata(constance_1.REFLUX_DATA_BINDINGS_KEY, dataBindings, this);
    }
}
exports.subscribe = subscribe;
/**
 * Unsubscribe from the state changes
 *
 * @export
 */
function unsubscribe() {
    var dataBindings = Reflect.getMetadata(constance_1.REFLUX_DATA_BINDINGS_KEY, this);
    if (dataBindings != undefined) {
        dataBindings.subscriptions.forEach(function (subscription) { return subscription.unsubscribe(); });
        dataBindings.subscriptions = [];
        dataBindings.destroyed = true;
        Reflect.defineMetadata(constance_1.REFLUX_DATA_BINDINGS_KEY, dataBindings, this);
    }
}
exports.unsubscribe = unsubscribe;