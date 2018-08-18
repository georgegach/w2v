import WordVector from './wordvector.js'

export default class Model {

    constructor(params) {
        this.words = params.vocabulary.length
        this.size = params.size
        this.vocabulary = params.vocabulary
        this.err = null;
        this.N = 0
    }
}

Model.prototype.getVector = function (word) {
    for (var i = 0; i < this.words; i++) {
        if (this.vocabulary[i].word === word) {
            return this.vocabulary[i];
        }
    }
    return null;
};

Model.prototype.getVectors = function (words) {
    if (!words) {
        return this.vocabulary;
    } else {
        return this.vocabulary.filter(function onElement(w) {
            return _.contains(words, w.word);
        });
    }
};

Model.prototype.similarity = function (word1, word2) {
    var vecs = [];
    var sum;
    var i;
    for (i = 0; i < this.words; i++) {
        if (this.vocabulary[i].word === word1 || this.vocabulary[i].word === word2) {
            vecs.push(this.vocabulary[i].values);
        }
    }
    if (vecs.length === 2) {
        sum = 0;
        for (i = 0; i < this.size; i++) {
            sum += vecs[0][i] * vecs[1][i];
        }
        return sum;
    } else if (vecs.length === 1 && word1 === word2) {
        // Case: word1 and word2 are identical:
        return 1.0;
    }
    // Case: At least one of the words is not available in this.vocabulary:
    return null;
};

Model.prototype.normalize = function (values) {
    var a;
    var vec = values;
    var size = values.length;
    var len = 0;

    for (a = 0; a < this.size; a++) {
        len += vec[a] * vec[a];
    }
    len = Math.sqrt(len);
    for (a = 0; a < this.size; a++) {
        vec[a] /= len;
    }

    return vec;
};


Model.prototype.getNearestWord = function (vec) {
    var bestw;
    var bestd;
    var c;
    var a;

    if (vec instanceof WordVector === true) {
        vec = vec.values;
    }
    vec = normalize(vec);

    for (c = 0; c < this.words; c++) {
        var dist = 0;
        for (a = 0; a < this.size; a++) {
            dist += vec[a] * this.vocabulary[c].values[a];
        }
        if (c === 0 || dist > bestd) {
            bestd = dist;
            bestw = this.vocabulary[c].word;
        }
    }

    var o = {};
    o.word = bestw;
    o.dist = bestd;
    return o;
};

Model.prototype.getNearestWords = function (vec, N_input) {
    var bestd;
    var bestw;
    var dist;
    var ret;
    var d;
    var i;
    var c;
    var a;

    this.N = N_input || 10;
    if (vec instanceof WordVector === true) {
        vec = vec.values;
    }
    vec = normalize(vec);

    bestw = new Array(this.N);
    bestd = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf, -1);

    for (c = 0; c < this.words; c++) {
        dist = 0;
        for (a = 0; a < this.size; a++) {
            dist += vec[a] * this.vocabulary[c].values[a];
        }
        for (a = 0; a < this.N; a++) {
            if (dist > bestd[a]) {
                for (d = this.N - 1; d > a; d--) {
                    bestd[d] = bestd[d - 1];
                    bestw[d] = bestw[d - 1];
                }
                bestd[a] = dist;
                bestw[a] = this.vocabulary[c].word;
                break;
            }
        }
    }

    ret = [];
    for (i = 0; i < this.N; i++) {
        var o = {};
        o.word = bestw[i];
        o.dist = bestd[i];
        ret[i] = o;
    }
    return ret;
};

