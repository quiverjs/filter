
'use strict'

var copyObject = require('quiver-copy').copyObject
var safeCallback = require('quiver-safe-callback').safeCallback

var createFilteredHandlerBuilder = function(filter, handlerBuilder) {
  var filteredHandlerBuilder = function(config, callback) {
    callback = safeCallback(callback)

    handlerBuilder(copyObject(config), safeCallback(function(err, handler) {
      if(err) return callback(err)

      filter(copyObject(config), handler, callback)
    }))
  }

  return filteredHandlerBuilder
}

var composeFilters = function(filters) {
  var currentFilter = filters[0]

  if(filters.length == 1) return currentFilter

  var innerComposedFilter = composeFilters(filters.slice(1))
  
  var composedFilter = function(config, handler, callback) {
    callback = safeCallback(callback)

    innerComposedFilter(config, handler, 
      safeCallback(function(err, innerFilteredHandler) {
        if(err) return callback(err)

        currentFilter(config, innerFilteredHandler, callback)
      }))
  }

  return composedFilter
}

module.exports = {
  createFilteredHandlerBuilder: createFilteredHandlerBuilder,
  composeFilters: composeFilters
}