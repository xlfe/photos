import Em from 'ember';

export default Em.Controller.extend({
    queryParams: ['path'],
    p_obs: function() {
        var cp = this.get('path'),
            model = this.get('model.photos');
        if (Em.none(model)){
            return
        }
        this.set('model.photos.current_path',cp);
    }.observes('path'),
    pp_obs: function() {
        var mpcp = this.get('model.photos.current_path');
        if (Em.none(mpcp)){
            return
        }
        this.set('path',this.get('model.photos.current_path'));
        console.log(this.get('path'))
    }.observes('model.photos.current_path')
});

