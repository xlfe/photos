from google.appengine.ext import ndb

class Permissions(ndb.Model):

    view = ndb.BooleanProperty()
    edit = ndb.BooleanProperty()
    move = ndb.BooleanProperty()
    upload = ndb.BooleanProperty()
    delete = ndb.BooleanProperty()
    user = ndb.KeyProperty()


    @classmethod
    def check_user(cls,model,method,user):

        perms = getattr(model,'permissions')

        req_method = {
            'GET': lambda x: x.view is True,
            'PUT': lambda x: x.edit is True,
            'DELETE': lambda x: x.delete is True
        }

        allowed = False


        for perm in perms:
            if user is None and perm.user is not None:
                continue

            if user is not None and perm.user != user.key:
                continue

            if method in req_method:
                if req_method[method](perm) is True:
                    allowed = True

        for perm in perms:
            if perm.user is None:

                if method in req_method:
                    if req_method[method](perm) is True:
                        allowed = True

        return allowed

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
        p = Permissions(user=user.key,view=True)
        n = Permissions(user=None,view=True)
        return query.filter(ndb.OR(owner_property == user.key,permissions_property ==p,permissions_property == n))

    #They can only modify objects they own
    def post_validate(self, method, model, user=None):

        owner_property = self._get_owner_property(type(model))
        permissions_property = getattr(model, 'permissions')

        # new model - set owner property
        if method == 'POST':
            setattr(model, owner_property, user.key)
            return True

        # Model owner can do anything
        if user is not None and getattr(model, owner_property) == user.key:
            return True

        return Permissions.check_user(model,method,user)

import logging
class AlbumQuery():

    # ...only query for photos that are in a album that they own or have been granted permission to view
    def album_from_query(self, query):

        filter = None

        check_type = lambda x: getattr(x,'_FilterNode__name') == 'album' and getattr(x,'_FilterNode__opsymbol') == u'='
        get_val = lambda x: getattr(x,'_FilterNode__value')

        try:
            for f in query.filters:
                if check_type(f):
                    filter = get_val(f)
        except TypeError:
            try:
                if check_type(query.filters):
                    filter = get_val(query.filters)
            except AttributeError:
                return None

        if filter is None:
            return None

        assert filter.kind() == 'Album'
        album = ndb.Key(urlsafe=str(filter)).get()
        assert album is not None,filter.__dict__
        return album


class PermissionPhoto(Permission,AlbumQuery):

    def apply_permissions_filter(self, query, model, user):

        album = self.album_from_query(query)
        if album is None:
            return None

        if Permissions.check_user(album,'GET',user):
            return query

        elif user is not None and album.owner == user.key:
            return query

        return None

class PermissionInvite(PermissionUser,AlbumQuery):

    #only the album owner can query for the invites in an album
    def apply_permissions_filter(self, query, model, user):
        album = self.album_from_query(query)
        if album is None:
            return None

        if album.owner != user.key:
            return None

        return query

    #only the album owner can modify invites through the API
    def post_validate(self, method, model, user):

        album = model.album.get()
        if album is None:
            return False

        if album.owner != user.key:
            return False

        return True

PERMISSION_ANYONE = [PermissionAnyone()]
PERMISSION_LOGGED_IN_USER = [PermissionUser()]
PERMISSION_ALBUM = [PermissionAlbum()]
PERMISSION_PHOTO = [PermissionPhoto()]
PERMISSION_INVITE = [PermissionInvite()]

REGISTER_PERMISSIONS = {
    'POST': PERMISSION_ANYONE
}

ANON_VIEWER = {
    'GET': PERMISSION_ANYONE
}

PERM_APPLY = lambda x: {'GET': x, 'POST': x, 'PUT': x, 'DELETE': x}
