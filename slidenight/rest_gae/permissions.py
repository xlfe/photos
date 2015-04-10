from google.appengine.ext import ndb

class Permissions(ndb.Model):

    user = ndb.KeyProperty(kind='User')
    view = ndb.BooleanProperty()
    edit = ndb.BooleanProperty()
    comment = ndb.BooleanProperty()
    sort = ndb.BooleanProperty()
    move = ndb.BooleanProperty()
    upload = ndb.BooleanProperty()
    delete = ndb.BooleanProperty()


    @classmethod
    def get_permission(cls, model, user):

        perms = getattr(model,'permissions')

        req_method = {
            'GET': lambda x: x.view is True,
            'PUT': lambda x: x.edit is True,
            'DELETE': lambda x: x.delete is True
        }

        applied_permission = Permissions()

        for perm in perms:

            #Anon user, but permission is for a specific user
            if perm.user is not None and user is None:
                continue

            #Logged in user, but not the user for whom this permission applies
            if user is not None and perm.user != user.key:
                continue

            for t,p in applied_permission._properties.iteritems():
                if isinstance(p,ndb.BooleanProperty) is False:
                    continue
                v = getattr(perm,t,False)
                if v is True:
                    setattr(applied_permission,t,True)

        return applied_permission

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

    def update_field_check(self, model, fields, user):
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

    #Only allow viewing of objects
    method_reqs = {
        'GET': lambda x: x.view is True,
    }

    # ...only query for objects they own or have been granted permission to view
    def apply_permissions_filter(self, query, model, user):

        #Only logged in users can search for albums
        if user is None:
            return None

        #Only albums that the user has been invited to view or owns
        owner_property = getattr(model, self._get_owner_property(model))
        permissions_property = getattr(model, 'permissions')
        p = Permissions(user=user.key,view=True)

        return query.filter(ndb.OR(owner_property == user.key,permissions_property ==p))


    #For albums, only the owners can only modify the album, and only those with view permissions can view
    def post_validate(self, method, model, user):

        owner_property = self._get_owner_property(type(model))

        # new model - set owner property
        if method == 'POST':
            setattr(model, owner_property, user.key)
            return True

        # Model owner can do anything
        if user is not None and getattr(model, owner_property) == user.key:
            return True

        if method not in self.method_reqs:
            return False

        applied = Permissions.get_permission(model, user)
        if self.method_reqs[method](applied) is True:
            return True

        return False

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
    method_reqs ={
        'QUERY': lambda x: x.view is True,
        'GET': lambda x: x.view is True,
        'POST': lambda x: x.upload is True,
        'PUT': lambda x: x.edit is True or x.sort is True or x.move is True,
        'DELETE':lambda x:x.delete is True
    }

    change_reqs ={
        'title': lambda x: x.edit is True,
        'tags': lambda x: x.edit is True,
        'pos': lambda x:x.sort is True,
        'path': lambda x:x.move is True
    }

    def apply_permissions_filter(self, query, model, user):

        #Only allow searching for photos where we have an album specified
        try:
            album = self.album_from_query(query)
        except AssertionError:
            return None

        #Album owner is allowed
        if user is not None and album.owner == user.key:
            return query

        applied = Permissions.get_permission(album, user)
        if self.method_reqs['QUERY'](applied) is True:
            return query

        return None

    def post_validate(self, method, model, user):

        album = model.album.get()
        assert album is not None

        #Album owner can do anything
        if user is not None and album.owner == user.key:
            return True

        applied = Permissions.get_permission(album,user)
        if method not in self.method_reqs:
            return False

        if self.method_reqs[method](applied) is True:
            return True

        return False


    def update_field_check(self, model, fields, user):

        album = model.album.get()
        assert album is not None

        #Album owner can do anything
        if user is not None and album.owner == user.key:
            return True

        applied = Permissions.get_permission(album,user)

        for field in fields:
            if field not in self.change_reqs:
                return False

            if self.change_reqs[field](applied) is not True:
                return False

        logging.info('CHANGED '+str(fields))
        return True




class PermissionComment(Permission,AlbumQuery):
    #only allows GET POST DELETE

    def apply_permissions_filter(self, query, model, user):

        #Only allow searching for photos where we have an album specified
        try:
            album = self.album_from_query(query)
        except AssertionError:
            return None

        #Album owner is allowed
        if user is not None and album.owner == user.key:
            return query

        applied = Permissions.get_permission(album, user)
        if applied.view is True:
            return query

        return None

    def post_validate(self, method, model, user):

        album = model.album.get()
        assert album is not None

        #Album owner can do anything
        if user is not None and album.owner == user.key:
            return True

        applied = Permissions.get_permission(album,user)

        if method == 'DELETE':

            #Only the owner of the comment with comment permission can delete
            if applied.comment ==True \
                    and model.user is not None \
                    and user is not None \
                    and model.user == user.key:
                return True

        if method == 'GET':

            #Any user with view permissions
            if applied.view is True:
                return True

        if method == 'POST':

            if applied.comment is True:
                return True

        return False

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
PERMISSION_COMMENT = [PermissionComment()]
PERMISSION_INVITE = [PermissionInvite()]

REGISTER_PERMISSIONS = {
    'POST': PERMISSION_ANYONE
}

ANON_VIEWER = {
    'GET': PERMISSION_ANYONE
}

PERM_APPLY = lambda x: {'GET': x, 'POST': x, 'PUT': x, 'DELETE': x}
PERM_PHOTO = lambda x: {'GET': x, 'PUT': x, 'DELETE': x}
PERM_COMMENT = lambda x: {'GET': x, 'POST': x, 'DELETE': x}
