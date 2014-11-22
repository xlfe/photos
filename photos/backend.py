#!/usr/bin/env python

import webapp2
import json
import uuid
from google.appengine.api import users
from google.appengine.ext import ndb
from rest_gae import RESTHandler
from rest_gae.rest_gae import NDBEncoder
from rest_gae.permissions import *
import os
import logging
from models import *

DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Development')

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


from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.api import images


import httplib2
from oauth2client.appengine import AppAssertionCredentials


class PrepareUpload(webapp2.RequestHandler):
    def post(self):

        params = json.loads(self.request.body)

        required = ['album','filename','size','type']
        for r in required:
            assert r in params
        for p in params:
            assert p in required

        params['name'] = params['album'] + '/' + uuid.uuid4().hex,

        if not DEBUG:
            credentials = AppAssertionCredentials(scope='https://www.googleapis.com/auth/devstorage.read_write')
            http = credentials.authorize(httplib2.Http())
            endpoint = 'https://www.googleapis.com/upload/storage/v1/b/slidenight/o?uploadType=resumable'

            headers = {
                'X-Upload-Content-Type':params['type'],
                'X-Upload-Content-Length': params['size'],
                'Origin': self.request.host_url,
                'Content-Type': 'application/json; charset=UTF-8'
            }

            (resp_headers,content) = http.request(uri=endpoint,method='POST',body=json.dumps(params),headers=headers)

            if resp_headers['status'] == '200':

                upload = {
                    'location':resp_headers['location'],
                    'chunk_size': (256 * 1024) * 4 * 2 #2mb chunks
                }

        else:

            url = blobstore.create_upload_url('/api/upload')

            self.response.headers['Content-Type'] = 'application/json'

            upload = {
                'location': url,
                'chunk_size': params['size']
            }

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(upload))

        return

class GCSFinalizeHandler(webapp2.RequestHandler):

    def post(self):

        params = json.loads(self.request.body)

        blobstore_filename = '/gs/' + params['id']
        album = ndb.Key(urlsafe=params['album'])
        _album = album.get()


        img = images.Image(filename=blobstore_filename)
        img.rotate(0)
        img.execute_transforms(parse_source_metadata=True)

        if 'DateTime' not in img.get_original_metadata():
            logging.info(img.get_original_metadata())

        try:
            orientation = int(img.get_original_metadata()['Orientation'])
        except KeyError:
            orientation = None

        # orient_map = {
        #     3: lambda i: i.rotate(180),
        #     6: lambda i: i.rotate(90),
        #     8: lambda i: i.rotate(-90)
        # }

        # if orientation in orient_map:
        #     orient_map[orientation](img)

        first,last = Photo.allocate_ids(1,parent=album)

        photo = Photo(parent=album, id=first,
                      gs = blobstore_filename,
                      title=params['name'],
                      album_pos_id = first,
                      filename=params['name'],
                      album=album,
                      width=img.width,
                      height= img.height,
                      orientation = orientation,
                      original_metadata=img.get_original_metadata(),
                      )

        # if orientation in [6,8]:
        #     photo.width = img.height
        #     photo.height = img.width

        photo.put()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(photo.key.urlsafe()))


class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):
    """Only used by the dev_appserver"""

    def post(self):
        upload_files = self.get_uploads('file')  # 'file' is file upload field in the form
        blob_info = upload_files[0]

        name = blob_info.filename
        album = ndb.Key(urlsafe=self.request.get('album'))
        _album = album.get()


        img = images.Image(blob_key=blob_info.key())
        img.rotate(0)
        img.execute_transforms(parse_source_metadata=True)

        if 'DateTime' not in img.get_original_metadata():
            logging.info(img.get_original_metadata())

        try:
            orientation = int(img.get_original_metadata()['Orientation'])
        except KeyError:
            orientation = None

        # orient_map = {
        #     3: lambda i: i.rotate(180),
        #     6: lambda i: i.rotate(90),
        #     8: lambda i: i.rotate(-90)
        # }

        # if orientation in orient_map:
        #     orient_map[orientation](img)

        first,last = Photo.allocate_ids(1,parent=album)

        photo = Photo(parent=album, id=first,
            blob=blob_info.key(),
            title=name,
            album_pos_id = first,
            filename=name,
            album=album,
            width=img.width,
            height= img.height,
            orientation = orientation,
            original_metadata=img.get_original_metadata(),
        )

        # if orientation in [6,8]:
        #     photo.width = img.height
        #     photo.height = img.width

        photo.put()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(photo.key.urlsafe()))



app = webapp2.WSGIApplication([
        webapp2.Route('/api/prepare-upload',PrepareUpload),
        webapp2.Route('/api/finalize-upload',GCSFinalizeHandler),
        webapp2.Route('/api/upload',UploadHandler),

        RESTHandler('/api/users',User,permissions=OWNER_PERMISSIONS,user_object=User),
        RESTHandler('/api/photos',Photo,permissions=OWNER_PERMISSIONS,user_object=User),
        RESTHandler('/api/albums',Album,permissions=OWNER_PERMISSIONS,user_object=User),
      ],
    debug=True,
    config=config
)
