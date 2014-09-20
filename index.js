var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var inflection = require('inflection');
var article = require('./lib/indefinite');
var Twit = require('twit');
var config = require('./config.js');
var T = new Twit(config);
var wordfilter = require('wordfilter');
var wordnikKey = process.env.WORDNIK_KEY;
var request = require('request');
var nlp = require('nlp_compromise');

var randomWords = {
    noun: [],
    adjective: [],
    verb: [],
    pronoun: [],
    propernoun: [],
    adverb: [],
    inter: []
};

var nounCache = [];
var pluralNounCache = [];
var pronounCache = [];

Array.prototype.pick = function() {
    return this[Math.floor(Math.random()*this.length)];
};

Array.prototype.pickRemove = function() {
    var index = Math.floor(Math.random()*this.length);
    return this.splice(index,1)[0];
};

var templates = [
    "SCUM: You <%= verbTransitive() %>. We’ll take care of the <%= plural(noun()) %>.",
    "SCUM is against <%= adjective() %>, <%= adjective() %>, <%= plural(noun()) %>, with no clear objective in mind, and in which many of your own kind are picked off.",
    "SCUM is out to destroy the <%= noun() %>, not attain certain <%= plural(noun()) %> within it.",
    "SCUM will always be <%= adjective() %>, <%= adjective() %>, <%= adjective() %> (although SCUM <%= plural(noun()) %> will always be known to be such).",
    "SCUM is against the entire <%= noun() %>, the very idea of <%= noun() %> and <%= noun() %>.",
    "SCUM will destroy all useless and harmful objects -- <%= plural(noun()) %>, <%= plural(noun()) %>, <%= plural(noun()) %>  etc.",
    "SCUM: Not Your Typical <%= capital(noun()) %>.",
    "SCUM: What’s in your <%= noun() %>?",
    "SCUM: the <%= noun() %> of <%= noun1() %> <%= plural(noun()) %>.",
    "SCUM: not just for <%= plural(noun()) %>!",
    "SCUM will kill all <%= plural(noun()) %> who are not in the <%= capital(plural(noun1())) %>’s Auxiliary of SCUM.",
    "SCUM will <%= adverb() %>, <%= adverb() %>, stalk its <%= noun() %> and quietly move in for the kill.",
    "SCUM: Not just for <%= plural(noun()) %>.",
    "SCUM will not <%= verb() %>, <%= verb() %>, <%= verb() %> or <%= verb() %> to attempt to achieve its ends.",
    "SCUM: Leave the <%= noun() %> to us.",
    "SCUM: <%= capital(noun()) %> for <%= pronoun() %>. <%= capital(pronoun1()) %> for <%= noun1() %>.",
    "SCUM consists of <%= plural(noun()) %>; SCUM is not <%= a(noun()) %>, <%= a(noun()) %>.",
    "SCUM: Together we make <%= a(adjective()) %> <%= noun() %>.",
    "SCUM: one <%= noun() %> at a time.",
    "SCUM: We are here to <%= verb() %> the <%= noun() %>.",
    "SCUM: We're here, we're <%= adjective() %>, get used to it!",
    "SCUM: By any <%= plural(noun()) %> necessary.",
    "SCUM: <%= capital(verb()) %> <%= plural(noun())%>, not <%= plural(noun()) %>.",
    "SCUM: <%= capital(verb()) %> the <%= noun() %>, eliminate the <%= adjective() %> <%= noun() %>, institute <%= adjective() %> <%= plural(noun()) %> and destroy the male sex.",
    "Every man, deep down, knows he's <%= a(adjective()) %> <%= noun() %> of <%= noun() %>.",
    "SCUM - always <%= adjective() %>, always <%= adjective() %> - will always aim to avoid <%= plural(noun()) %> and <%= plural(noun()) %>.",
    "SCUM is impatient; SCUM is not consoled by the thought that <%= adjective() %> <%= plural(noun()) %> will thrive; SCUM wants to grab some <%= adjective() %> <%= gerund() %> for itself.",
    "But SCUM is too impatient to wait for the de-<%= gerund() %> of millions of <%= plural(noun()) %>.",
    "<%= capital(gerund()) %> out is not the answer; <%= gerund() %>-up is.",
    "<%= capital(gerund()) %> out, however, is <%= a(adjective()) %> <%= noun() %> for men, and SCUM will <%= adverb() %> <%= verb() %> it.",
    "<%= capital(adjective())%> <%= noun() %>, besides '<%= gerund() %>' he's a 'Man', serves as an outlet for his hate.",
    "By being <%= adjective() %> and <%= adjective() %>, he is able to remain <%= adjective() %>, <%= adjective() %>, and thereby, to inspire fear ('respect').",
"SCUM <%= plural(noun()) %> will not charge for <%= plural(noun()) %>.",
"SCUM <%= noun() %> and <%= noun() %> workers, in addition to <%= gerund() %>-up their work, will <%= adverb() %> destroy <%= plural(noun()) %>.",
"<%= capital(noun()) %> being for him impossible on this earth, he invented <%= capital(noun()) %>.",
    "SCUM will keep on <%= gerund() %>, <%= gerund() %>, <%= gerund() %>-up, and <%= gerund() %> until the money-work system no longer exists.",
    "Sex is the <%= noun() %> of the <%= plural(noun()) %>.",
    "The male is, by his very nature, <%= a(noun()) %>, <%= a(adjective()) %> <%= noun() %> and, therefore, not <%= adverb() %> entitled to live.",
    "To call a man <%= a(noun()) %> is to flatter him; he's <%= a(noun()) %>, a <%= gerund() %> <%= noun() %>."
];

