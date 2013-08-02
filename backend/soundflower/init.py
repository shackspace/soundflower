import json
import os.path
from flask import Flask, abort, redirect, url_for, render_template
app = Flask(__name__)

SOUND_FOLDER='../sounds/'
def get_all_files(folder):
    return os.listdir(folder)

# TODO automagic here
channels = {
    '0': {
        'state': 0,
        'card': 0,
        'device': 0,
        'file': -1,
        'name': 'analog'
    }
}


@app.route('/channels')
def get_all_channels():
    return json.dumps(channels)


@app.route('/files')
def return_files():
    ret = {}
    for index, f in enumerate(get_all_files(SOUND_FOLDER)):
        ret[index] = f
    return json.dumps(ret)


@app.route('/channels/:id/play/:filename')
def play_filename(ident, filename):
    pass


@app.route('/channels/:id/stop')
def stop_filename(ident):
    pass


files = get_all_files(SOUND_FOLDER)


if __name__ == "__main__":
    #print(files)
    app.debug = True
    app.run("0.0.0.0")
