
from google.appengine.ext import ndb
from google.appengine.api import users
from google.appengine.ext.deferred import defer
from google.appengine.api import images
from google.appengine.ext import blobstore
import logging
import datetime
import os


import httplib2
from oauth2client.appengine import AppAssertionCredentials


DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Development')

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
    def _blobinfo(self):
        if self.blob:
            return self.blob
        else:
            return blobstore.create_gs_key(self.gs)
    @property
    def _serving_url(self):
        return images.get_serving_url(blob_key=self._blobinfo,secure_url=True)


    @staticmethod
    def after_delete(deleted_keys,models):

        logging.info(models)
        for m in models:
            blobstore.delete(m._blobinfo)






