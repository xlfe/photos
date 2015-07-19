#!/usr/bin/env python

import webapp2
import json
import base64
import cloudstorage as gcs
import uuid
from rest_gae.rest_gae import RESTHandler,BaseRESTHandler
from rest_gae.permissions import *
from models import Photo, Album, LoginHandler, ClaimHandler, VerifyHandler, Invite, User, Comment
from channels import ChannelHandler, ChannelConnectHandler, ChannelDisconnectHandler, SendUpdate
from batch_jobs import UpdateSchemaHandler
import os
from google.appengine.ext import blobstore, ndb
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.api import images
import httplib2
import binascii
from oauth2client.appengine import AppAssertionCredentials

DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Development')

config = {
    'webapp2_extras.sessions' : {
        'secret_key': 'sfidosuiofasuidoaufsodfsa*U(#&*(@#8382938'
    }
}

def allow_crosssite(response,origin='*'):
    response.headers['access-control-allow-origin'] = origin
    return response

class CrosssiteAllowed(webapp2.RequestHandler):
    def options(self):
        self.response.headers['access-control-allow-headers'] = 'X-Requested-With, Content-Type, Accept'
        self.response.headers['access-control-allow-methods'] = 'POST, PUT, GET, DELETE, OPTIONS'
        allow_crosssite(self.response,self.request.host)
        return self.response

class PrepareUpload(BaseRESTHandler):
    """Client posts here to get a google storage endpoint to upload to"""

    permissions = {'OPTIONS':None,'POST':None}

    def post(self):

        params = json.loads(self.request.body)

        required = ['album','filename','size','type','md5']
        for r in required:
            assert r in params
        for p in params:
            assert p in required


        album = ndb.Key('Album',int(params['album'])).get()
        assert album is not None
        assert album._get_kind() == 'Album'

        #Not logged in / email not validated
        if self.user is None or self.user.validated is not True:
            return self.unauthorized()

        if self.user.key != album.owner:
            applied = Permissions.get_permission(album,self.user)
            if applied.upload is not True:
                return self.unauthorized()

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

            b64_md5 = binascii.b2a_base64(binascii.unhexlify(params['md5']))
            # b64_md5 = binascii.b2a_base64(binascii.unhexlify('0f90478725359cd1f3ca43f2e11a0ef1'))

            body = {
                'name':str(params['album']) + '/' + uuid.uuid4().hex,
                'md5Hash' : b64_md5[:-1], #Trigger upload hash check
                'metadata': {
                    'album':params['album'],
                    'uploaded_by':int(self.user.key.id())
                }
            }

            (resp_headers,content) = http.request(uri=endpoint,method='POST',body=json.dumps(body),headers=headers)

            if resp_headers['status'] == '200':

                upload = {
                    'location':resp_headers['location'],
                    'chunk_size': (256 * 1024) * 4 * 2 #2mb chunks
                }
            else:
                logging.info(resp_headers)
                logging.info(content)
                raise ValueError('Unable to create object for upload')

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


class GCSFinalizeHandler(BaseRESTHandler):
    """Client posts here to tell us that the upload has finished"""

    def post(self):

        params = json.loads(self.request.body)

        blobstore_filename = '/gs/' + params['id']
        album = ndb.Key('Album',int(params['album']))
        _album = album.get()
        assert _album is not None

        stats = gcs.stat('/' + params['id'])

        assert int(stats.metadata['x-goog-meta-album']) == int(params['album']) ,stats.metadata
        assert int(stats.metadata['x-goog-meta-uploaded_by']) == int(self.request.user.key.id()) ,stats.metadata


        img = images.Image(filename=blobstore_filename)
        img.crop(0.0, 0.0, 0.01, 0.01)
        img.execute_transforms(parse_source_metadata=True)
        meta = img.get_original_metadata().copy()
        del img

        meta['UploadFileModified']=params['lastModifiedDate']
        if len(params['path']) > 0:
            meta['UploadOriginalPath']=params['path']
        assert self.request.user is not None

        if self.request.user.key != _album.owner:
            applied = Permissions.get_permission(_album,self.request.user)
            if applied.upload is not True:
                return self.unauthorized()

        first,last = Photo.allocate_ids(1,parent=album)

        photo = Photo(parent=album,
                      id=first,
                      gs = blobstore_filename,
                      title='.'.join(params['name'].split('.')[:-1]),
                      path=params['path'],
                      pos='{0:f}'.format(float(first)/150000),
                      md5 = stats.etag,
                      size = stats.st_size,
                      filename=params['name'],
                      album=album,
                      width=meta['ImageWidth'],
                      height= meta['ImageLength'],
                      metadata=meta,
                      uploaded_by = self.request.user.key
                      )

        photo.serving_url = photo._serving_url
        photo.put()

        SendUpdate('NEW',photo)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(photo.key.urlsafe()))

