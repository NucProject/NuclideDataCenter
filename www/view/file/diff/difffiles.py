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
import md5


# Path1: local file
# Path2: remote file
# Path3: for result in /file/diff/result
def diff(path1, path2, path3, rootlen):
	f1 = open(path1, 'r')
	d1 = dict()
	for line in f1.readlines():
		if len(line.strip()) == 0:
			continue
		p = line.split(';')
		d1[p[0]] = p[1].strip()

	f2 = open(path2, 'r')
	
	for line in f2.readlines():
		if len(line.strip()) == 0:
			continue		
		p = line.split(';')
		if p[0] in d1:
			del d1[p[0]]


	f3 = open(path3, 'w')
	for i in d1:
		fn = d1[i][rootlen + 1:]
		f3.write(fn + "\n")

	f1.close()
	f2.close()
	f3.close()
	print d1
	

if __name__ == '__main__':
	# TODO: Config read?
	path = config.root
	diffpath = path + "\\view\\file\\diff\\"
	path1 = diffpath + "files.md5.dev"
	path2 = diffpath + "files.md5.online"
	path3 = diffpath + "result"

	md5.md5files(path, path2)

	diff(path1, path2, path3, len(path))