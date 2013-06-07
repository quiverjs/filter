
'use strict'

var createFilteredHandlerBuilder = function(filter, handlerBuilder) {
  var filteredHandlerBuilder = function(config, callback) {
    callback = safeCallback(callback)

    handlerBuilder(config, function(err, handler) {
      if(err) return callback(err)

      filter(config, handler, callback)
    })
  }

  return filteredHandlerBuilder
}

var composeFilters = function(filters) {
  var currentFilter = filters[0]

  if(filters.length == 1) return currentFilter

  var innerComposedFilter = composeFilters(filters.slice(1))
  
  var composedFilter = function(config, handler, callback) {
    innerComposedFilter(config, handler, function(err, innerFilteredHandler) {
      if(err) return callback(err)

      currentFilter(config, innerFilteredHandler, callback)
    })
  }

  return composedFilter
}

module.exports = {
  createFilteredHandlerBuilder: createFilteredHandlerBuilder,
  composeFilters: composeFilters
}