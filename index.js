var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var inflection = require('inflection');
var Twit = require('twit');
var T = new Twit(require('./config.js'));
var wordfilter = require('wordfilter');
var wordnikKey = require('./permissions.js').key;
var request = require('request');

var randomWords = {
    noun: [],
    adjective: [],
    verb: [],
    pnoun: [],
    nounplural: [],
    adverb: [],
    inter: []
};

var nounCache = [];

Array.prototype.pick = function() {
    return this[Math.floor(Math.random()*this.length)];
};

Array.prototype.pickRemove = function() {
    var index = Math.floor(Math.random()*this.length);
    return this.splice(index,1)[0];
};

var templates = [
    "SCUM: You <%= verbTransitive() %>. We’ll take care of the <%= nounPlural() %>.",
    "SCUM is against <%= adjective() %>, <%= adjective() %>, <%= nounPlural() %>, with no clear objective in mind, and in which many of your own kind are picked off.",
    "SCUM is out to destroy the <%= noun() %>, not attain certain rights within it.",
    "SCUM will always be <%= adjective() %>, <%= adjective() %>, <%= adjective() %> (although SCUM <%= nounPlural() %> will always be known to be such).",
    "SCUM is against the entire system, the very idea of <%= noun() %> and <%= noun() %>.",
    "SCUM will destroy all useless and harmful objects -- <%= nounPlural() %>, <%= nounPlural() %>, <%= nounPlural() %>  etc.",
    "SCUM: Not Your Typical <%= capitalNoun() %>",
    "SCUM: What’s in your <%= noun() %>?",
    "SCUM: the <%= noun() %> of <%= noun1() %> <%= nounPlural() %>",
    "SCUM: not just for <%= nounPlural() %>!",
    "SCUM will kill all <%= noun() %> who are not in the <%= capitalNoun1() %>’s Auxiliary of SCUM.",
    "SCUM will <%= adverb() %>, <%= adverb() %>, stalk its <%= noun() %> and quietly move in for the kill."
];



var wordFinders = function() {

    var capitalize = function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    };

    var adjective = function() { return randomWords.adjective.pick().word; };
    var adverb = function() { return randomWords.adverb.pick().word; };
    var capitalNoun = function() { var n = randomWords.noun.pick().word; nounCache.push(n); return capitalize(n); };
    var capitalNoun1 = function() { return capitalize(nounCache[0]); };
    var noun = function() { var n = randomWords.noun.pick().word; nounCache.push(n); return n; };
    var noun1 = function() { return nounCache[0]; };
    var nounPlural = function() { return randomWords.nounplural.pick().word; };
    var verb = function() { return randomWords.verb.pick().word; };
    var verbTransitive = function() { return randomWords.verb.pick().word; };

    return {
        adjective: adjective,
        adverb: adverb,
        capitalNoun1: capitalNoun1,
        capitalNoun: capitalNoun,
        noun1: noun1,
        noun: noun,
        nounPlural: nounPlural,
        verb: verb,
        verbTransitive: verbTransitive
    };

}();


function getSentence() {

    // console.log(randomWords);
    nounCache = [];

    var tmpl = templates.pick();
    //console.log(tmpl);
    var t = _.template(tmpl);
    var s = t(wordFinders);

    //console.log(s);

    return s;

};

function generate() {

    var dfd = new _.Deferred();

    var randomWordNounPromise = getRandomWordsPromise('noun');
    var randomWordAdjPromise = getRandomWordsPromise('adjective');
    var randomWordNounPluralPromise = getRandomWordsPromise('noun-plural');
    var randomWordAdvPromise = getRandomWordsPromise('adverb');
    var randomWordVerbPromise = getRandomWordsPromise('verb-transitive');

    _.when(
        randomWordNounPromise,
        randomWordAdjPromise,
        randomWordNounPluralPromise,
        randomWordAdvPromise,
        randomWordVerbPromise
    ).done(function() {
        dfd.resolve(getSentence());
    });

    //dfd.resolve();
    return dfd.promise();
}

function getRandomWordsPromise(pos,minCount) {
    minCount = minCount || 1000; // the lower the number, the less common
    var url = "http://api.wordnik.com/v4/words.json/randomWords?includePartOfSpeech="+pos+"&excludePartOfSpeech=proper-noun-plural,proper-noun-posessive,suffix,family-name,idiom,affix&minCorpusCount="+minCount+"&hasDictionaryDef=true&limit=10&api_key=" + wordnikKey;
    var rwDeferred = _.Deferred();
    var randomWordNounPromise = rwDeferred.promise();
    request({
        url: url
    }, function (error, response, body) {
        // console.log(body);
        if (JSON.parse(body).message === "exceeded access limits") {
            console.log("We're over the access limit, nooo!");
            rwDeferred.reject(error);
        }
        else if (!error && response.statusCode === 200) {
            //console.log(JSON.parse(body).word);
            //console.log(I.singularize(JSON.parse(body).word));
            rwDeferred.resolve(JSON.parse(body));
        }
        else {
            rwDeferred.reject(error);
        }
    });
    (function(pos) {
        randomWordNounPromise.done(function(words) {
            if (pos === "noun") {
                randomWords.noun = words;
            }
            else if (pos === "adjective") {
                randomWords.adjective = words;
            }
            else if (pos === "verb") {
                randomWords.verb = words;
            }
            else if (pos === "verb-transitive") {
                randomWords.verb = words;
            }
            else if (pos === "proper-noun") {
                randomWords.pnoun = words;
            }
            else if (pos === "noun-plural") {
                randomWords.nounplural = words;
            }
            else if (pos === "interjection") {
                randomWords.inter = words;
            }
            else if (pos === "adverb") {
                randomWords.adverb = words;
            }
        });
    })(pos);
    return randomWordNounPromise;
}



function tweet() {
    generate().then(function(myTweet) {
        if (!wordfilter.blacklisted(myTweet)) {
            console.log(myTweet);

            T.post('statuses/update', { status: myTweet }, function(err, reply) {
                if (err) {
                    console.log('error:', err);
                }
                else {
                    console.log('reply:', reply);
                }
            });
        }
    });
}

// Tweet every 60 minutes
setInterval(function () {
    try {
        tweet();
    }
    catch (e) {
        console.log(e);
    }
}, 1000 * 60 * 60);
// }, 1000 * 3);

// Tweet once on initialization
tweet();
