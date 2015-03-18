
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
    class RESTMeta:
        sideload_properties = ['photos']

    name = ndb.StringProperty()
    minHeight = ndb.IntegerProperty(default=200,required=True)
    manualSort = ndb.IntegerProperty(repeated=True)

    def photos(self,sideloads):

        keys = Photo.query(Photo.album == self.key).fetch(keys_only=True)
        (results, cursor, more_available) = Photo.query(Photo.album == self.key).fetch_page(5)

        sideloads['photos'] = results

        # return [r.key.urlsafe() for r in results]

        return keys


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








