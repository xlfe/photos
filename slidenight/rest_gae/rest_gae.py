import json
from datetime import datetime, time, date
from urllib import urlencode
import webapp2
from google.appengine.ext import ndb
from google.appengine.ext.ndb import Cursor
from google.appengine.ext.db import BadValueError, BadRequestError
from webapp2_extras import sessions
from webapp2_extras.routes import NamePrefixRoute
from permissions import *

try:
    import dateutil.parser
except ImportError as e:
    dateutil = None

import logging

model_ember_key = lambda (model):model._get_kind().lower()[0] + model._get_kind()[1:]

class NDBEncoder(json.JSONEncoder):
    """JSON encoding for NDB models and properties"""

    def default(self, obj):
        if isinstance(obj, ndb.Model):
            obj_dict = obj.to_dict()

            # Filter the properties that will be returned to user
            included_properties = get_included_properties(obj, 'output')

            obj_dict = dict((k,v) for k,v in obj_dict.iteritems() if k in included_properties)
            obj_dict['id'] = obj.key.urlsafe()

            return obj_dict

        elif isinstance(obj, datetime) or isinstance(obj, date) or isinstance(obj, time):
            return obj.isoformat()

        elif isinstance(obj, ndb.Key) or isinstance(obj,ndb.KeyProperty):
            return obj.urlsafe()

        else:
            return super(NDBEncoder,self).default(obj)

class RESTException(Exception):
    """REST methods exception"""
    pass


#
# Utility functions
#

def get_included_properties(model, input_type):
    """Gets the properties of a `model` class to use for input/output (`input_type`). Uses the
    model's Meta class to determine the included/excluded properties."""

    meta_class = getattr(model, 'RESTMeta', None)

    included_properties = set()

    if meta_class:
        included_properties = set(getattr(meta_class, 'included_%s_properties' % input_type, []))
        included_properties.update(set(getattr(meta_class, 'included_properties', [])))

    if not included_properties:
        # No Meta class (or no included properties defined), assume all properties are included
        included_properties = set(model._properties.keys())

    if meta_class:
        excluded_properties = set(getattr(meta_class, 'excluded_%s_properties' % input_type, []))
        excluded_properties.update(set(getattr(meta_class, 'excluded_properties', [])))



    else:
        # No Meta class, assume no properties are excluded
        excluded_properties = set()

    # Add some default excluded properties
    if input_type == 'input':
        excluded_properties.update(set(BaseRESTHandler.DEFAULT_EXCLUDED_INPUT_PROPERTIES))
        # if meta_class and getattr(meta_class, 'use_input_id', False):
        #     included_properties.update(['id'])

    if input_type == 'output':
        excluded_properties.update(set(BaseRESTHandler.DEFAULT_EXCLUDED_OUTPUT_PROPERTIES))

    # Calculate the properties to include
    properties = included_properties - excluded_properties

    return properties


def import_class(input_cls):
    """Imports a class (if given as a string) or returns as-is (if given as a class)"""

    if not isinstance(input_cls, str):
        # It's a class - return as-is
        return input_cls

    try:
        (module_name, class_name) = input_cls.rsplit('.', 1)
        module = __import__(module_name, fromlist=[class_name])
        return getattr(module, class_name)
    except Exception, exc:
        # Couldn't import the class
        raise ValueError("Couldn't import the model class '%s'" % input_cls)


