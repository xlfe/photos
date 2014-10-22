
from google.appengine.ext import ndb
from google.appengine.api import users
from google.appengine.ext.deferred import defer
from google.appengine.api import images
import logging
# from webapp2_extras.security import generate_random_string
import datetime



class User(ndb.Model):

    email = ndb.StringProperty()

    @classmethod
    def current_user(self):
        return None


class Album(ndb.Model):
    name = ndb.StringProperty()
    sortProperties = ndb.StringProperty()
    sortAscending = ndb.BooleanProperty()

class Photo(ndb.Model):

    class RESTMeta:

        excluded_properties = ['blob']

    owner = ndb.KeyProperty(kind=User, required=False)
    uploaded = ndb.DateTimeProperty(auto_now_add=True)
    modified = ndb.DateTimeProperty(auto_now=True)
    original_metadata = ndb.JsonProperty()
    width = ndb.IntegerProperty()
    height = ndb.IntegerProperty()
    orientation = ndb.IntegerProperty()

    title = ndb.StringProperty(indexed=False)
    caption = ndb.TextProperty(indexed=False)
    tags = ndb.StringProperty(repeated=True)

    taken = ndb.DateTimeProperty()
    blob = ndb.BlobKeyProperty()
    filename = ndb.StringProperty()
    album = ndb.KeyProperty(Album)

    serving_url = ndb.ComputedProperty(lambda k: k._serving_url)

    @property
    def _serving_url(self):

        url = images.get_serving_url(blob_key=self.blob)
        # if self.orientation == 6:
        #     url += '-r90'
        # elif self.orientation == 8:
        #     url += '-r270'

        return url








