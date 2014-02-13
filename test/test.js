
var should = require('should')
var error =  require('quiver-error').error
var filterLib = require('../lib/filter')
var streamChannel = require('quiver-stream-channel')
var streamConvert = require('quiver-stream-convert')

describe('filter test',function() {
  var emptyStreamable = streamChannel.createEmptyStreamable()

  it('args filter test 1', function(callback) {
    var argsFilter = filterLib.argsFilter(function(args, callback) {
      should.equal(args.foo, 'foo')
      var newArgs = { foo: 'bar' }

      callback(null, newArgs)
    })
    
    var handler = function(args, inputStreamable, callback) {
      should.equal(args.foo, 'bar')

      callback(null, inputStreamable)
    }

    argsFilter({}, handler, function(err, filteredHandler) {
      if(err) return callback(err)

      filteredHandler({ foo: 'foo' }, emptyStreamable, function(err, resultStreamable) {
        if(err) return callback(err)

        should.exists(resultStreamable)
        callback()
      })
    })
  })

  it('args filter test 2', function(callback) {
    var argsFilter = filterLib.argsFilter(function(args, callback) {
      callback(error(500, 'test error'))
    })

    var handler = function(args, inputStreamable, callback) {
      callback(null, inputStreamable)
    }

    argsFilter({}, handler, function(err, filteredHandler) {
      if(err) return callback(err)

      filteredHandler({ }, emptyStreamable, function(err, resultStreamable) {
        should.exists(err)

        callback()
      })
    })
  })

  it('error filter test 1', function(callback) {
    var errorFilter = filterLib.errorFilter(function(err, callback) {
      should.equal(err.message, 'original message')
      callback(null, emptyStreamable)
    })

    var handler = function(args, inputStreamable, callback) {
      callback(error(500, 'original message'))
    }

    errorFilter({}, handler, function(err, filteredHandler) {
      if(err) return callback(err)

      filteredHandler({}, emptyStreamable, function(err, resultStreamable) {
        if(err) return callback(err)

        should.exists(resultStreamable)
        callback()
      })
    })
  })

  it('error filter test 2', function(callback) {
    var errorFilter = filterLib.errorFilter(function(err, callback) {
      should.equal(err.message, 'original message')
      callback(error(400, 'filtered error'))
    })

    var handler = function(args, inputStreamable, callback) {
      callback(error(500, 'original message'))
    }

    errorFilter({}, handler, function(err, filteredHandler) {
      if(err) return callback(err)

      filteredHandler({}, emptyStreamable, function(err, resultStreamable) {
        should.exists(err)
        should.equal(err.message, 'filtered error')

        callback()
      })
    })
  })

  var upperCaseTransformHandler = function(args, inputStreamable, callback) {
    streamConvert.streamableToText(inputStreamable, function(err, text) {
      if(err) return callback(err)

      callback(null, streamConvert.textToStreamable(text.toUpperCase()))
    })
  }

  var lowerCaseTransformHandler = function(args, inputStreamable, callback) {
    streamConvert.streamableToText(inputStreamable, function(err, text) {
      if(err) return callback(err)

      callback(null, streamConvert.textToStreamable(text.toLowerCase()))
    })
  }

  var transformConfig = {
    quiverStreamHandlers: {
      'uppercase transform handler': upperCaseTransformHandler,
      'lowercase transform handler': lowerCaseTransformHandler
    }
  }

  it('transform test 1', function(callback) {
    var inputFilter = filterLib.inputTransformFilter('uppercase transform handler')

    var handler = function(args, inputStreamable, callback) {
      streamConvert.streamableToText(inputStreamable, function(err, text) {
        if(err) return callback(err)

        should.equal(text, 'JOHN')
        var resultStreamable = streamConvert.textToStreamable('Hello, ' + text)
        callback(null, resultStreamable)
      })
    }

    inputFilter(transformConfig, handler, function(err, filteredHandler) {
      if(err) return callback(err)

      filteredHandler({ }, streamConvert.textToStreamable('John'), 
        function(err, resultStreamable) {
          if(err) return callback(err)

          streamConvert.streamableToText(resultStreamable, function(err, text) {
            if(err) return callback(err)

            should.equal(text, 'Hello, JOHN')
            callback()
          })
        })
    })
  })

  it('transform test 2', function(callback) {
    var outputFilter = filterLib.outputTransformFilter('lowercase transform handler')

    var handler = function(args, inputStreamable, callback) {
      streamConvert.streamableToText(inputStreamable, function(err, text) {
        if(err) return callback(err)

        should.equal(text, 'John')
        var resultStreamable = streamConvert.textToStreamable('Hello, ' + text)
        callback(null, resultStreamable)
      })
    }

    outputFilter(transformConfig, handler, function(err, filteredHandler) {
      if(err) return callback(err)

      filteredHandler({ }, streamConvert.textToStreamable('John'), 
        function(err, resultStreamable) {
          if(err) return callback(err)

          streamConvert.streamableToText(resultStreamable, function(err, text) {
            if(err) return callback(err)

            should.equal(text, 'hello, john')
            callback()
          })
        })
    })
  })

  it('transform test 3', function(callback) {
    var inputOutputFilter = filterLib.inputOutputTransformFilter(
      'uppercase transform handler', 'lowercase transform handler')

    var handler = function(args, inputStreamable, callback) {
      streamConvert.streamableToText(inputStreamable, function(err, text) {
        if(err) return callback(err)

        should.equal(text, 'JOHN')
        var resultStreamable = streamConvert.textToStreamable('Hello, ' + text)
        callback(null, resultStreamable)
      })
    }

    inputOutputFilter(transformConfig, handler, function(err, filteredHandler) {
      if(err) return callback(err)

      filteredHandler({ }, streamConvert.textToStreamable('John'), 
        function(err, resultStreamable) {
          if(err) return callback(err)

          streamConvert.streamableToText(resultStreamable, function(err, text) {
            if(err) return callback(err)

            should.equal(text, 'hello, john')
            callback()
          })
        })
    })
  })
})