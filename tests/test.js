var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var sentence = require('../sentence.js');

// this is based on the objects returned from Wordnik
// which is { id: 'foo', word: 'bar' }
// we don't use the id, so don't set it manually, here
var randomWords = {
    noun: [ { word: 'pocket' } ],
    adjective: [],
    verb: [],
    pronoun: [],
    propernoun: [],
    adverb: [],
    inter: []
};

var getSentence = function(n) {

    // console.log(randomWords);

    var s = new sentence(randomWords);

    return s.getSentence(n);

};

console.log(getSentence(7));
