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

    // TODO: if not valid sentence, get it again
    // return the template and cache the last 10 templates
    // do not use if in the last 10
    // don't force a full-cycle, just don't repeat that often.
    // AKSHUALLY since this is a "validation rule" it should go elsewhere
    // 'twould be nice if validation rules were injected,
    // as opposed to being hard-coded in sentence.js....
    // since "140 chars" has to do with THIS use-case, not OTHER use-cases....

    var s = new sentence(randomWords);

    return s.getRandomSentence();

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

// Tweet regularly
setInterval(function () {
    try {
        tweet();
    }
    catch (e) {
        console.log(e);
    }
}, 1000 * config.minutes * config.seconds);

// Tweet once on initialization
tweet();