class BaseRESTHandler(webapp2.RequestHandler):
    """Base request handler class for REST handlers (used by RESTHandlerClass and UserRESTHandlerClass)"""


    # The default number of results to return for a query in case `limit` parameter wasn't provided by the user
    DEFAULT_MAX_QUERY_RESULTS = 1000

    # The names of properties that should be excluded from input/output
    DEFAULT_EXCLUDED_INPUT_PROPERTIES = [ 'class_' ] # 'class_' is a PolyModel attribute
    DEFAULT_EXCLUDED_OUTPUT_PROPERTIES = [ ]


    #
    # Session related methods/properties
    #


    def dispatch(self):
        """Needed in order for the webapp2 sessions to work"""

        # Get a session store for this request.
        self.session_store = sessions.get_store(request=self.request)

        try:
            if getattr(self, 'allow_http_method_override', False) and ('X-HTTP-Method-Override' in self.request.headers):
                # User wants to override method type
                overridden_method_name = self.request.headers['X-HTTP-Method-Override'].upper().strip()
                if overridden_method_name not in ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']:
                    return self.method_not_allowed()

                self.request.method = overridden_method_name


            if getattr(self, 'allowed_origin', None):
                allowed_origin = self.allowed_origin

                if 'Origin' in self.request.headers:
                    # See if the origin matches
                    origin = self.request.headers['Origin']

                    if (origin != allowed_origin) and (allowed_origin != '*'):
                        return self.permission_denied('Origin not allowed')


            # Dispatch the request.
            response = webapp2.RequestHandler.dispatch(self)

        except:
            raise
        else:
            # Save all sessions.
            self.session_store.save_sessions(response)

        return response


    @webapp2.cached_property
    def session(self):
        """Shortcut to access the current session."""
        return self.session_store.get_session(backend="datastore")

    def get_response(self, status, content):
        """Returns an HTTP status message with JSON-encoded content (and appropriate HTTP response headers)"""

        # Create the JSON-encoded response
        response = webapp2.Response(json.dumps(content, cls=NDBEncoder))

        response.status = status

        response.headers['Content-Type'] = 'application/json'
        response.headers['Access-Control-Allow-Methods'] = ', '.join(self.permissions.keys())
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'X-Requested-With, Content-Type, Accept'


        if getattr(self, 'allowed_origin', None):
            response.headers['Access-Control-Allow-Origin'] = self.allowed_origin

        return response

    def success(self, content):
        return self.get_response(200, content)

    def error(self, exception):
        return self.get_response(400, {'error': str(exception)})

    def method_not_allowed(self):
        return self.get_response(405, {})

    def permission_denied(self, reason=None):
        return self.get_response(403, { 'reason': reason})

    def unauthorized(self):
        return self.get_response(401, {})

    def redirect(self, url, **kwd):
        return webapp2.redirect(url, **kwd)



    #
    # Utility methods
    #


    def _model_id_to_model(self, model_id):
        """Returns the model according to the model_id; raises an exception if invalid ID / model not found"""

        if not model_id:
            return None

        try:
            model = ndb.Key(urlsafe=model_id).get()
            if not model:
                raise Exception()
        except Exception, exc:
            # Invalid key name
            raise RESTException('Invalid model id - %s' % model_id)

        return model

    def _filter_query(self):
        """Filters the query results for given property filters (if provided by user)."""

        query = self.request.GET.get('q')

        if not query:
            # No query given - return as-is
            return self.model.query()

        return self.model.gql('WHERE ' + query)

    def _fetch_query(self, query):
        """Fetches the query results for a given limit (if provided by user) and for a specific results page (if given by user).
        Returns a tuple of (results, cursor_for_next_fetch). cursor_for_next_fetch will be None is no more results are available."""

        if not self.request.GET.get('limit'):
            # No limit given - use default limit
            limit = BaseRESTHandler.DEFAULT_MAX_QUERY_RESULTS
        else:
            try:
                limit = int(self.request.GET.get('limit'))
                if limit <= 0: raise ValueError('Limit cannot be zero or less')
            except ValueError, exc:
                # Invalid limit value
                raise RESTException('Invalid "limit" parameter - %s' % self.request.GET.get('limit'))

        if not self.request.GET.get('cursor'):
            # Fetch results from scratch
            cursor = None
        else:
            # Continue a previous query
            try:
                cursor = Cursor(urlsafe=self.request.GET.get('cursor'))
            except BadValueError, exc:
                raise RESTException('Invalid "cursor" argument - %s' % self.request.GET.get('cursor'))

        try:
            (results, cursor, more_available) = query.fetch_page(limit, start_cursor=cursor)
        except BadRequestError, exc:
            # This happens when we're using an existing cursor and the other query arguments were messed with
            raise RESTException('Invalid "cursor" argument - %s' % self.request.GET.get('cursor'))

        if not more_available:
            cursor = None

        return (results, cursor)


    def _order_query(self, query):
        """Orders the query if input given by user. Returns the modified, sorted query"""

        if not self.request.GET.get('order'):
            # No order given
            orders = []

        else:

            orders = [o.strip() for o in self.request.GET.get('order').split(',')]
            orders = ['+'+o if not o.startswith('-') and not o.startswith('+') else o for o in orders]
            translated_orders = dict([order.lstrip('-+'), order[0]] for order in orders)
            orders = [-getattr(self.model, order) if direction == '-' else getattr(self.model, order) for order,direction in translated_orders.iteritems()]


        # Always use a sort-by-key order at the end - this solves the case where the query uses IN or != operators - since we're using a cursor
        # to fetch results - there is a requirement for this solution in order for the fetch_page to work. See "Query cursors" at
        # https://developers.google.com/appengine/docs/python/ndb/queries
        orders.append(self.model.key)

        # Return the ordered query
        return query.order(*orders)

    def _build_model_from_data(self, data, cls, model=None,check_permissions=None):
        """Builds a model instance (according to `cls`) from user input and returns it. Updates an existing model instance if given.
        Raises exceptions if input data is invalid."""

        # Transform any raw input data into appropriate NDB properties - write all transformed properties
        # into another dict (so any other unauthorized properties will be ignored).
        input_properties = {}
        for (name, prop) in cls._properties.iteritems():
            if name not in data: continue # Input not given by user

            if prop._repeated:
                # This property is repeated (i.e. an array of values)
                input_properties[name] = [self._value_to_property(value, prop) for value in data[name]]
            else:
                input_properties[name] = self._value_to_property(data[name], prop)

        # if not model and getattr(cls, 'RESTMeta', None) and getattr(cls.RESTMeta, 'use_input_id', False):
        #     if 'id' not in data:
        #         raise RESTException('id field is required')
        # input_properties['id'] = data['id']

        # Filter the input properties
        included_properties = get_included_properties(cls, 'input')

        input_properties = dict((k,v) for k,v in input_properties.iteritems() if k in included_properties)

        # Set the user owner property to the currently logged-in user (if it's defined for the model class) - note that we're doing this check on the input `cls` parameter
        # and not the self.model class, since we need to support when a model has an inner StructuredProperty, and that model has its own RESTMeta definition.
        if hasattr(cls, 'RESTMeta') and hasattr(cls.RESTMeta, 'user_owner_property'):
            if not model and self.user:
                # Only perform this update when creating a new model - otherwise, each update might change this (very problematic in case an
                # admin updates another user's model instance - it'll change model ownership from that user to the admin)
                input_properties[cls.RESTMeta.user_owner_property] = self.user.key

        if not model:
            # Create a new model instance
            try:
                model = cls(**input_properties)
            except BadValueError as exc:
                raise RESTException(exc)
        else:
            # Update an existing model instance

            modified = []

            for ip in input_properties:
                if getattr(model,ip) != input_properties[ip]:
                    modified.append(ip)

            if check_permissions.update_field_check(cls,modified) is not True:
                raise self.unauthorized()

            model.populate(**input_properties)

        return model

    def _value_to_property(self, value, prop):
        """Converts raw data value into an appropriate NDB property"""
        if value is None:
            return None
        if isinstance(prop, ndb.KeyProperty):
            if value is None:
                return None

            try:
                return ndb.Key(urlsafe=value)
            except:
                raise RESTException('invalid key: {}'.format(value) )
        elif isinstance(prop, ndb.TimeProperty):
            if dateutil is None:
                try:
                    return datetime.strptime(value, "%H:%M:%S").time()
                except ValueError as e:
                    raise RESTException("Invalid time. Must be in ISO 8601 format.")
            else:
                return dateutil.parser.parse(value).time()
        elif  isinstance(prop, ndb.DateProperty):
            if dateutil is None:
                try:
                    return datetime.strptime(value, "%Y-%m-%d").date()
                except ValueError as e:
                    raise RESTException("Invalid date. Must be in ISO 8601 format.")
            else:
                return dateutil.parser.parse(value).date()
        elif isinstance(prop, ndb.DateTimeProperty):
            if dateutil is None:
                try:
                    return datetime.strptime(value, "%Y-%m-%dT%H:%M:%S")
                except ValueError as e:
                    raise RESTException("{} had invalid datetime. Must be in ISO 8601 format.".format(value))
            else:
                return dateutil.parser.parse(value)
        elif isinstance(prop, ndb.GeoPtProperty):
            # Convert from string (formatted as '52.37, 4.88') to GeoPt
            return ndb.GeoPt(value)
        elif isinstance(prop, ndb.StructuredProperty):
            # It's a structured property - the input data is a dict - recursively parse it as well
            return self._build_model_from_data(value, prop._modelclass)
        elif isinstance(prop,ndb.FloatProperty):
            try:
                return float(value)
            except:
                return None
        elif isinstance(prop,ndb.IntegerProperty):
            return int(value)
        else:
            # Return as-is (no need for further manipulation)
            return value




