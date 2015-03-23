
from google.appengine.ext import ndb
from google.appengine.api import users
from google.appengine.ext.deferred import defer
from google.appengine.api import images
from google.appengine.ext import blobstore
import logging
import datetime


class User(ndb.Model):

    first_name = ndb.StringProperty()
    last_name = ndb.StringProperty()
    email = ndb.StringProperty()

    @property
    def full_name(self):
        return '{} {}'.format(self.first_name, self.last_name)

    @classmethod
    def current_user(self):
        return None


class Album(ndb.Model):

    FILENAME = 0
    POS = 1

    name = ndb.StringProperty()
    sort_property = ndb.IntegerProperty(default=0)

class Photo(ndb.Model):

    class RESTMeta:

        excluded_properties = ['blob','gs','original_metadata']


    title = ndb.StringProperty(indexed=False)
    caption = ndb.StringProperty(indexed=False)
    tags = ndb.StringProperty(repeated=True)
    path = ndb.StringProperty()
    pos = ndb.StringProperty()

    #Read only
    filename = ndb.StringProperty(required=True)
    md5 = ndb.StringProperty(required=True)
    taken = ndb.DateTimeProperty()

    uploaded = ndb.DateTimeProperty(auto_now_add=True)
    width = ndb.IntegerProperty(required=True)
    height = ndb.IntegerProperty(required=True)

    modified = ndb.DateTimeProperty(auto_now=True)



    #Other data
    original_metadata = ndb.JsonProperty()
    blob = ndb.BlobKeyProperty()
    gs = ndb.StringProperty()
    album = ndb.KeyProperty(Album)

    serving_url = ndb.StringProperty()

    @property
    def _serving_url(self):
        if self.blob:
            _key = self.blob
        else:
            _key = blobstore.create_gs_key(self.gs)
        return images.get_serving_url(blob_key=_key,secure_url=True)








