#!/usr/bin/env python
#
import webapp2
import logging
import binascii
import base64
import uuid
import cgi

# GAE imports
from google.appengine.ext import ndb
from google.appengine.api import app_identity

url = app_identity.get_default_version_hostname()

# external libraries
import tweepy

# local imports
from twitkey import CONSUMER_KEY, CONSUMER_SECRET, \
                    ACCESS_TOKEN_KEY, ACCESS_TOKEN_SECRET


class Horse(ndb.Model):
    image = ndb.BlobProperty(indexed=False)
    added = ndb.DateTimeProperty(auto_now_add=True)


def horsehash(string):
    return str(hash(string)).replace('-', 'horse')\
                          .replace('1', 'h')\
                          .replace('2', 'o')\
                          .replace('3', 'r')\
                          .replace('4', 's')\
                          .replace('5', 'e')


def image_url(horse_hash):
    if 'localhost' in url:
        return "http://"+url+"/h/"+horse_hash
    else: 
        return "http://hrse.pics/h/"+horse_hash


def html_url(horse_hash):
    if 'localhost' in url:
        return "http://"+url+"/i/"+horse_hash
    else: 
        return "http://hrse.pics/i/"+horse_hash


def tweet(horse_url):
    """
        We have a horse_url and now we have to tweet it. 
    """
    logging.info("tweeting", horse_url)
    auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
    auth.set_access_token(ACCESS_TOKEN_KEY, ACCESS_TOKEN_SECRET)
    api = tweepy.API(auth)
    result = api.update_status(horse_url)


def twitter_photo_card(horse_url):
    title = "This horse is amazing!"
    return """ 
    <meta property="twitter:card" content="photo" />
    <meta property="twitter:site" content="@infinitehorse" />
    <meta property="twitter:title" content="%s" />
    <meta property="twitter:image" content="%s" />
    """ % (title, horse_url) 


class MainHandler(webapp2.RequestHandler):
    def get(self):
        results = Horse.query().order(-Horse.added).fetch(1)
        if len(results) == 0:
            self.response.write("Hello World")
        else:
            horse = results[0]
            return webapp2.redirect(html_url(horse.key.id()))
            

    def post(self):
        image = self.request.get('image')

        logging.info("Incoming Image!")
        logging.info(image[22:50])

        # remove "data:image/png;base64," from front of data
        png_bin = base64.decodestring(image[22:])

        horse_hash = horsehash(image)
        hash_key = ndb.Key(Horse, horse_hash)

        horse_image = hash_key.get()
        if not horse_image:
            #create a new horse_image with horse_hash
            horse_image = Horse(id=horse_hash, image=png_bin)
            horse_image.put()
            tweet(html_url(horse_hash))
            pass

        logging.info("/"+horse_hash)

        self.response.headers.add("Access-Control-Allow-Origin", "*")
        self.response.write(image_url(horse_hash))

class ImageHandler(webapp2.RequestHandler):
    def get(self, horse_hash):
        logging.info("Looking for: ", horse_hash)
        horse_key = ndb.Key(Horse, horse_hash)
        horse = horse_key.get()
        if not horse:
            self.response.write("404 Not Found")
            self.response.status = "404 Not Found"
            return
        else:
            self.response.headers.add("Content-Type", "image/png")
            self.response.write(horse.image)

class HtmlHandler(webapp2.RequestHandler):
    def get(self, horse_hash):
        img_url = image_url(horse_hash)
        self.response.headers.add("Content-Type", "text/html")

        self.response.write("<DOCTYPE html>");
        self.response.write("<html>");
        self.response.write("<head>");
        self.response.write("<meta charset='UTF-8'>");
        self.response.write("<title>HorseTacular Markup Language</title>");
        self.response.write("</head>");
        self.response.write("<body>");
        self.response.write("<img src='"+img_url+"'>");
        self.response.write( twitter_photo_card(img_url) );
        self.response.write("</body>");
        self.response.write("</html>");

app = webapp2.WSGIApplication([
    ('/', MainHandler),
    (r'/h/(\S+)?', ImageHandler),
    (r'/i/(\S+)?', HtmlHandler),
], debug=True)
