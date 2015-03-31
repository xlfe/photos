
from google.appengine.ext.deferred import defer
from google.appengine.api import mail


FROM_ADDRESS = 'SlideNight Invitations <no-reply@slide-night.appspotmail.com>'


def send_email(to,subject,body):
    defer(mail.send_mail,FROM_ADDRESS, to, subject, body)




