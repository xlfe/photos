
from google.appengine.ext import ndb
from google.appengine.api import images
from google.appengine.ext import blobstore
import logging
import os
import json
from rest_gae.rest_gae import RESTException,BaseRESTHandler
from rest_gae.permissions import Permissions
from deferred_tasks import send_email

from webapp2_extras import security

DOMAIN = "https://slide-night.appspot.com"
HASHING_PW_PEPPER = 'jM3n/Ddp)&QY)R/kcDqzG[4?"C80v8SPSM#We}_x*V[JsQ>$C)7#6WN=XqUZ=RiYeGJ$})nj(B#x$e/K-I>o'
PW_SALT_LENGTH = 30

DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Development')

class User(ndb.Model):

    class RESTMeta:
        included_properties = ['full_name','validated']
        excluded_input_properties = ['validated']

    full_name = ndb.ComputedProperty(lambda x: '{} {}'.format(x.first_name,x.last_name))

    first_name = ndb.StringProperty()
    last_name = ndb.StringProperty()

    email = ndb.StringProperty()
    password_hash = ndb.StringProperty()
    validated = ndb.BooleanProperty(default=False)
    validation_key = ndb.StringProperty()

    def send_validation_email(self):

        template = "Dear {full_name},\n\nWelcome to SlideNight!\n\n" + \
                   "Please click the link below to verify we have your email address correct:\n" + \
                   DOMAIN + "/verify/{verify}\n\n\n" + \
                   "Regards,\nThe SlideNight Team"

        data = {
            'full_name': self.full_name,
            'verify':    self.validation_key
        }
        _template = template.format(**data)

        return send_email(to=self.email,subject="{} - please confirm your email address".format(self.full_name),
                   body=_template,frm='SlideNight Registration')

    @staticmethod
    def new_user(model,json_data):

        DUPE_ERROR = "Please make sure you haven't already registered using that email address"

        email = json_data['email']
        name = json_data['name']
        pwd = json_data['password']

        if len(User.query().filter(User.email == email.lower().strip()).fetch()) != 0:
            raise RESTException(DUPE_ERROR)

        if len(name.split(' ')) != 2 or len(pwd) < 8:
            raise RESTException('Validation error')


        model.first_name=name.split(' ')[0]
        model.last_name=' '.join(name.split(' ')[1:])
        model.email=email.lower().strip()
        model.password_hash = security.generate_password_hash(pwd, method='sha1', length=PW_SALT_LENGTH, pepper=HASHING_PW_PEPPER)
        model.validation_key = security.generate_random_string(length=16)
        model.send_validation_email()

        return model

class ValidateHandler(BaseRESTHandler):
    permissions = {'OPTIONS':True,'GET':True}

    def get(self,v):

        user = User.query(User.validation_key == v).get()

        if user is None:
            self.response.out.write("Not found.")

        else:
            user.validation_key = None
            user.validated = True
            user.put()
            self.response.out.write("Thank you! Your email is now validated. Please reopen SlideNight.")



class LoginHandler(BaseRESTHandler):
    permissions = {'OPTIONS':True,'GET':True,'PUT':True,'POST':True,'DELETE':True}

    def post(self):

        DEFAULT = "We were unable to log you in with those credentials."

        json_data = json.loads(self.request.body)
        email = json_data['identification']
        password = json_data['password']

        user = User.query().filter(User.email == email.lower().strip()).get()

        if not user:
            return self.error(DEFAULT)

        if security.check_password_hash(password, user.password_hash, pepper=HASHING_PW_PEPPER) is True:
            self.session['user'] = user.key.id()
            return self.success({
                'id':user.key.urlsafe(),
                'validated': user.validated,
                'full_name': user.full_name
            })
        else:
            return self.error(DEFAULT)

    def put(self):
        if 'user' in self.session:
            user = ndb.Key(User,self.session['user']).get()

            if user:
                if user.send_validation_email():
                    return self.success(({'sent':'sent'}))
                else:
                    return self.error({'limit':'you have sent too many emails to that address'})
        return self.unauthorized()

    def delete(self):
        self.response.delete_cookie('session')
        self.response.out.write('Logged out')

    def get(self):

        if 'user' in self.session:
            user = ndb.Key(User,self.session['user']).get()

            if user:

                return self.success({
                    'id':user.key.urlsafe(),
                    'validated':user.validated,
                    'full_name':user.full_name
                })

        return self.error('Unknown user')



