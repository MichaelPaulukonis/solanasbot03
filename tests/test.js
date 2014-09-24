var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var sentence = require('../sentence.js');
var randomWords = require('./words.js');
var s = new sentence(randomWords);

// print process.argv
// process.argv.forEach(function (val, index, array) {
//   console.log(index + ': ' + val);
// });

// naievely assume that the third arguement is the templateNbr
// if not present use something else;
var templateNbr = process.argv[2] || Math.floor(Math.random() * (s.templates.length));

var getSentence = function(n) {

    // console.log(randomWords);

    return s.getSentence(n);

};

console.log(getSentence(templateNbr));


// console.log(s.templates.length);
