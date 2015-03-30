from google.appengine.ext import ndb


class Permissions(ndb.Model):

    user = ndb.KeyProperty('User')

    view = ndb.BooleanProperty()
    edit = ndb.BooleanProperty()
    move = ndb.BooleanProperty()
    upload = ndb.BooleanProperty()
    delete = ndb.BooleanProperty()


    @classmethod
    def check_user(cls,model,method,user):

        perms = getattr(model,'permissions')

        req_method = {
            'GET': lambda x: x.view is True,
            'PUT': lambda x: x.edit is True,
            'DELETE': lambda x: x.delete is True
        }


        for perm in perms:
            if perm.user == user.key:
                if method in req_method:
                    return req_method[method](model)

        return False

class Permission(object):

    def pre_validate(self, method, model, user):
        #Check permissions before we know if the model exists
        return True

    def post_validate(self, method, model, user):
        #Validate permission based on actual model referenced
        return True

    def apply_permissions_filter(self, query, model, user):
        #Apply a filter to the query
        return query

    def update_field_check(self, model, fields):
        #Check if we're allowed to modify the particular field
        return True


class PermissionAnyone(Permission):
    def apply_permissions_filter(self, query, model, user):
        return None

class PermissionUser(PermissionAnyone):

    #Must be logged in
    def pre_validate(self, method, model, user):
        return user is not None

class PermissionObjectOwner(Permission):

    def _get_owner_property(self, model):
        if not hasattr(model, 'RESTMeta') or not hasattr(model.RESTMeta, 'user_owner_property'):
            raise ValueError('The user model class does not have a properly configured owner property')
        return getattr(model.RESTMeta, 'user_owner_property')


class PermissionAlbum(PermissionObjectOwner):

    # ...only query for objects they own or have been granted permission to view
    def apply_permissions_filter(self, query, model, user):
        owner_property = getattr(model, self._get_owner_property(model))
        permissions_property = getattr(model, 'permissions')
        return query.filter(ndb.OR(owner_property == user.key,permissions_property == Permissions(user=user.key,view=True)))

    #They can only modify objects they own
    def post_validate(self, method, model, user=None):

        if user is None:
            if method == 'GET' and model.allow_anon is True:
                return True
            return False

        owner_property = self._get_owner_property(type(model))
        permissions_property = getattr(model, 'permissions')

        # new model - set owner property
        if method == 'POST':
            setattr(model, owner_property, user.key)
            return True

        # Model owner can do anything
        if getattr(model, owner_property) == user.key:
            return True

        return Permissions.check_user(model,method,user)

import logging
class PermissionPhoto(Permission):

    # ...only query for photos that are in a album that they own or have been granted permission to view
    def apply_permissions_filter(self, query, model, user):

        filter = None

        check_type = lambda x: getattr(x,'_FilterNode__name') == 'album' and getattr(x,'_FilterNode__opsymbol') == u'='
        get_val = lambda x: getattr(x,'_FilterNode__value')

        try:
            for f in query.filters:
                if check_type(f):
                    filter = get_val(f)
        except TypeError:
            if check_type(query.filters):
                filter = get_val(query.filters)

        if filter is None:
            logging.exception(query.filters)
            return None

        assert filter.kind() == 'Album'
        album = ndb.Key(urlsafe=str(filter)).get()
        assert album is not None,filter.__dict__

        if album.allow_anon is True or album.owner == user.key or Permissions.check_user(album,'GET',user):
            return query

        return None



PERMISSION_ANYONE = [PermissionAnyone()]
PERMISSION_LOGGED_IN_USER = [PermissionUser()]
PERMISSION_ALBUM = [PermissionAlbum()]
PERMISSION_PHOTO = [PermissionPhoto()]

REGISTER_PERMISSIONS = {
    'POST': PERMISSION_ANYONE
}

ANON_VIEWER = {
    'GET': PERMISSION_ANYONE
}

PERM_APPLY = lambda x: {'GET': x, 'POST': x, 'PUT': x, 'DELETE': x}