def get_rest_class(ndb_model, base_url, **kwd):
    """Returns a RESTHandlerClass with the ndb_model and permissions set according to input"""

    class RESTHandlerClass(BaseRESTHandler):

        model = import_class(ndb_model)
        # Save the base API URL for the model (used for BlobKeyProperty)
        if not hasattr(model, 'RESTMeta'):
            class NewRESTMeta: pass
            model.RESTMeta = NewRESTMeta
        model.RESTMeta.base_url = base_url

        permissions = { 'OPTIONS': [PermissionAnyone()] }
        permissions.update(kwd.get('permissions', {}))

        #User object passed when class created
        user_model = kwd.get('user_model','User')

        allow_http_method_override = kwd.get('allow_http_method_override', True)
        allowed_origin = kwd.get('allowed_origin', None)

        # Wrapping in a list so the functions won't be turned into bound methods
        after_get_callback = [kwd.get('after_get_callback', None)]
        before_post_callback = [kwd.get('before_post_callback', None)]
        after_post_callback = [kwd.get('after_post_callback', None)]
        before_put_callback = [kwd.get('before_put_callback', None)]
        after_put_callback = [kwd.get('after_put_callback', None)]
        before_delete_callback = [kwd.get('before_delete_callback', None)]
        after_delete_callback = [kwd.get('after_delete_callback', None)]

        def __init__(self, request, response):
            self.initialize(request, response)

            self.after_get_callback = self.after_get_callback[0]
            self.before_post_callback = self.before_post_callback[0]
            self.after_post_callback = self.after_post_callback[0]
            self.before_put_callback = self.before_put_callback[0]
            self.after_put_callback = self.after_put_callback[0]
            self.before_delete_callback = self.before_delete_callback[0]
            self.after_delete_callback = self.after_delete_callback[0]


        def rest_method_wrapper(func):
            """Wraps GET/POST/PUT/DELETE methods and adds standard functionality"""

            def inner_f(self, model_id):

                #Is method allowed?
                method_name = func.func_name.upper()
                if method_name not in self.permissions:
                    return self.method_not_allowed()

                #See if we know the user
                self.user = None
                if 'user' in self.session:
                    self.user = ndb.Key(self.user_model, self.session['user']).get()

                # Verify permissions - (pre_validate)
                accepted_permission = self._get_permission(method_name)
                if accepted_permission is None:
                    return self.unauthorized()

                try:
                    if model_id:

                        model = self._model_id_to_model(model_id.lstrip('/')) # Get rid of '/' at the beginning

                        #Check specific model permissions (post_validate)
                        if accepted_permission.post_validate(method_name, model, self.user) is not True:
                            return self.unauthorized()

                        result = func(self, model)
                    else:

                        #not a specific object
                        result = func(self, None)

                    if isinstance(result, webapp2.Response):
                        return result
                    else:
                        return self.success(result)

                except RESTException as exc:
                    return self.error(exc)

            return inner_f


        #
        # REST endpoint methods
        #



        @rest_method_wrapper
        def options(self, model):
            """OPTIONS endpoint - doesn't return anything (only returns options in the HTTP response headers)"""
            return ''


        @rest_method_wrapper
        def get(self, model):
            """GET endpoint - retrieves a single model instance (by ID) or a list of model instances by query"""

            if not model:
                # Return a query with multiple results

                query = self._filter_query() # Filter the results

                permission = self._get_permission('GET')
                assert permission is not None

                query = permission.apply_permissions_filter(query, self.model, self.user)

                if query is None:
                    return self.unauthorized()

                # Order the results
                query = self._order_query(query)

                # Fetch them (with a limit / specific page, if provided)
                (results, cursor) = self._fetch_query(query)

                response = {
                    self.model._get_kind(): results,
                    'meta': {
                        'next_results_url': cursor.urlsafe() if cursor else None
                    }
                }

            else:

                response = {
                    self.model._get_kind(): model
                }

            return response


        @rest_method_wrapper
        def post(self, model):
            """POST endpoint - adds a new model instance"""

            if model:
                raise RESTException('Cannot POST to a specific model ID')

            kind = model_ember_key(self.model)

            try:
                json_data = json.loads(self.request.body)[kind]
            except ValueError as exc:
                raise RESTException('Invalid JSON POST data - expecting {} but got {}'.format(kind,'-'.join(k for k in self.request.body)))
            except KeyError:
                raise RESTException('Did not find model of type {} in the JSON data'.format(kind))

            # for model_to_create in json_data:
            try:
                # Any exceptions raised due to invalid/missing input will be caught
                model = self._build_model_from_data(json_data, self.model)

            except Exception as exc:
                raise RESTException('Invalid JSON POST data - %s' % exc)

            if model.key is not None and model.key.get() is not None:
                raise RESTException('Cannot POST to an existing model')

            if self.before_post_callback:
                model = self.before_post_callback(model, json_data)

            # Commit all models in a transaction
            model.put()
            created_keys = [model.key]

            if self.after_post_callback:
                model = self.after_post_callback(created_keys, model)

            # Return the newly-created model instance(s)
            return {
                kind: [model]
            }


        @rest_method_wrapper
        def put(self, model):
            """PUT endpoint - updates an existing model instance"""

            try:
                # Parse PUT data as JSON
                json_data = json.loads(self.request.body)[model_ember_key(model)]
            except ValueError as exc:
                logging.info('Invalid json: '+self.request.body)
                raise RESTException('Invalid JSON PUT data')
            except KeyError as exc:
                logging.info('Invalid json: ' + self.request.body)
                logging.info('Model type: ' + model._get_kind())
                raise RESTException('Entity name mismatch')

            if type(json_data) is list:
                raise RESTException('List not supported on PUT')

            permission = self._get_permission('PUT')
            assert permission is not None

            # Commit all models in a transaction
            try:
                model = self._build_model_from_data(json_data, self.model, model, permission)
            except Exception as exc:
                logging.exception('Caught error when trying to make model from data')
                raise RESTException('Unable to save - {0}'.format(exc))

            if self.before_put_callback:
                model = self.before_put_callback(model, json_data)

            # Commit all models in a transaction
            try:
                updated_keys = model.put()
            except TypeError as exc:
                logging.exception('Caught error when trying to put model {0}'.format(model))
                logging.exception(exc)
                raise RESTException('Unable to save - please check you have filled in all fields correctly')

            if self.after_put_callback:
                model = self.after_put_callback(updated_keys, model)

            response = {
                self.model._get_kind(): model
            }

            return response

        @rest_method_wrapper
        def delete(self, model):
            """DELETE endpoint - deletes an existing model instance"""
            models = []

            if model:
                models.append(model)
            else:
                # Delete multiple model instances

                query = self.model.query()

                permission = self._get_permission('DELETE')

                query = permission.filter_query(query, self.model, self.user)

                # Delete the models (we might need to fetch several pages in case of many results)
                cursor = None
                more_available = True

                while more_available:
                    results, cursor, more_available = query.fetch_page(BaseRESTHandler.DEFAULT_MAX_QUERY_RESULTS, start_cursor=cursor)
                    if results:
                        models.extend(results)

            if self.before_delete_callback:
                models = self.before_delete_callback(models)

            deleted_keys = ndb.delete_multi(m.key for m in models)

            if self.after_delete_callback:
                self.after_delete_callback(deleted_keys, models)

            # Return the deleted models
            return None

        #
        # Utility methods/properties
        #

        def _get_permission(self, method):
            accepted_permission = None
            permissions = self.permissions.get(method, [])

            if not isinstance(permissions, list):
                permissions = [permissions]

            for permission_object in permissions:
                if permission_object.pre_validate(method, self.model, self.user):
                    accepted_permission = permission_object
                    break

            return accepted_permission




    # Return the class statically initialized with given input arguments
    return RESTHandlerClass


class RESTHandler(NamePrefixRoute): # We inherit from NamePrefixRoute so the same router can actually return several routes simultaneously (used for BlobKeyProperty)
    """Returns our RequestHandler with the appropriate permissions and model. Should be used as part of the WSGIApplication routing:
            app = webapp2.WSGIApplication([('/mymodel', RESTHandler(
                                                MyModel,
                                                permissions={
                                                    'GET': PERMISSION_ANYONE,
                                                    'POST': PERMISSION_LOGGED_IN_USER,
                                                    'PUT': PERMISSION_OWNER_USER,
                                                    'DELETE': PERMISSION_ADMIN
                                                }
                                           )])
    """

    def __init__(self, url, model, **kwd):

        url = url.rstrip(' /')
        model = import_class(model)

        if not url.startswith('/'):
            raise ValueError('RESHandler url should start with "/": %s' % url)

        routes = [
                # Make sure we catch both URLs: to '/mymodel' and to '/mymodel/123'
                webapp2.Route(url + '<model_id:(/.+)?|/>', get_rest_class(model, url, **kwd), 'main')
            ]


        included_properties = get_included_properties(model, 'input')

        super(RESTHandler, self).__init__('rest-handler-', routes)


