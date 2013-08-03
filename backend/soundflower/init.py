import json
import os.path
import subprocess
import os
from flask import Flask, abort, redirect, url_for, render_template

app = Flask(__name__)

db = 'shelve.db'
SOUND_FOLDER = '../sounds/'
PIDFOLDER = 'pids/'
try:
    os.mkdir(PIDFOLDER)
except:
    pass


def get_all_files(folder):
    ret = []
    for index, f in enumerate(os.listdir(SOUND_FOLDER)):
        ret.append({'name': f, 'id': index})
    return ret


def play_file(card, device, filename):
    import wave
    import contextlib
    duration = 0
    try:
        with contextlib.closing(wave.open(filename)) as f:
            frames = f.getnframes()
            rate = f.getframerate()
            duration = frames/float(rate)
    except IOError:
        raise Exception(filename + " does not exist!")

    if not get_running(card, device):
        proc = subprocess.Popen(['aplay', '-D', 'plughw:%d,%d' %
                                (card, device), filename])
        print(proc)
        with open(PIDFOLDER+'%d-%d' % (card, device), 'w+') as f:
            f.write(str(proc.pid)+'\n')
            f.write(filename)
        return duration

    else:
        raise Exception('already running or something')


def get_pid_for_audiodev(card, device):
    fname = PIDFOLDER+'%d-%d' % (card, device)
    try:
        pid = int(open(fname).readline())
        os.kill(pid, 0)
        return pid
    except:
        try:
            os.remove(fname)
            print('removing stale pidfile: %s' % fname)
        except:
            pass
        return 0

 
def get_running(card, device):
    fname = PIDFOLDER+'%d-%d' % (card, device)
    return get_pid_for_audiodev(card, device)


def get_alsa_file_id(card, device):
    return 0





def all_the_channels():
    channels = []
    ident = 0
    proc = subprocess.Popen(['aplay', '-l'], stdout=subprocess.PIPE)
    proc.wait()
    out = proc.communicate()[0]
    for line in out.splitlines():
        line = line.decode()
        if 'card' in line:
            c, d, name = line.split(':')
            card = int(c.split()[1])
            device = int(d.split(',')[1].split()[1])
            name = name.split('[')[0]
            channels.append({'id': ident,
                             'card': card,
                             'device': device,
                             'state': get_running(card, device),
                             'file': get_alsa_file_id(card, device),
                             'name': name.strip()})
            ident = ident + 1
    return channels


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/channels')
def get_all_channels():

    return json.dumps(list(all_the_channels()))


@app.route('/files')
def return_files():
    return json.dumps(get_all_files(SOUND_FOLDER))


def get_file_for_id(fileid):
    for v in get_all_files(SOUND_FOLDER):
        if v['id'] == fileid:
            return SOUND_FOLDER + v['name']


@app.route('/channels/<ident>/play/<fileid>')
def play_filename(ident, fileid):
    fileid = int(fileid)
    ident = int(ident)
    c = all_the_channels()[ident]
    fname = get_file_for_id(fileid)
    print(fname)
    try:
        return str(play_file(c['card'], c['device'], fname))
    except Exception as e:
        return "Something went wrong %s" % str(e), 403

@app.route('/channels/<ident>/volume/<vol>')
def set_volume(ident, vol):
    ident = int(ident)
    vol = vol
    c = all_the_channels()[ident]
    # brute force mixer controls
    for mixer in ['PCM', 'Master', 'Speaker']:
        subprocess.call(['amixer', '-c', str(c['card']), 'set', mixer, vol+'%'])
    return 'ok'


@app.route('/channels/<ident>/stop')
def stop_sound(ident):
    ident = int(ident)
    c = all_the_channels()[ident]
    try:
        pid = get_pid_for_audiodev(c['card'], c['device'])
        if pid:
            print(pid)
            os.kill(pid, 9)
            return '"ok"'
        else:
            raise Exception('pid is 0')
    except:
        print('cannot stop %d' % ident)


files = get_all_files(SOUND_FOLDER)


if __name__ == "__main__":
    #print(files)
    app.debug = True
    app.run("0.0.0.0")
