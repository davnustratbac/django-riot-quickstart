import time
from fabric.api import env, run, cd
from configparser import ConfigParser

config = ConfigParser()
config.read('deploy.cfg')

env.user = config.get('Deploy', 'RemoteUser', raw=True)
env.hosts = [config.get('Deploy', 'RemoteIP', raw=True)]
env.forward_agent = True

repo = config.get('Deploy', 'Repo', raw=True)
home_location = '~/'
site_name = config.get('Deploy', 'SiteRoot', raw=True)
site_location = '%s/%s' % (home_location, site_name)
shared_dir_name = config.get('Deploy', 'SharedDirName', raw=True)
shared_location = '%s/%s' % (site_location, shared_dir_name)
release_dir_name = config.get('Deploy', 'ReleasesDirName', raw=True)
release_location = '%s/%s' % (site_location, release_dir_name)
release = '%s%s' % (config.get('Deploy', 'ReleaseFolderPrefix', raw=True), str(int(time.time())))
current_release_location = '%s/%s/%s' % (site_location, release_dir_name, release)
current_dir_name = config.get('Deploy', 'CurrentDirName', raw=True)
current_location = '%s/%s' % (site_location, current_dir_name)
environment_file_name = config.get('Deploy', 'EnvFileName', raw=True)
environment_example_file_name = config.get('Deploy', 'EnvExampleFileName', raw=True)
environment_file_location = '%s/%s' % (shared_location, environment_file_name)
environment_example_file_location = '%s/%s' % (current_release_location, environment_example_file_name)
environment_symlink_location ='%s/%s' % (current_release_location, environment_file_name)

#Create Folders for things that should not change between deploys (.cfg files, logs maybe)
def create_shared_folder():
	run('mkdir -p %s' % shared_location)

#Create folder for new deployment with timestamp
def create_release_folder():
	run('mkdir -p %s' % current_release_location)

#git clone branch into folder
def clone_branch(branch='master'):
	run('git clone -b %s %s %s' % (branch, repo, current_release_location))

#create symlink between new deployment folder and 'current'
#create symlink between new deployment folder and shared/environment.cfg
def create_symlinks():
	run('ln -nfs %s %s' % (environment_file_location, environment_symlink_location))
	run('ln -nfs %s %s' % (current_release_location, current_location))

def install_dependancies():
	with cd(current_release_location):
		run('source ~/bin/activate && pip3 install -r requirements.txt')

#run manage.py migrate
def migrate():
	with cd(current_release_location):
		run('source ~/bin/activate && python3 manage.py migrate')

#destroy all past deployments except for the latest 5, keep them for backup.
def clean():
	with cd(release_location):
		run('(ls -rd %s/*|head -n 5;ls -d %s/*)|sort|uniq -u|xargs rm -rf'%(release_location, release_location))

def deploy(branch='master', first_run=False):
	create_shared_folder()
	create_release_folder()
	clone_branch(branch)
	if first_run:
		run('cp %s %s' % (environment_example_file_location, environment_file_location))
	create_symlinks()
	install_dependancies()
	print("remember to restart!")
