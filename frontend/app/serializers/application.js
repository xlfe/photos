import DS from 'ember-data';

export default DS.RESTSerializer.extend({
    serializeAttribute: function (record, json, key, attribute) {
        if (!attribute.options.readOnly) {
            return this._super(record, json, key, attribute);
        }
    },
    serializeHasMany: function (snapshot, json, relationship) {
        if (!relationship.options.readOnly){
            this._super.apply(this, arguments);
        }
    }
});

