import logging
from rest_gae.permissions import Permissions
import json
from google.appengine.ext import ndb
from google.appengine.api import channel
from rest_gae.rest_gae import RESTException,BaseRESTHandler
import webapp2
from webapp2_extras.security import generate_random_string
from rest_gae.rest_gae import NDBEncoder, model_ember_key
from webapp2 import get_request

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

        if 'channel_id' in json_data:
            channel_id = json_data['channel_id']

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

        if 'add' in json_data:
            album = ndb.Key('Album',int(json_data['add'])).get()
            assert album is not None
            assert album._get_kind() == 'Album'

            if self.user is None or self.user.key != album.owner:
                applied = Permissions.get_permission(album,self.user)
                if applied.view is not True:
                    return self.unauthorized()

            if album.key not in subscription.albums:
                subscription.albums.append(album.key)

        if 'rem' in json_data:
            to_rem = ndb.Key('Album',int(json_data['rem']))
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




def SendUpdate(type, model):

    req = get_request()
    channel_id = None
    user = req.user

    if 'X-Channel-ID' in req.headers:
        channel_id = req.headers['X-Channel-ID']

    subscriptions = ChannelSubscription.query(ChannelSubscription.albums == model.album) #.filter(ChannelSubscription.connected == True)

    if channel_id is not None:
        subscriptions = subscriptions.filter(ChannelSubscription.channel_id != channel_id)

    subscriptions = subscriptions.fetch(100)

    if len(subscriptions) == 0:
        return

    details = {
        'user': user.key.id() if user is not None else None,
        'type': type,
        'model': model_ember_key(model),
    }

    if type == 'DEL':
        details['data'] = model.key.id()
    else:
        details['data'] = model

    details = json.dumps(details,cls=NDBEncoder)

    for s in subscriptions:
        channel.send_message(s.channel_id,details)











