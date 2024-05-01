#!/usr/bin/env python3

import os

from celery import Celery

from flask import Flask
from flask import render_template
from flask import url_for

import requests
import requests_cache

from qtl2web.modules.admin.views import admin
from qtl2web.modules.api.views import api
from qtl2web.modules.page.views import page
from qtl2web.extensions import compress
from qtl2web.utils import ReverseProxied
from werkzeug.middleware.proxy_fix import ProxyFix 


CELERY_TASK_LIST = [
    'qtl2web.modules.api.tasks',
]


def create_celery_app(app=None):
    """
    Create a new Celery object and tie together the Celery config to the app's
    config. Wrap all tasks in the context of the application.

    :param app: Flask app
    :return: Celery app
    """
    # print('create_celery_app called')

    app = app or create_app()

    # print('createceleryapp=', app.config)

    celery = Celery(app.import_name,
                    broker=app.config['CELERY_BROKER_URL'],
                    backend=app.config['CELERY_RESULT_BACKEND'],
                    include=CELERY_TASK_LIST)

    celery.conf.update(app.config)

    TaskBase = celery.Task

    class ContextTask(TaskBase):
        abstract = True

        def __call__(self, *args, **kwargs):
            with app.app_context():
                return TaskBase.__call__(self, *args, **kwargs)

    celery.Task = ContextTask
    return celery


def create_app():
    """
    Create a Flask application using the app factory pattern.

    :param settings_override: Override settings
    :return: Flask app
    """
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object('qtl2web.config.settings')

    app.logger.setLevel(app.config['LOG_LEVEL'])

    if app.config.from_envvar('CONTAINER_FILE_QTL2WEB_SETTINGS', silent=True):
        env_settings = os.environ['CONTAINER_FILE_QTL2WEB_SETTINGS']
        app.logger.info('Using CONTAINER_FILE_QTL2WEB_SETTINGS: {}'.format(env_settings))

    app.logger.info(app.config)
    app.logger.setLevel(app.config['LOG_LEVEL'])

    app.logger.info('App instantiated')

    app.logger.info('Applying middleware...')
    middleware(app)

    app.logger.info('Registering blueprints...')
    app.register_blueprint(admin)
    app.register_blueprint(api)
    app.register_blueprint(page)

    app.logger.info('Applying extensions...')
    extensions(app)

    app.logger.info('Applying templates...')
    error_templates(app)

    app.logger.info('Done creating app!')

    return app


def extensions(app):
    """
    Register 0 or more extensions (mutates the app passed in).

    :param app: Flask application instance
    :return: None
    """
    compress.init_app(app)

    try:
        cache_dir = os.environ['CONTAINER_DIR_QTL2WEB_CACHE']
        cache_name = os.environ['CONTAINER_CACHE_NAME']
        cache_path = os.path.join(cache_dir, cache_name)
    except:
        cache_path = None

    app.logger.info('CACHE={}'.format(cache_path))

    requests_cache.install_cache(cache_path)

    return None


def middleware(app):
    """
    Register 0 or more middleware (mutates app that is passed in).

    :param app: Flask application instance
    :return: None
    """
    app.wsgi_app = ReverseProxied(app.wsgi_app)
    # Fixes the issue with the proxy not passing the correct scheme to the app
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1)
    return None


def error_templates(app):
    """
    Register 0 or more custom error pages (mutates the app passed in).

    :param app: Flask application instance
    :return: None
    """

    def render_status(status):
        """
         Render a custom template for a specific status.
           Source: http://stackoverflow.com/a/30108946

         :param status: Status as a written name
         :type status: str
         :return: None
         """
        # Get the status code from the status, default to a 500 so that we
        # catch all types of errors and treat them as a 500.
        code = getattr(status, 'code', 500)
        redirect_url = url_for('page.index')

        # for specific error pages, you could create an errors/404.html or an
        # errors/500.html and than do something like the following
        #
        # return render_template('errors/{0}.html'.format(code),
        #                        redirect_url=redirect_url), code

        return render_template('errors/error.html',
                               error_code=code,
                               redirect_url=redirect_url), code

    for error in [404, 500]:
        app.errorhandler(error)(render_status)

    return None


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=80)
