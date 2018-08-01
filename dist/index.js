"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
var Joi = require("joi");
var utils_1 = require("./utils");
var Schemas;
(function (Schemas) {
    Schemas.locale = Joi.string().allow(null).label('locale');
    Schemas.errorDescriptor = Joi.alternatives().try([
        Joi.string().allow(null),
        Joi.func(),
        Joi.object().pattern(/.+/, Joi.lazy(function () { return Schemas.errorDescriptor; }).required()),
    ]).label('descriptor');
    Schemas.addLocaleOptions = Joi.object({
        locale: Schemas.locale.required(),
        language: Joi.object({
            root: Joi.string(),
            key: Joi.string(),
            message: Joi.object({
                wrapArrays: Joi.boolean()
            })
        }).pattern(/.+/, Joi.object().pattern(/.+/, Schemas.errorDescriptor.required()))
            .required()
    }).label('options');
})(Schemas || (Schemas = {}));
var internals = {
    locales: {},
    defaultLocale: undefined
};
function addLocaleData(locale, language) {
    utils_1.assert({ locale: locale, language: language }, Schemas.addLocaleOptions);
    if (locale in internals.locales) {
        console.warn("locale " + locale + " is already registered! The previous data will be overrided.");
    }
    internals.locales[locale] = language;
}
function getLocaleData(locale) {
    locale = locale || internals.defaultLocale;
    return internals.locales[locale];
}
function setDefaultLocale(locale, supressWarning) {
    if (locale === null) {
        delete internals.defaultLocale;
    }
    else {
        utils_1.assert(locale, Schemas.locale);
        if (locale in internals.locales) {
            internals.defaultLocale = locale;
        }
        else if (!supressWarning) {
            console.warn("locale " + locale + " is not registered! This operation will be igrnored.");
        }
    }
}
function getDefaultLocale() {
    return internals.defaultLocale;
}
function formatErrorDetails(error, locale) {
    locale = locale || getDefaultLocale();
    if (locale) {
        var language_1 = getLocaleData(locale);
        if (Object.keys(language_1).length > 0 && Array.isArray(error.details)) {
            error = Object.create(Object.getPrototypeOf(error), Object.getOwnPropertyNames(error).reduce(function (res, key) {
                return (res[key] = Object.getOwnPropertyDescriptor(error, key), res);
            }, {}));
            error.details = error.details.map(function (item) {
                var message;
                var template = utils_1.reach(language_1, item.type);
                if (typeof template === 'function') {
                    message = template(item);
                }
                else if (typeof template === 'string') {
                    var context_1 = __assign({}, item.context);
                    message = Joi.createError(item.type, context_1, __assign({}, context_1, { path: item.path }), { language: language_1 }).toString();
                }
                return message ? __assign({}, item, { message: message }) : item;
            });
        }
    }
    else {
        console.warn("locale " + locale + " is not registered! This operation will be igrnored.");
    }
    return error;
}
function injectLocale() {
    if (Joi['_locales'] === undefined) {
        Joi['_locales'] = internals.locales;
        Joi.addLocaleData = addLocaleData;
        Joi.getLocaleData = getLocaleData;
        Joi.setDefaultLocale = setDefaultLocale;
        Joi.getDefaultLocale = getDefaultLocale;
        Joi.formatErrorDetails = formatErrorDetails;
        if (process !== undefined && typeof process.env.LANG === 'string') {
            Joi.setDefaultLocale.call(this, process.env.LANG.split('.', 1).shift(), true);
        }
        if (typeof process !== 'undefined' && typeof process.env.LANG === 'string') {
            Joi.setDefaultLocale.call(this, process.env.LANG.split('.', 1).shift(), true);
        }
        else if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
            Joi.setDefaultLocale.call(this, navigator.language);
        }
        var anyPrototype = Object.getPrototypeOf(Joi.any());
        utils_1.overrideMethodProperty(anyPrototype, '_validateWithOptions', function (superMethod) {
            return function validateWrapper(value, options, callback) {
                var locale = utils_1.reach(options, 'locale') || utils_1.reach(this, '_settings.locale') || internals.defaultLocale;
                if (locale && locale in internals.locales) {
                    var localizations_1 = utils_1.reach(this, "_settings.language")
                        || utils_1.reach(internals.locales, locale);
                    if (typeof localizations_1 === 'object' && Object.keys(localizations_1).length > 0) {
                        if (options) {
                            options = __assign({}, options, { language: options.language ? utils_1.merge({
                                    key: localizations_1.key,
                                    root: localizations_1.root,
                                    messages: localizations_1.messages
                                }, options.language) : localizations_1 });
                        }
                        var mapValidationErrorItem_1 = function (error) {
                            if (error.context && Array.isArray(error.context.reason)) {
                                error.context.reason = error.context.reason.map(mapValidationErrorItem_1);
                            }
                            var template = utils_1.reach(error.options, "language." + error.type)
                                || utils_1.reach(options, "language." + error.type)
                                || utils_1.reach(localizations_1, error.type);
                            if (typeof template === 'function') {
                                error.message = template(error);
                            }
                            else if (typeof template === 'string') {
                                error.template = template;
                            }
                            return error;
                        };
                        var wrappedSchema = this.error(function (errors) { return errors.map(mapValidationErrorItem_1); });
                        return superMethod.call(wrappedSchema, value, options, callback);
                    }
                }
                else if (locale !== internals.defaultLocale) {
                    console.error("locale " + locale + " is not registered! Given option will be ignored.");
                }
                return superMethod.call(this, value, options, callback);
            };
        });
        utils_1.overrideMethodProperty(anyPrototype, 'checkOptions', function (superMethod) {
            return function checkOptionsWrapper(_a) {
                if (_a === void 0) { _a = {}; }
                var locale = _a.locale, options = __rest(_a, ["locale"]);
                utils_1.assert(locale, Schemas.locale);
                return superMethod.call(this, options);
            };
        });
    }
    return Joi;
}
module.exports = injectLocale();
