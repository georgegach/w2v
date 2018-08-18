export default function WordVector(word, values) {
    this.word = word;
    this.values = values;
}


WordVector.prototype.add = function (word) {
    var i,
        values,
        len;

    len = this.values.length;
    values = new Array(len);
    for (i = 0; i < this.values.length; i++) {
        values[i] = this.values[i] + word.values[i];
    }
    return new WordVector(null, values);
};


WordVector.prototype.subtract = function (word) {
    var i,
        values,
        len;

    len = this.values.length;
    values = new Array(len);
    for (i = 0; i < this.values.length; i++) {
        values[i] = this.values[i] - word.values[i];
    }
    return new WordVector(null, values);
};