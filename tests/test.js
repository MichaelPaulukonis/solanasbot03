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
// var templateNbr = process.argv[2] || Math.floor(Math.random() * (s.templates.length));
var templateNbr = process.argv[2];

var getSentence = function(n) {

    return s.getSentence(n);

};

var runSomeTests = function() {

    // dump one of each template, tracking length
    var tooLong = [];
    for(var i = 0; i < s.templates.length; i++) {
	var snt = getSentence(i);
	var msg = '' + i + ': ' + snt + ' : (' + snt.length + ')';
	if (snt.length > 140) tooLong.push(msg);
	console.log(msg);
    }

    if (tooLong.length > 0) {
	console.log('\n\nTOO LONG FOR TWITTER:');
	for (i = 0; i < tooLong.length; i++) {
	    console.log(tooLong[i]);
	}
    }

};


if (templateNbr) {
    console.log(getSentence(templateNbr));
} else {
    runSomeTests();
}
