
from google.appengine.ext import ndb
from google.appengine.api import users
from google.appengine.ext.deferred import defer
from google.appengine.api import images
from google.appengine.ext import blobstore
import logging
import datetime
import general_counter


class User(ndb.Model):

    email = ndb.StringProperty()

    @classmethod
    def current_user(self):
        return None


class Album(ndb.Model):
    name = ndb.StringProperty()
    minHeight = ndb.IntegerProperty(default=200,required=True)
    manualSort = ndb.IntegerProperty(repeated=True)


class Photo(ndb.Model):

    class RESTMeta:

        excluded_properties = ['blob','gs','owner']

    owner = ndb.KeyProperty(kind=User, required=False)
    uploaded = ndb.DateTimeProperty(auto_now_add=True)
    modified = ndb.DateTimeProperty(auto_now=True)
    original_metadata = ndb.JsonProperty()
    width = ndb.IntegerProperty()
    height = ndb.IntegerProperty()
    orientation = ndb.IntegerProperty()

    pos = ndb.IntegerProperty()

    title = ndb.StringProperty(indexed=False)
    caption = ndb.TextProperty(indexed=False)
    tags = ndb.StringProperty(repeated=True)
    path = ndb.StringProperty()
    last_modified = ndb.DateTimeProperty()

    taken = ndb.DateTimeProperty()
    blob = ndb.BlobKeyProperty()
    gs = ndb.StringProperty()
    filename = ndb.StringProperty()
    album = ndb.KeyProperty(Album)

    serving_url = ndb.ComputedProperty(lambda k: k._serving_url)

    @property
    def _serving_url(self):
        if self.blob:
            _key = self.blob
        else:
            _key = blobstore.create_gs_key(self.gs)
        return images.get_serving_url(blob_key=_key,secure_url=True)








