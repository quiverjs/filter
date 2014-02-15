
'use strict'

var error = require('quiver-error').error
var configLib = require('quiver-config')
var copyObject = require('quiver-copy').copyObject

var combineFilters = function(filter1, filter2) {
  var combinedFilter = function(config, handler, callback) {
    filter1(copyObject(config), handler, function(err, filteredHandler1) {
      if(err) return callback(err)

      filter2(config, filteredHandler1, callback)
    })
  }

  return combinedFilter
}

var composeFilters = function(filters) {
  filters = filters.slice()
  var filter = filters.pop()

  while(filters.length != 0) {
    filter = combineFilters(filters.pop(), filter)
  }

  return filter
}

var argsFilter = function(argsFilter) {
  var filter = function(config, handler, callback) {
    var filteredHandler = function(args, inputStreamable, callback) {
      argsFilter(args, function(err, args) {
        if(err) return callback(err)

        handler(args, inputStreamable, callback)
      })
    }

    callback(null, filteredHandler)
  }

  return filter 
}

var errorFilter = function(errorHandler) {
  var filter = function(config, handler, callback) {
    var filteredHandler = function(args, inputStreamable, callback) {
      handler(args, inputStreamable, function(err, resultStreamable) {
        if(!err) return callback(null, resultStreamable)

        errorHandler(err, callback)
      })
    }

    callback(null, filteredHandler)
  }

  return filter 
}

var inputTransformFilter = function(transformHandlerName) {
  var filter = function(config, handler, callback) {
    configLib.getStreamHandler(config, transformHandlerName, 
      function(err, transformHandler) {
        if(err) return callback(err)

        var filteredHandler = function(args, inputStreamable, callback) {
          transformHandler(copyObject(args), inputStreamable, 
            function(err, transformedStreamable) {
              if(err) return callback(err)

              handler(args, transformedStreamable, callback)
            })
        }

        callback(null, filteredHandler)
      })
  }

  return filter
}

var outputTransformFilter = function(transformHandlerName) {
  var filter = function(config, handler, callback) {
    configLib.getStreamHandler(config, transformHandlerName, 
      function(err, transformHandler) {
        if(err) return callback(err)

        var filteredHandler = function(args, inputStreamable, callback) {
          handler(copyObject(args), inputStreamable, 
            function(err, resultStreamable) {
              if(err) return callback(err)

              transformHandler(args, resultStreamable, callback)
            })
        }

        callback(null, filteredHandler)
      })
  }

  return filter
}

var inputOutputTransformFilter = function(inputHandlerName, outputHandlerName) {
  if(!outputHandlerName) outputHandlerName = inputHandlerName

  var inputFilter = inputTransformFilter(inputHandlerName)
  var outputFilter = outputTransformFilter(outputHandlerName)

  return combineFilters(inputFilter, outputFilter)
}

var metaFilter = function(filterBuilder, builder) {
  var filter = function(config, handler, callback) {
    builder(copyObject(config), function(err, customFilter) {
      if(err) return callback(err)

      var filter = filterBuilder(customFilter)
      filter(config, handler, callback)
    })
  }

  return filter
}

module.exports = {
  combineFilters: combineFilters,
  composeFilters: composeFilters,
  argsFilter: argsFilter,
  errorFilter: errorFilter,
  inputTransformFilter: inputTransformFilter,
  outputTransformFilter: outputTransformFilter,
  inputOutputTransformFilter: inputOutputTransformFilter,
  metaFilter: metaFilter
}