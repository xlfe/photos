from google.appengine.ext.deferred import defer
from google.appengine.ext import blobstore
from google.appengine.ext import ndb
import logging

# def update_sz(photo):
#     stats = gcs.stat(photo.gs[3:])
#     photo.md5 = stats.etag
#     photo.size = stats.st_size
#     return photo.put_async()
#


BATCH_SIZE = 150

def DeleteAlbumPhotos(album_id,cursor = None,num_deleted=0):

    album = ndb.Key('Album',album_id)

    if cursor is not None:
        (results,cursor,more) = ndb.Query(kind='Photo',ancestor=album).fetch_page(BATCH_SIZE,start_cursor=cursor)
    else:
        (results,cursor,more) = ndb.Query(kind='Photo',ancestor=album).fetch_page(BATCH_SIZE)

    to_del = []

    for photo in results:
        blobstore.delete(photo._blobinfo)
        to_del.append(photo.key)

    if to_del:
        ndb.delete_multi(to_del)
        num_deleted += len(to_del)

        logging.debug('Deleted %d photos from GCS and NDB - total is %d',len(to_del),num_deleted)

        defer(DeleteAlbumPhotos,album_id,cursor,num_deleted)
    else:
        logging.debug('Delete album completed with %d photos',num_deleted)







# def UpdateSchema(album=None,cursor=None, num_updated=0):
#     if cursor is not None:
#         (results,cursor,more) = Photo.query(ancestor=album).fetch_page(BATCH_SIZE,start_cursor=cursor)
#     else:
#         (results,cursor,more) = Photo.query(ancestor=album).fetch_page(BATCH_SIZE)
#
#     to_put = []
#     for p in results:
#         to_put.append(update_sz(p))
#
#     if to_put:
#
#         ndb.Future.wait_all(to_put)
#         num_updated += len(to_put)
#         logging.debug(
#             'Put %d entities to Datastore for a total of %d',
#             len(to_put), num_updated)
#         defer(
#             UpdateSchema, album=album,cursor=cursor, num_updated=num_updated)
#     else:
#         logging.debug(
#             'UpdateSchema complete with %d updates!', num_updated)
#
