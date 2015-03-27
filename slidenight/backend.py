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
from hashlib import md5

DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Development')

config = {
    'webapp2_extras.sessions' : {
        'secret_key': 'sfidosuiofasuidoaufsodfsa*U(#&*(@#8382938'
    }
}

REGISTER_PERMISSIONS = {
    'POST': PERMISSION_ANYONE
}

OWNER_PERMISSIONS = {
    'GET': PERMISSION_ANYONE,
    'POST': PERMISSION_ANYONE,
    'PUT': PERMISSION_ANYONE,
    'DELETE': PERMISSION_ANYONE
}


from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.api import images


import httplib2
from oauth2client.appengine import AppAssertionCredentials

def allow_crosssite(response,origin='*'):
    response.headers['access-control-allow-origin'] = origin
    return response

class CrosssiteAllowed(webapp2.RequestHandler):
    def options(self):
        self.response.headers['access-control-allow-headers'] = 'X-Requested-With, Content-Type, Accept'
        self.response.headers['access-control-allow-methods'] = 'POST, PUT, GET, DELETE, OPTIONS'
        allow_crosssite(self.response,self.request.host)
        return self.response

class PrepareUpload(CrosssiteAllowed):

    def post(self):

        params = json.loads(self.request.body)

        required = ['album','filename','size','type','md5']
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
            allow_crosssite(self.response)

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
        assert _album is not None


        img = images.Image(filename=blobstore_filename)
        img.rotate(0)
        img.execute_transforms(parse_source_metadata=True)

        meta = img.get_original_metadata()
        meta['FileModified']=params['lastModifiedDate']

        first,last = Photo.allocate_ids(1,parent=album)

        photo = Photo(parent=album,
                      gs = blobstore_filename,
                      title=params['name'],
                      path=params['path'],
                      pos=str(float(first)/150000),
                      md5 = params['md5'],
                      filename=params['name'],
                      album=album,
                      width=img.width,
                      height= img.height,
                      metadata=meta
                      )

        photo.serving_url = photo._serving_url
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

        meta = img.get_original_metadata()
        meta['FileModified']=self.request.get('lastModifiedDate')

        first,last = Photo.allocate_ids(1,parent=album)
        photo = Photo(parent=album,
            blob=blob_info.key(),
            title=name,
            path=self.request.get('path'),
            pos=str(float(first)/150000),
            filename=name,
            album=album,
            md5=self.request.get('md5'),
            width=img.width,
            height= img.height,
            metadata=meta
        )

        photo.serving_url = photo._serving_url
        photo.put()

        self.response.headers['Content-Type'] = 'application/json'
        allow_crosssite(self.response)
        self.response.out.write(json.dumps(photo.key.urlsafe()))

ALLOWED_ORIGIN = '*'


app = webapp2.WSGIApplication([
        webapp2.Route('/api/prepare-upload',PrepareUpload),
        webapp2.Route('/api/finalize-upload',GCSFinalizeHandler),
        webapp2.Route('/api/upload',UploadHandler),
        webapp2.Route('/api/login',LoginHandler),

        RESTHandler('/api/register',User,permissions=REGISTER_PERMISSIONS,user_object=None, before_post_callback=User.new_user, allowed_origin=ALLOWED_ORIGIN),
        RESTHandler('/api/users',User,permissions=OWNER_PERMISSIONS,user_object=User,  allowed_origin=ALLOWED_ORIGIN),
        RESTHandler('/api/photos',Photo,permissions=OWNER_PERMISSIONS,user_object=User,allowed_origin=ALLOWED_ORIGIN,after_delete_callback=Photo.after_delete),
        RESTHandler('/api/albums',Album,permissions=OWNER_PERMISSIONS,user_object=User,allowed_origin=ALLOWED_ORIGIN),
      ],
    debug=True,
    config=config
)
