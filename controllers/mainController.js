var lineReader = require('readline')


var lines = lineReader.createInterface({
  input: require('fs').createReadStream('file.in')
});

lineReader.on('line', function (line) {
  console.log('Line from file:', line);
});
}

