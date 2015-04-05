
from google.appengine.ext.deferred import defer
from google.appengine.api import mail
from google.appengine.ext import ndb
import datetime


class EmailLog(ndb.Model):
    email = ndb.StringProperty()
    sent = ndb.DateTimeProperty(auto_now_add=True)



FROM_ADDR = lambda x:'{} <no-reply@slide-night.appspotmail.com>'


#Mail policy
#Max 10 emails in 48 hours


def send_email(to,subject,body,frm):

    last_sent = EmailLog.query(EmailLog.email == to.lower().strip()) \
        .filter(EmailLog.sent > datetime.datetime.utcnow() - datetime.timedelta(minutes=2)) \
        .get()

    if last_sent is not None:
        return False

    last_sent = EmailLog.query(EmailLog.email == to.lower().strip()) \
        .filter(EmailLog.sent > datetime.datetime.utcnow() - datetime.timedelta(hours=48)) \
        .fetch(11)

    if len(last_sent) > 10:
        return False

    EmailLog(email = to.lower().strip()).put()
    defer(mail.send_mail,FROM_ADDR(frm), to, subject, body)
    return True




