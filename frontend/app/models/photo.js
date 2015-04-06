import DS from 'ember-data';
import Em from 'ember';
import autosave from '../models/autosave';

var attr = DS.attr,
    ro = {readOnly:true};

var _cached = {};
var _flight = {};



export default DS.Model.extend(autosave,{

    autosave_properties: ['title','caption','tags'],
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
    get_image: function (req_long_edge,img) {

        var max_long_edge = Math.min(1600, Math.max(this.get('width'), this.get('height'))),
            fetched_long_edge = Math.min(+req_long_edge,+max_long_edge).toFixed(0),
            surl = this.get('serving_url') + '=s',
            id = this.get('id'),
            images = [img];

        if (!Em.isNone(img)){ img.attr('data-last-url',surl); }

        if (req_long_edge === 0 || fetched_long_edge ===0 ){ return; }

        if (id in _cached === false){
            //Nothing in cache - just get the dom image to fetch it and watch it load...
            _cached[id] = fetched_long_edge;
        } else {

            //Don't fetch a smaller version of what we already have fetched
            if (_cached[id] >= +fetched_long_edge || this.get('_saving') === true) {

                //If we're already fetching it, make sure we replace the background of this img too
                if (id in _flight === true) {
                    _flight[id].pushObject(img);
                }
            } else {
                //Use currently cached image, fetch the larger version and then update the img
                _flight[id] = images;
                var image = new Image();
                image.onload = function () {

                    delete _flight[id];
                    _cached[id] = fetched_long_edge;

                    images.forEach(function (img) {
                        if (img) {
                            //Don't replace an image if the dom object has more recently requested something else
                            if (surl === img.attr('data-last-url') === true) {
                                img.css({
                                    'background-image': 'url(' + surl + fetched_long_edge + ')'
                                });
                            }
                        }
                    });
                };
                image.src = surl + fetched_long_edge;
            }
        }

        return surl + _cached[id];
    },

    //Local properties
    selected: false,
    visible: false
});
