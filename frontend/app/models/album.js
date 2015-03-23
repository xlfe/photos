import Em from 'ember';
import DS from 'ember-data';
import autosave from '../models/autosave';

function chunkify(t) {
    var tz = new Array();
    var x = 0, y = -1, n = 0, i, j;

    while (i = (j = t.charAt(x++)).charCodeAt(0)) {
        var m = (i == 46 || (i >= 48 && i <= 57));
        if (m !== n) {
            tz[++y] = "";
            n = m;
        }
        tz[y] += j;
    }
    return tz;
}

export default DS.Model.extend(autosave,{
    autosave_properties: ['name'],


    //Sort properties
    sort_properties : {
        //Filename
        0: function (a,b) {

            var aa = chunkify(a.get('filename'));
            var bb = chunkify(b.get('filename'));

            for (var x = 0; aa[x] && bb[x]; x++) {
                if (aa[x] !== bb[x]) {
                    var c = Number(aa[x]), d = Number(bb[x]);
                    if (c == aa[x] && d == bb[x]) {
                        return c - d;
                    } else return (aa[x] > bb[x]) ? 1 : -1;
                }
            }
            return aa.length - bb.length;
        },
        //Position
        1: function(a,b){

        }
    },
    sort_fn: function(){
        return this.sort_properties[this.get('sort_property')];
    }.property('sort_property'),

    name: DS.attr('string'),
    sort_property: DS.attr('number'),


    //Self generated
    photos: [],
    more_results: true
});

