import DS from 'ember-data';
import Em from 'ember';
import autosave from '../models/autosave';

var attr = DS.attr,
    ro = {readOnly:true};


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

    get_image: function (req_long_edge,cb) {

        var max_long_edge = Math.min(1600, Math.max(this.get('width'), this.get('height'))),
            fetched_long_edge = Math.min(+req_long_edge,+max_long_edge).toFixed(0),
            surl = this.get('serving_url') + '=s',
            _this = this,
            filename =this.get('filename'),
            cache = this.get('_in_cache'),
            image = new Image();

        if (req_long_edge === 0 || fetched_long_edge ===0){
            return;
        }

        if (Em.isNone(cache)){
            //Nothing in cache
            image.onload = function() {
                _this.set('_in_cache',fetched_long_edge);
            };
            image.src = surl + fetched_long_edge;
            return surl + fetched_long_edge;

        } else {

            if (+cache > +fetched_long_edge) {
                //Don't fetch a smaller version of what we already have cached...
                return surl + cache;
            } else {

                //Use currently cached image, fetch the larger version and then update _in_cache
                image.onload = function() {
                    _this.set('_in_cache',+fetched_long_edge);
                    if (cb){
                        cb(surl + fetched_long_edge);
                    }
                };
                image.src = surl + fetched_long_edge;
                return surl + cache;
            }
        }
    },
    _in_cache: null,

    //Local properties
    selected: false
});
