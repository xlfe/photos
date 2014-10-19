#!/usr/bin/env python

import webapp2
import json
from google.appengine.api import users
from google.appengine.ext import ndb
from rest_gae import RESTHandler
from rest_gae.permissions import *
import os
import logging
from models import *

config = {
    'webapp2_extras.sessions' : {
        'secret_key': 'downtheonlyroad8DS9KKJAS8SDJKSDJKFS82JSKksdjfksd*U(#&*(@#8382938',
    }
}

OWNER_PERMISSIONS = {
    'GET': PERMISSION_ANYONE,
    'POST': PERMISSION_ANYONE,
    'PUT': PERMISSION_ANYONE,
    'DELETE': PERMISSION_ADMIN
}

class InitHandler(webapp2.RequestHandler):
    #We can assume there is a logged in user, given our auth setup in index.yaml
    def get(self):

        for i in range(20):

            p = Photo()
            p.put()

        return self.response.out.write('ok')


from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.api import images


class PrepareUpload(webapp2.RequestHandler):
    def get(self):

        count = int(self.request.get('count'))

        urls_rpc = [blobstore.create_upload_url_async('/api/upload') for i in range(count)]

        urls = [r.get_result() for r in urls_rpc]

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(urls))
        return

class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):
    def post(self):
        upload_files = self.get_uploads('file')  # 'file' is file upload field in the form
        blob_info = upload_files[0]

        name = self.request.get('name')
        album = ndb.Key('Album',self.request.get('album'))

        photo = Photo(blob=blob_info.key(),filename=name,album=album)
        photo.put()

        return
        # self.response.out.write(photo.serving_url)



app = webapp2.WSGIApplication([
        webapp2.Route('/api/init',InitHandler),
        webapp2.Route('/api/prepare-upload',PrepareUpload),
        webapp2.Route('/api/upload',UploadHandler),

        RESTHandler('/api/users',User,permissions=OWNER_PERMISSIONS,user_object=User),
        RESTHandler('/api/photos',Photo,permissions=OWNER_PERMISSIONS,user_object=User),
        RESTHandler('/api/albums',Album,permissions=OWNER_PERMISSIONS,user_object=User),
      ],
    debug=True,
    config=config
)
