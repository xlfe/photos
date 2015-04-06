import logging
from rest_gae.permissions import Permissions
import json
from google.appengine.ext import ndb
from google.appengine.api import channel
from rest_gae.rest_gae import RESTException,BaseRESTHandler
import webapp2
from webapp2_extras.security import generate_random_string

# When a client opens an album they subscribe to updates to the album and the photos in the album
# When a client logs in they also subscribe to updates to their user

class ChannelSubscription(ndb.Model):

    albums = ndb.KeyProperty('Album', repeated=True)
    user =   ndb.KeyProperty('User')
    channel_id = ndb.StringProperty()
    connected = ndb.BooleanProperty()
    created = ndb.DateTimeProperty(auto_now_add=True)


#Get to get an ID
#Post to modify whats on it

class ChannelHandler(BaseRESTHandler):
    permissions = {'OPTIONS':True, 'POST':True}

    def post(self):
        json_data = json.loads(self.request.body)

        channel_id = None
        subscription = None
        result = {}

        if 'channel_id' in self.session:
            channel_id = self.session['channel_id']

        if 'channel_id' in json_data:
            _channel_id = json_data['channel_id']
            if channel_id is not None:
                if _channel_id != channel_id:
                    self.session['channel_id'] = _channel_id
            channel_id = _channel_id

        if channel_id is not None:
            subscription = ChannelSubscription.query(ChannelSubscription.channel_id == channel_id).get()

        if subscription is None:
            #Generate a new channel

            channel_id = generate_random_string(length=30)
            token = channel.create_channel(channel_id)
            subscription = ChannelSubscription(channel_id=channel_id)
            result = {
                'token':token,
                'channel_id':channel_id
            }
            self.session['channel_id'] = channel_id

        if 'add' in json_data:
            album = ndb.Key(urlsafe=json_data['add']).get()
            assert album is not None
            assert album._get_kind() == 'Album'

            if self.user is None or self.user.key != album.owner:
                applied = Permissions.get_permission(album,self.user)
                if applied.view is not True:
                    return self.unauthorized()

            if album.key not in subscription.albums:
                subscription.albums.append(album.key)

        if 'rem' in json_data:
            to_rem = ndb.Key(urlsafe=json_data['rem'])
            subscription.albums = filter(lambda x: x != to_rem,subscription.albums)

        subscription.put()
        return self.success(result)

class ChannelConnectHandler(webapp2.RequestHandler):
    def post(self):
        client_id = self.request.get('from')
        logging.info('{} has connected'.format(client_id))

        subscription = ChannelSubscription.query(ChannelSubscription.channel_id == client_id).get()
        subscription.connected = True
        subscription.put()

class ChannelDisconnectHandler(webapp2.RequestHandler):
    def post(self):
        client_id = self.request.get('from')

        subscription = ChannelSubscription.query(ChannelSubscription.channel_id == client_id).get()
        if subscription is not None:
            subscription.key.delete()


from webapp2 import get_request


def SendUpdate(type, model):

    request = get_request()
    for d in request.registry:
        logging.info("UPDATE FROM {}".format(d))

    subscriptions = ChannelSubscription.query(model.album in ChannelSubscription.album)\
        .filter(ChannelSubscription.connected == True).fetch(100)

    for s in subscriptions:
        logging.info('{} {}'.format(type, model.key))
