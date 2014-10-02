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
    'POST': PERMISSION_LOGGED_IN_USER,
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




app = webapp2.WSGIApplication([
        webapp2.Route('/api/init',InitHandler),
        RESTHandler('/api/users',User,permissions=OWNER_PERMISSIONS,user_object=User),
        RESTHandler('/api/photos',Photo,permissions=OWNER_PERMISSIONS,user_object=User),
      ],
    debug=True,
    config=config
)
