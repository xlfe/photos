import DS from 'ember-data';
import Em from 'ember';
import autosave from '../models/autosave';

var attr = DS.attr,
    ro = {readOnly:true};

var _cached = {};
var _flight = {};



export default DS.Model.extend(autosave,{

    autosave_properties: ['title','caption'],
    autosave_properties_immediate: ['pos','path'],

    //ReadOnly

    album:      attr('string',      ro),
    filename:   attr('string',      ro),
    md5:        attr('string',      ro),
    uploaded:   attr('isodatetime', ro),
    modified:   attr('isodatetime', ro),
    width:      attr('number',      ro),
    height:     attr('number',      ro),
    metadata:   attr('object',      ro),
    serving_url: attr('string',     ro),

    //Mutable
    title:      attr('string'),
    caption:    attr('string'),
    pos:        attr('string'),
    path:       attr('string'),
    tags:       attr('list'),


    _filename: function(){
        var i = this.get('filename') ||'';
        return i.substr(0, i.lastIndexOf('.')) || i;
    }.property('filename'),
    get_image: function (req_long_edge,cb) {

        var max_long_edge = Math.min(1600, Math.max(this.get('width'), this.get('height'))),
            fetched_long_edge = Math.min(+req_long_edge,+max_long_edge).toFixed(0),
            surl = this.get('serving_url') + '=s',
            id = this.get('id'),
            cache = _cached[id],
            image = new Image();

        if (req_long_edge === 0 || fetched_long_edge ===0 ){
            return;
        }


        var onload = function(){
            _cached[id] = fetched_long_edge;
            _flight[id] = false;
            if (cb) {
                cb(surl + fetched_long_edge);
            }
        };

        if (Em.isNone(cache)){
            //Nothing in cache

            _flight[id] = true;
            image.onload = onload;
            image.src = surl + fetched_long_edge;
            return surl + fetched_long_edge;

        } else {

            if (+cache > +fetched_long_edge || this.get('_saving') === true || _flight[id] === true) {
                //Don't fetch a smaller version of what we already have cached...
                return surl + cache;
            } else {
                //Use currently cached image, fetch the larger version and then update _in_cache
                _flight[id] = true;
                image.onload = onload;
                image.src = surl + fetched_long_edge;
                return surl + cache;
            }
        }
    },

    //Local properties
    selected: false
});