var wordFinders = function() {

    var capitalize = function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    };

    var adjective = function() { return randomWords.adjective.pick().word; };
    var adverb = function() { return randomWords.adverb.pick().word; };
    var gerund = function() { var v = verb(); return nlp.verb(v).conjugate().gerund; };
    var noun = function() { var n = singular(randomWords.noun.pickRemove().word); nounCache.push(n); return n; };
    // make noun, etc. take an optional index paramenter, 1-indexed
    // if present, return the cache corresponding to the index (if available)
    // otherwise return a random noun
    // TODO: do a remove, instead of a pick ???
    // var n = function(i) { if (i && i < nounCache.length) { return nounCache[i]; } else {
    var noun1 = function() { return nounCache[0]; };
    var plural = function(noun) { return nlp.noun(noun).pluralize(); };
    var singular = function(noun) { return inflection.singularize(noun); };
    var pronoun = function() { var pn = randomWords.pronoun.pick().word; pronounCache.push(pn); return pn; };
    var pronoun1 = function() { return pronounCache[0]; };
    var verb = function() { return randomWords.verb.pickRemove().word; };
    var verbTransitive = function() { return randomWords.verb.pickRemove().word; };
    var a = function(word) { return article(word) + ' ' + word; };

    return {
	a: a,
        adjective: adjective,
        adverb: adverb,
	capital: capitalize,
        gerund: gerund,
        noun1: noun1,
        noun: noun,
        plural: plural,
	singular: singular,
        pronoun: pronoun,
        pronoun1: pronoun1,
        verb: verb,
        verbTransitive: verbTransitive
    };

}();


var tweetable = function(tweet) {

    var acceptable = true;
    var reason = "";

    if (wordfilter.blacklisted(tweet)) {
        acceptable = false;
        reason = "blacklisted";
    }
    if (tweet.length > 140 || tweet.length < 3) {
        acceptable = false;
        reason = "invalid length";
    }

    if (!acceptable) { console.log("NOT TWEETABLE (" + reason + "): " + tweet); }

    return acceptable;

};


var getSentence = function() {

    var s = "";
    var count = 0;
    do {
        count++;
        // console.log(randomWords);
        nounCache = [];
        pronounCache = [];

        var tmpl = templates.pick();
        // console.log(tmpl);
        var t = _.template(tmpl);
        s = t(wordFinders);

        // console.log(s);
    } while (!tweetable(s) && count < 5);

    return s;

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
