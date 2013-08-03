import json
import os.path
from flask import Flask, abort, redirect, url_for, render_template

app = Flask(__name__)

db = 'shelve.db'
SOUND_FOLDER = '../sounds/'


def get_all_files(folder):
    return os.listdir(folder)


def get_alsa_state(card, device):
    return 0


def get_alsa_file_id(card, device):
    return 0


def all_the_channels():
    import subprocess
    channels = []
    ident = 0
    for line in str(subprocess.check_output(['aplay', '-l'])).split('\\n'):
        if 'card' in line:
            c, d, name = line.split(':')
            card = c.split()[1]
            device = d.split(',')[1].split()[1]
            name = name.split('[')[0]
            channels.append({'id': ident,
                             'state': get_alsa_state(card, device),
                             'file': get_alsa_file_id(card, device),
                             'name': name.strip()})
    return channels


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/channels')
def get_all_channels():

    return json.dumps(list(all_the_channels()))


@app.route('/files')
def return_files():
    ret = []
    for index, f in enumerate(get_all_files(SOUND_FOLDER)):
        ret.append({'name': f, 'id': index})
    return json.dumps(ret)


@app.route('/channels/<ident>/play/<filename>')
def play_filename(ident, filename):

    return redirect(url_for('get_all_channels'))


@app.route('/channels/<ident>/stop')
def stop_filename(ident):
    pass


files = get_all_files(SOUND_FOLDER)


if __name__ == "__main__":
    #print(files)
    app.debug = True
    app.run("0.0.0.0")