class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):
    """Only used by the dev_appserver"""

    def post(self):
        upload_files = self.get_uploads('file')  # 'file' is file upload field in the form
        blob_info = upload_files[0]

        name = blob_info.filename
        album = ndb.Key('Album',int(self.request.get('album')))
        _album = album.get()

        img = images.Image(blob_key=blob_info.key())
        img.rotate(0)
        img.execute_transforms(parse_source_metadata=True)

        meta = img.get_original_metadata()
        meta['UploadFileModified']=self.request.get('lastModifiedDate')
        meta['UploadOriginalPath']=self.request.get('path')
        user = ndb.Key('User',int(self.request.get('user'))).get()
        assert user is not None
        self.request.user = user


        first,last = Photo.allocate_ids(1,parent=album)
        photo = Photo(parent=album,
            id=first,
            blob=blob_info.key(),
            title='.'.join(name.split('.')[:-1]),
            path=self.request.get('path'),
            pos='{0:f}'.format(float(first)/150000),
            size = blob_info.size,
            filename=name,
            album=album,
            md5=blob_info.md5_hash,
            width=img.width,
            height= img.height,
            metadata=meta,
            uploaded_by = user.key
        )

        photo.serving_url = photo._serving_url
        photo.put()

        SendUpdate('NEW',photo)

        self.response.headers['Content-Type'] = 'application/json'
        allow_crosssite(self.response)
        self.response.out.write(json.dumps(photo.key.urlsafe()))

ALLOWED_ORIGIN = '*'

app = webapp2.WSGIApplication([
        webapp2.Route('/api/prepare-upload',PrepareUpload),
        webapp2.Route('/api/finalize-upload',GCSFinalizeHandler),
        webapp2.Route('/api/upload',UploadHandler),
        webapp2.Route('/api/login',LoginHandler),
        webapp2.Route('/api/claim',ClaimHandler),
        webapp2.Route('/api/fix_sizes',UpdateSchemaHandler),

        #Channel management
        webapp2.Route('/api/channel', ChannelHandler),
        webapp2.Route('/_ah/channel/connected/',ChannelConnectHandler ),
        webapp2.Route('/_ah/channel/disconnected/', ChannelDisconnectHandler),


        webapp2.Route('/verify/<v>', VerifyHandler),

        RESTHandler('/api/invites', Invite, permissions=PERM_APPLY(PERMISSION_INVITE),after_post_callback=Invite.after_put_callback,after_put_callback=Invite.after_put_callback,allowed_origin=ALLOWED_ORIGIN),
        RESTHandler('/api/register',User,   permissions=REGISTER_PERMISSIONS,        before_post_callback=User.new_user, allowed_origin=ALLOWED_ORIGIN),
        RESTHandler('/api/users',   User,   permissions=ANON_VIEWER,                 allowed_origin=ALLOWED_ORIGIN),
        RESTHandler('/api/comments',Comment,permissions=PERM_COMMENT(PERMISSION_COMMENT),allowed_origin=ALLOWED_ORIGIN),
        RESTHandler('/api/photos',  Photo,  permissions=PERM_PHOTO(PERMISSION_PHOTO),allowed_origin=ALLOWED_ORIGIN,
                    after_delete_callback=Photo.after_delete,
                    before_delete_callback=Photo.before_delete,
                    after_put_callback=Photo.after_put
        ),
        RESTHandler('/api/albums',  Album,  permissions=PERM_APPLY(PERMISSION_ALBUM),before_delete_callback=Album.before_delete
                    ,allowed_origin=ALLOWED_ORIGIN),
      ],
    debug=True,
    config=config
)