Model.prototype.mostSimilar = function (input_phrase, N_input) {
    var phrase_words;
    var phrase;
    var bestw;
    var bestd;
    var found;
    var dist;
    var vec;
    var len;
    var cn;
    var a;
    var b;
    var c;
    var i;
    var d;
    var o;
    var invalidfound;

    this.N = N_input || 40;
    phrase = {
        words: [],
        output: {}
    };
    phrase_words = input_phrase.split(' ');
    if (phrase_words.slice(-1) == '')
        phrase_words = phrase_words.slice(0,-1)

    for (i = 0; i < phrase_words.length; i++) {
        o = {
            word: phrase_words[i],
            pos: -1
        };
        phrase.words.push(o);
    }

    bestw = new Array(this.N);
    bestd = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf, -1);
    cn = phrase.words.length;
    // Boolean checking whether at least one phrase word is in dictionary...
    found = false;
    invalidfound = false;
    for (a = 0; a < cn; a++) {
        for (b = 0; b < this.words; b++) {
            if (phrase.words[a].word === this.vocabulary[b].word) {
                found = true;
                phrase.words[a].pos = b;
                break;
            }
        }
        if (phrase.words[a].pos === -1) {
            invalidfound = true
            // console.log('Out of dictionary word: ' + phrase.words[a].word + '\n');
        }
    }

    if (found === false) {
        // All words are out-of-dictionary, return `null`:
        return {
            error: {
                code: 'E02',
                message: 'Out of dictionary word',
            },
            result: null
        };
    }

    vec = [];
    for (i = 0; i < this.size; i++) {
        vec[i] = 0;
    }
    for (b = 0; b < cn; b++) {
        if (phrase.words[b].pos !== -1) {
            for (a = 0; a < this.size; a++) {
                vec[a] += this.vocabulary[phrase.words[b].pos].values[a];
            }
        }
    }

    // Normalizing vector vec...
    len = 0;
    for (a = 0; a < this.size; a++) {
        len += vec[a] * vec[a];
    }
    len = Math.sqrt(len);
    for (a = 0; a < this.size; a++) {
        vec[a] = vec[a] / len;
    }

    // Iterate through this.vocabulary...
    for (c = 0; c < this.words; c++) {
        a = 0;
        for (b = 0; b < cn; b++) {
            if (phrase.words[b].pos === c) {
                a = 1;
            }
        }
        if (a !== 1) {
            dist = 0;
            for (a = 0; a < this.size; a++) {
                dist += vec[a] * this.vocabulary[c].values[a];
            }
            for (a = 0; a < this.N; a++) {
                if (dist > bestd[a]) {
                    for (d = this.N - 1; d > a; d--) {
                        bestd[d] = bestd[d - 1];
                        bestw[d] = bestw[d - 1];
                    }
                    bestd[a] = dist;
                    bestw[a] = this.vocabulary[c].word;
                    break;
                }
            }
        }
    }

    var ret = [];
    for (i = 0; i < this.N; i++) {
        o = {};
        o.word = bestw[i];
        o.dist = bestd[i];
        ret[i] = o;
    }
    return {
        error: invalidfound ? {
            code: 'E02',
            message: 'At least one word is not in dictionary'
        } : null,
        result: ret
    };
};

Model.prototype.analogy = function (word, pair, N_input) {
    var phrase;
    var bestw;
    var bestd;
    var ret;
    var vec;
    var bi;
    var cn;
    var a;
    var b;
    var d;
    var i;
    var o;

    this.N = N_input || 40;
    if (word.constructor !== String) {
        throw new TypeError('Word of interest has to be supplied as string.');
    }
    if (pair.constructor !== Array) {
        throw new TypeError('Word pair has to be supplied in string Array.');
    }
    phrase = {
        words: pair,
        output: {}
    };

    phrase.words.push(word);
    phrase.words = phrase.words.map(function (word) {
        o = {};
        o.word = word;
        o.pos = -1;
        return o;
    });

    bestw = new Array(this.N);
    bestd = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf, 0);
    cn = phrase.words.length;
    bi = phrase.words;
    vec = Array.apply(null, new Array(this.size)).map(Number.prototype.valueOf, 0);
    var notfounds = []
    for (a = 0; a < cn; a++) {
        for (b = 0; b < this.words; b++) {
            if (phrase.words[a].word === this.vocabulary[b].word) {
                phrase.words[a].pos = b;
                break;
            }
        }
        if (phrase.words[a].pos === -1) 
            notfounds.push(phrase.words[a].word)

    }
    if (notfounds.length > 0)
        return {
            error: {
                code: 'E01',
                message: 'Out of dictionary word',
                targets: notfounds,
            },
            result: null
        }

    for (b = 0; b < cn; b++) {
        if (phrase.words[b].pos !== -1) {
            for (a = 0; a < this.size; a++) {
                vec[a] += this.vocabulary[phrase.words[b].pos].values[a];
            }
        }
    }

    for (a = 0; a < this.size; a++) {
        vec[a] = this.vocabulary[bi[1].pos].values[a] - this.vocabulary[bi[0].pos].values[a] + this.vocabulary[bi[2].pos].values[a];
    }

    var len = 0;
    for (a = 0; a < this.size; a++) {
        len += vec[a] * vec[a];
    }
    len = Math.sqrt(len);
    for (a = 0; a < this.size; a++) {
        vec[a] /= len;
    }

    for (var c = 0; c < this.words; c++) {
        if (c === bi[0].pos) {
            continue;
        }
        if (c === bi[1].pos) {
            continue;
        }
        if (c === bi[2].pos) {
            continue;
        }
        a = 0;
        for (b = 0; b < cn; b++) {
            if (bi[b].pos === c) {
                a = 1;
            }
        }
        if (a === 1) {
            continue;
        }
        var dist = 0;
        for (a = 0; a < this.size; a++) {
            dist += vec[a] * this.vocabulary[c].values[a];
        }
        for (a = 0; a < this.N; a++) {
            if (dist > bestd[a]) {
                for (d = this.N - 1; d > a; d--) {
                    bestd[d] = bestd[d - 1];
                    bestw[d] = bestw[d - 1];
                }
                bestd[a] = dist;
                bestw[a] = this.vocabulary[c].word;
                break;
            }
        }
    }

    ret = [];
    for (i = 0; i < this.N; i++) {
        o = {};
        o.word = bestw[i];
        o.dist = bestd[i];
        ret[i] = o;
    }
    return {
        error: null,
        result: ret
    };
};
