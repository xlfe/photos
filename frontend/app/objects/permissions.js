import Em from 'ember';


var _relies_on = function (vals) {
    return function (s, o) {
        var dependent = false;

        vals.forEach(function (k) {
            if (o.get(k) === true) {
                dependent = true;
            }

        });

        if (dependent) {
            return true;
        }

        return s;
    }
}

export default Em.Object.extend({

    permissions: {
        view: _relies_on(['edit', 'move', 'upload', 'delete']),
        edit: _relies_on(['move', 'upload', 'delete']),
        move: _relies_on(['upload', 'delete']),
        upload: _relies_on(['delete']),
        delete: _relies_on([])
    },

    init: function () {
        this._super();

        for (var k in this.get('permissions')) {
            this.set(k, false);
            Ember.addObserver(this, k, this, this.object_obs);
        }
        Ember.addObserver(this, 'user', this, this.object_obs);

        this.object_obs();
    },
    user: null,

    object: {},
    object_obs: function () {
        var obj = {},
            permissions = this.get('permissions');

        for (var k in this.get('permissions')) {
            obj[k] = permissions[k](this.get(k), this);
            this.set(k, obj[k]);
        }

        this.set('no_edit', obj['edit'] === false);
        obj['user'] = this.get('user')

        if (Em.isNone(obj.user) === true) {
            this.set('_user', {
                full_name: 'Anonymous Users'
            });
        }

        this.set('object', obj);
    },

    load: function (obj) {
        for (var k in obj) {
            this.set(k, obj[k]);
        }
        return this;
    }
});

