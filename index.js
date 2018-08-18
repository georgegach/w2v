import Model from './lib/model.js'
import WordVector from './lib/wordvector.js'

const w2v = {
    model: null,
    lib: Model
}


w2v.loadTxtModel = (text, callback) => {
    var words;
    var size;
    var vocabulary = [];
    var lines = text.split('\n')
    for (var counter = 0; counter < lines.length; counter++) {
        var line = lines[counter];
        var values;
        var word;
        var arr;
        var len;
        var val;
        var a;
        var i;
        var o;

        if (counter === 0) {
            arr = line.split(' ');
            words = arr[0];
            size = arr[1];
            if (isNaN(words) || isNaN(size)) {
                throw new Error('First line of text file has to be <number of words> <length of vector>.');
            }
        } else {
            arr = line.split(' ');
            word = arr.shift(1);

            values = [];
            for (i = 0; i < arr.length; i++) {
                val = arr[i];
                if (val !== '') {
                    values.push(parseFloat(val));
                }
            }
            o = new WordVector(word, values);

            len = 0;
            for (a = 0; a < size; a++) {
                len += o.values[a] * o.values[a];
            }
            len = Math.sqrt(len);
            for (a = 0; a < size; a++) {
                o.values[a] /= len;
            }
            vocabulary.push(o);
        }
    }

    w2v.model = new Model({ vocabulary, size });
    
    callback(w2v)
}


export default w2v