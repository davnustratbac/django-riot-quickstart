# Django + Riot Quick Start
##About

The primary purpose of this project is to create a base that I can work from on personal projects where much of the setup is already completed. It may also serve as inspiration for other developers to work from. Understand that it may be subject to major changes with no warning. **USE AT YOUR OWN RISK.**

The project assumes that the following are already installed:

1. Python 3
2. Pip3
3. Node Package Manager
4. MySQL

It is recommended that a virtual environment is created for your python project, using either VirtualEnv or Pyvenv.

Following the installation instructions will set you up with a new Python3 Django project, using a MySQL database, Riot for custom elements, Browserify for module management, Karma/Jasmine for js unit testing and Gulp for task management. The Gulp file is set up to generate unique js and css files for each page on your website. Alternatively you may create a master js and css file for your entire webpage, if you wish.

##Setup

1. **(Optional)** Make a virtual environment for your project
2. create a new working directory for your project
3. download and unpack the zip file for this repo into your new project directory
4. in Terminal:

	```bash
	cd ~/path/to/project
	pip3 install -r requirements.txt
	npm install
	django-admin startproject {project-name} .
	cp environment.example.cfg environment.cfg
	cp deploy.example.cfg deploy.cfg
	```
5. customize environment.cfg for your project
6. customize deploy.cfg for your project
7. in ```{project-name}/settings.py``` **add** the following lines:
	```python
	from ast import literal_eval
	from configparser import ConfigParser
	config = ConfigParser()
	config.read('environment.cfg')
	X_FRAME_OPTIONS = config.get('Security', 'XFrameOptions', raw=True)
	CSRF_COOKIE_HTTPONLY = literal_eval(config.get('Security', 'CSRFCookieHttpOnly', raw=True))
	CSRF_COOKIE_SECURE = literal_eval(config.get('Security', 'CSRFCookieSecure', raw=True))
	SESSION_COOKIE_SECURE = literal_eval(config.get('Security', 'SessionCookieSecure', raw=True))
	SECURE_CONTENT_TYPE_NOSNIFF = literal_eval(config.get('Security', 'SecureContentTypeNoSniff', raw=True))
	SECURE_BROWSER_XSS_FILTER = literal_eval(config.get('Security', 'SecureBrowserXssFilter', raw=True))
	```

13. in ```{project-name}/settings.py``` **change** the following lines:
	
	1.
	```python
	SECRET_KEY = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
	```
	to
	```python
	SECRET_KEY = config.get('Security', 'SecretKey', raw=True)
	```
	
	2.
	```python
	DEBUG = true
	```
	to
	```python
	DEBUG = literal_eval(config.get('Security', 'Debug', raw=True))
	```
	
	3.
	```python
	DATABASES = {
    	'default': {
        	'ENGINE': 'django.db.backends.sqlite3',
        	'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    	}
	}
	```
	to
	```python
	DATABASES = {
	    'default': {
	        'ENGINE': 'django.db.backends.mysql',
	        'NAME': config.get('Database', 'Name', raw=True),
	        'USER': config.get('Database', 'User', raw=True),
	        'PASSWORD': config.get('Database', 'Password', raw=True),
	        'HOST': config.get('Database', 'Host', raw=True)
	    }
	```

	4. ensure that your
	```python
	TEMPLATES['DIRS']
	```
	setting contains
	```python
	os.path.join(BASE_DIR, 'templates'
	```

14. in terminal 
```bash
python3 manage.py migrate
```

I'll leave handling of static files out of this.

##Usage

Coming Soon
