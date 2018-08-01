"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
function reach(target, path) {
    try {
        for (var _a = __values(path.split('.')), _b = _a.next(); !_b.done; _b = _a.next()) {
            var key = _b.value;
            if (target && target[key] !== undefined) {
                target = target[key];
            }
            else {
                return;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return target;
    var e_1, _c;
}
exports.reach = reach;
function set(target, path, value) {
    path.split('.').reduce(function (res, path, index, array) {
        if (index === array.length - 1) {
            res[path] = value;
        }
        else {
            res[path] = typeof res[path] === 'object' ? res[path] : {};
        }
        return res[path];
    }, target);
    return target;
}
exports.set = set;
function merge(target, source) {
    for (var key in source) {
        try {
            target[key] = typeof source[key] === 'object'
                ? __assign({}, merge(target[key], source[key])) : source[key];
        }
        catch (e) {
            target[key] = source[key];
        }
    }
    return target;
}
exports.merge = merge;
function overrideMethodProperty(object, key, method) {
    var descriptor = Object.getOwnPropertyDescriptor(object, key);
    if (!descriptor) {
        throw new Error("Cannot find property of \"" + key + "\"");
    }
    var superMethod = descriptor.value;
    if (typeof superMethod !== 'function') {
        throw new Error("\"" + key + "\" is not a method property!");
    }
    Object.defineProperty(object, key, __assign({}, descriptor, { value: function overridedMethod() {
            return method.call(this, superMethod).apply(this, arguments);
        } }));
}
exports.overrideMethodProperty = overrideMethodProperty;
function assert(value, schema) {
    var error = schema.validate(value).error;
    if (error) {
        throw new Error(error.details[0].message);
    }
}
exports.assert = assert;