class Album(ndb.Model):

    class RESTMeta:
        user_owner_property = 'owner'

    name = ndb.StringProperty()
    photo_count = ndb.IntegerProperty()
    owner = ndb.KeyProperty(User)
    created = ndb.DateTimeProperty(auto_now_add=True)
    permissions = ndb.StructuredProperty(Permissions,repeated=True)



class Invite(ndb.Model):

    class RESTMeta:

        user_owner_property = 'owner'

    email = ndb.StringProperty()
    last_emailed = ndb.DateTimeProperty()
    album = ndb.KeyProperty(Album)
    permissions = ndb.StructuredProperty(Permissions)
    owner = ndb.KeyProperty(User)


    @staticmethod
    def after_put_callback(updated_keys,model):

        template = "{from} has invited you to collaborate on their SlideNight album '{album}'.\n\n" +\
                "Please click on the link below to access their album:\n" +\
                DOMAIN + "/invites/{invite}\n\n\n" +\
                "Regards,\nThe SlideNight Team"

        album = model.album.get()
        owner = model.owner.get()
        data = {
            'from':owner.full_name,
            'album':album.name,
            'invite':model.key.urlsafe()
        }
        _template = template.format(**data)

        if send_email(to=model.email,subject="{} has invited you to collaborate".format(owner.full_name),body=_template,
                   frm='SlideNight Invitations'):

            return model
        else:
            raise RESTException('limit reached - you have sent too many emails to that address')


class ClaimHandler(BaseRESTHandler):
    permissions = {'OPTIONS':True,'POST':True}

    def post(self):

        json_data = json.loads(self.request.body)
        user = ndb.Key('User',self.session['user']).get()
        assert user is not None

        invite = ndb.Key(urlsafe=json_data['invite']).get()
        assert invite is not None
        assert invite._get_kind() == 'Invite'

        album = invite.album.get()

        if user.key == album.owner:
            return self.error({'message':'The owner cannot claim the invite'})

        invite.permissions.user = user.key
        album.permissions.append(invite.permissions)
        album.put()
        invite.key.delete()

        return self.success({'message':'success'})





class Photo(ndb.Model):

    class RESTMeta:

        excluded_properties = ['blob','gs']
        excluded_input_properties = ['filename','md5','uploaded','modified','width','height','metadata']


    title = ndb.StringProperty(indexed=False)
    caption = ndb.StringProperty(indexed=False)
    tags = ndb.StringProperty(repeated=True)
    path = ndb.StringProperty()
    pos = ndb.StringProperty()

    #Read only
    filename = ndb.StringProperty(required=True,indexed=False)
    md5 = ndb.StringProperty(required=True,indexed=False)

    uploaded = ndb.DateTimeProperty(auto_now_add=True,indexed=False)
    modified = ndb.DateTimeProperty(auto_now=True,indexed=False)

    width = ndb.IntegerProperty(required=True,indexed=False)
    height = ndb.IntegerProperty(required=True,indexed=False)
    metadata = ndb.JsonProperty(indexed=False)


    #Other data
    blob = ndb.BlobKeyProperty(indexed=False)
    gs = ndb.StringProperty(indexed=False)
    album = ndb.KeyProperty(Album)

    serving_url = ndb.StringProperty(indexed=False)

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

        for m in models:
            blobstore.delete(m._blobinfo)






