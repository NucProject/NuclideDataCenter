#!/usr/bin/env python
# -*- coding: utf-8 -*-

__author__ = 'healer'
import sys
import os
import urllib
import urllib2
import json
import cookielib
import random
import hashlib
import codecs
import config

def md5(fn):
	md5file = open(fn, 'rb')
	md5v = hashlib.md5(md5file.read()).hexdigest()
	md5file.close()
	return md5v

def md5files(path, md5r):
	r = open(md5r, 'w')
	for w in os.walk(path):
		low = w[0].lower()

		if low.find(path.lower() + '\\view\\file') >= 0:
			continue	# Ignore the file folder
		print low 
		for f in w[2]:
			fn = w[0] + '\\' + f
			line = md5(fn) + ";" + fn + "\n"
			r.write(line)
	r.close()



if __name__ == '__main__':
	path = config.root
	path1 = "./files.md5"
	#path2 = "./files.md5.online"
	#path3 = "./result"

	md5files(path, path1)
	#diff(path1, path2, path3, len(path))