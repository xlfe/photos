#!/usr/bin/env python

import webapp2
import json
from google.appengine.api import users
from google.appengine.ext import ndb
from rest_gae import RESTHandler
from rest_gae.rest_gae import NDBEncoder
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


        #{
        # u'YResolution': 350,
        # u'LightSource': 0,
        # u'ResolutionUnit': 2,
        # u'Make': u'SONY',
        # u'Flash': 0,
        # u'SceneCaptureType': 0,
        # u'DateTime': u'2014:08:15 11:27:44',
        # u'MaxApertureValue': 0,
        # u'MeteringMode': 5,
        # u'XResolution': 350,
        # u'ExposureBiasValue': 0,
        # u'MimeType': 0,
        # u'Contrast': 0,
        # u'ColorProfile': False,
        # u'ExposureProgram': 1,
        # u'FocalLengthIn35mmFilm': 0,
        # u'ColorSpace': 1,
        # u'DateTimeDigitized': u'2014:08:15 11:27:44',
        # u'DateTimeOriginal': u'1408102064',
        # u'ImageWidth': 7360,
        # u'BrightnessValue': 4.5445313000000001,
        # u'WhiteBalance': 0,
        # u'CompressedBitsPerPixel': 1,
        # u'CustomRendered': 0,
        # u'FocalLength': 0,
        # u'ExposureMode': 1,
        # u'Saturation': 0,
        # u'ISOSpeedRatings': 125,
        # u'Model': u'ILCE-7R',
        # u'InteroperabilityIndex': u'R98',
        # u'Software': u'ILCE-7R v1.01',
        # u'ExposureTime': 0.00025000001000000002,
        # u'ImageLength': 4912,
        # u'Orientation': 1,
        # u'Sharpness': 0,
        # u'DateCreated': u'2014:08:15 11:27:44',
        # u'YCbCrPositioning': 2,
        # u'DigitalZoomRatio': 1
        # }

class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):

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

        # logging.info(img.get_original_metadata())
        # logging.info(orientation)
        # logging.info(img.width)
        # logging.info(img.height)

        self.response.headers['Content-Type'] = 'application/json'
        # self.response.out.write(json.dumps(photo,cls=NDBEncoder))
        self.response.out.write(json.dumps(photo.key.urlsafe()))



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
