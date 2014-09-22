var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var Twit = require('twit');
var config = require('./config.js');
var T = new Twit(config);
var wordnikKey = config.wordnik_key;
var request = require('request');
var sentence = require('./sentence.js');

var randomWords = {
    noun: [],
    adjective: [],
    verb: [],
    pronoun: [],
    propernoun: [],
    adverb: [],
    inter: []
};


var getSentence = function() {

    var s = new sentence(randomWords);

    return s.getSentence();

};

function generate() {

    var dfd = new _.Deferred();

    var randomWordNounPromise = getRandomWordsPromise('noun');
    var randomWordAdjPromise = getRandomWordsPromise('adjective');
    var randomWordAdvPromise = getRandomWordsPromise('adverb');
    var randomWordVerbPromise = getRandomWordsPromise('verb-transitive');
    var randomWordPronounPromise = getRandomWordsPromise('pronoun');

    _.when(
        randomWordNounPromise,
        randomWordAdjPromise,
        randomWordAdvPromise,
        randomWordVerbPromise,
        randomWordPronounPromise
    ).done(function() {
        dfd.resolve(getSentence());
    });

    return dfd.promise();
}

function getRandomWordsPromise(pos,minCount) {
    minCount = minCount || 3000; // the lower the number, the less common
    var url = "http://api.wordnik.com/v4/words.json/randomWords?includePartOfSpeech="+pos+"&excludePartOfSpeech=proper-noun-plural,proper-noun-posessive,suffix,family-name,idiom,affix&minCorpusCount="+minCount+"&hasDictionaryDef=true&limit=20&api_key=" + config.wordnik_key;
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
                randomWords.propernoun = words;
            }
            else if (pos === "pronoun") {
                randomWords.pronoun = words;
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
        console.log(myTweet);
        if (myTweet !== "") { // could not generate for some reason (not nothing)
            if (config.tweet_on) {
                T.post('statuses/update', { status: myTweet }, function(err, reply) {
                    if (err) {
                        console.log('error:', err);
                    }
                    else {
                        console.log('reply:', reply);
                    }
                });
            }
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
// TODO: get this into a heroku variable...
// }, 1000 * 15 * 60);
}, 1000 * config.minutes * config.seconds);

// Tweet once on initialization
tweet();
