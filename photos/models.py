
from google.appengine.ext import ndb
from google.appengine.api import users
from google.appengine.ext.deferred import defer
import logging
# from webapp2_extras.security import generate_random_string
import datetime

class User(ndb.Model):

    email = ndb.StringProperty()

    @classmethod
    def current_user(self):
        return None


class Photo(ndb.Model):

    owner = ndb.KeyProperty(kind=User, required=False)
    uploaded = ndb.DateTimeProperty(auto_now_add=True)
    modified = ndb.DateTimeProperty(auto_now=True)

    title = ndb.StringProperty(indexed=False)
    caption = ndb.TextProperty(indexed=False)
    tags = ndb.StringProperty(repeated=True)

    taken = ndb.DateTimeProperty()
    blob = ndb.BlobProperty()






