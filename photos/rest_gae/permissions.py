class Permission(object):
    def pre_validate(self, method, model, user=None):
        return True

    def filter_query(self, query, model, user=None):
        return query

    def post_validate(self, method, instances, user=None):
        return instances

    def allowed_query(self):
        return True

    def update_field_check(self,model,fields):
        return True


class PermissionAnyone(Permission):
    pass


class PermissionAdmin(Permission):
    def __init__(self, meta_admin_property):
        self.meta_admin_property = meta_admin_property

    def _user_is_admin(self, user):
        if user is None: return False
        if not hasattr(user, 'RESTMeta') or not hasattr(user.RESTMeta, self.meta_admin_property):
            raise ValueError('The user model class does not have a properly configured admin property')
        admin_property = getattr(user.RESTMeta, self.meta_admin_property)
        return getattr(user, admin_property)

    def pre_validate(self, method, model, user=None):
        return self._user_is_admin(user)

    def post_validate(self, method, instances, user=None):
        if self._user_is_admin(user):
            return instances
        return False


class PermissionUser(Permission):
    def pre_validate(self, method, model, user=None):
        return user is not None

    def post_validate(self, method, instances, user=None):
        if user is not None:
            return instances
        return None

import logging

class PermissionInGroup(PermissionUser):

    def _get_groups_property(self,model):
        if not hasattr(model, 'RESTMeta') or not hasattr(model.RESTMeta, 'group_permissions'):
            raise ValueError('The model class does not have a properly configured group_permissions property')
        return getattr(model.RESTMeta, 'group_permissions')

    def pre_validate(self, method, model, user=None):
        group_perms = self._get_groups_property(model)
        for group in group_perms[method]:
            if group in user.groups:
                return True
        return False

class PermissionInGroupApplied(PermissionInGroup):

    def _get_groups_accessor(self,model):
        if not hasattr(model, 'RESTMeta') or not hasattr(model.RESTMeta, 'group_accessor'):
            raise ValueError('The model class does not have a properly configured group_accessor property')
        return getattr(model.RESTMeta, 'group_accessor')

    def post_validate(self, method, instance, user):

        group_perms = self._get_groups_property(instance)
        accessor = self._get_groups_accessor(instance)
        perms = filter(lambda g: g.lower().startswith(getattr(instance,accessor).lower()),group_perms[method])
        for group in perms:
            if group in user.groups:
                return instance
        return None

class PermissionInGroupSpecific(PermissionInGroup):

    # def post_validate(self, method, instance, user=None):
    #     return instance

    def allowed_query(self):
        return False

class PermissionFinanceOnlyDL(PermissionUser):
    def pre_validate(self, method, model, user=None):
        if 'finance' in user.groups:
            return True
        return False

class PermissionOwner(PermissionUser):

    def __init__(self, meta_owner_property):
        self.meta_owner_property = meta_owner_property

    def _get_owner_property(self, model):
        if not hasattr(model, 'RESTMeta') or not hasattr(model.RESTMeta, self.meta_owner_property):
            raise ValueError('The user model class does not have a properly configured owner property')
        return getattr(model.RESTMeta, self.meta_owner_property)

    def filter_query(self, query, model, user=None):
        model_owner_property = getattr(model, self._get_owner_property(model))
        return query.filter(model_owner_property == user.key)

    def post_validate(self, method, instance, user=None):

        owner_property = self._get_owner_property(type(instance))
        if method == "POST":
            setattr(instance, owner_property, user.key)
        else:
            # logging.info(getattr(instance,owner_property))
            if getattr(instance, owner_property) != user.key:
                return None
        return instance

class PermissionOwnerAllowed(PermissionOwner):
    def __init__(self, meta_owner_property,meta_allowed_property):
        self.meta_owner_property = meta_owner_property
        self.meta_allowed_property = meta_allowed_property

    def _get_allowed_property(self, model):
        if not hasattr(model, 'RESTMeta') or not hasattr(model.RESTMeta, self.meta_allowed_property):
            raise ValueError('The user model class does not have a properly configured allowed property')
        return getattr(model.RESTMeta, self.meta_allowed_property)

    def filter_query(self, query, model, user=None):
        model_owner_property = getattr(model, self._get_owner_property(model))
        return query.filter(model_owner_property == user.key)

    def update_field_check(self,model,fields):

        allowed = self._get_allowed_property(model)

        logging.info(fields)
        logging.info(allowed)
        return True

    def post_validate(self, method, instance, user=None):

        owner_property = self._get_owner_property(type(instance))
        if method == "POST":
            setattr(instance, owner_property, user.key)
        else:
            # logging.info(getattr(instance,owner_property))
            if getattr(instance, owner_property) != user.key:
                return None
        return instance


PERMISSION_ANYONE = [PermissionAnyone()]
PERMISSION_LOGGED_IN_USER = [PermissionUser()]
PERMISSION_OWNER_USER = [PermissionAdmin('admin_property'), PermissionOwner('user_owner_property')]
PERMISSION_ADMIN = [PermissionAdmin('admin_property')]
PERMISSION_ADMIN_OR_ALLOWED = [PermissionAdmin('admin_property'),PermissionOwnerAllowed('user_owner_property','owner_allowed_properties')]
PERMISSION_IN_GROUP = [PermissionInGroup()]
PERMISSION_IN_GROUP_SPECIFIC = [PermissionInGroupSpecific()]
PERMISSION_IN_GROUP_APPLIED = [PermissionInGroupApplied()]
PERMISSION_NOONE = []
PERMISSION_FINANCE = [PermissionFinanceOnlyDL()]