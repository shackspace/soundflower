import json
import os.path
import subprocess
import os
import sys
import os.path

from mpd import MPDClient
mpc = MPDClient()
mpc.timeout = 10
mpc.idletimeout = None
from flask import Flask, abort, redirect, url_for, render_template
os.chdir(os.path.realpath(os.path.dirname(sys.argv[0])))
here = os.path.abspath(os.getcwd())



app = Flask(__name__)
db = 'shelve.db'
SOUND_FOLDER = os.path.abspath('../sounds/')
PLAYLIST_FOLDER = SOUND_FOLDER + 'playlist'
MPD_FOLDER = os.path.abspath('../mpd/')
PIDFOLDER = 'pids/'


class SoundClient:
    client = None

    def __init__(self, ident):
        from mpd import MPDClient
        # TODO fix this hack (this resolves circular deps
        self.port = 6600 + ident
        self.client = MPDClient()
        self.client.timeout = 10
        self.client.idletimeout = None

    def __enter__(self):
        self.client.connect('localhost', self.port)
        # normalize params again
        self.client.repeat(0)
        return self.client

    def __exit__(self, type, value, traceback):
        self.client.close()
        self.client.disconnect()

for d in [SOUND_FOLDER, MPD_FOLDER, PLAYLIST_FOLDER, PIDFOLDER]:
    try:
        os.mkdir(d)
    except:
        pass


def get_all_files(folder):
    ret = []
    for index, f in enumerate(os.listdir(SOUND_FOLDER)):
        if '.wav' in f:
            ret.append({'name': f, 'id': index})
    return ret


def get_wav_len(filename):
    import wave
    import contextlib
    try:
        with contextlib.closing(wave.open(filename)) as f:
            frames = f.getnframes()
            rate = f.getframerate()
            return frames/float(rate)
    except IOError:
        return 0.0


def play_file(ident, filename):
    duration = get_wav_len(filename)

    if not get_running(ident):
        with SoundClient(ident) as mpc:
            mpc.clear()
            mpc.add(filename)
            mpc.play()
    else:
        raise Exception('already running or something')


def loop_file(ident, filename):
    # i come in hell for this, sorry...
    duration = get_wav_len(filename)

    if not get_running(ident):
        with SoundClient(ident) as mpc:
            mpc.clear()
            mpc.add(filename)
            mpc.repeat(1)
            mpc.play()
    else:
        raise Exception('already running or something')


def get_running(ident):
    ident = int(ident)
    try:
        with SoundClient(ident) as mpc:
            return 1 if mpc.status()['state'] == 'play' else 0
    except:
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
                             'mpd_port': 6600+ident,
                             'card': card,
                             'device': device,
                             'state': get_running(ident),
                             'file': get_running_file(ident),
                             'name': name.strip()})
            ident = ident + 1
    return channels


def get_running_file(ident):
    try: 
        with SoundClient(ident) as mpc:
            return mpc.currentsong().get('file','')
    except:
        return ''


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
            return v['name']


@app.route('/channels/<ident>/play/<fileid>')
def play_filename(ident, fileid):
    fileid = int(fileid)
    ident = int(ident)
    c = all_the_channels()[ident]
    fname = get_file_for_id(fileid)
    print(fname)
    try:
        return str(play_file(ident, fname))
    except Exception as e:
        return "Something went wrong %s" % str(e), 403


@app.route('/channels/<ident>/loop/<fileid>')
def loop_filename(ident, fileid):
    fileid = int(fileid)
    ident = int(ident)
    c = all_the_channels()[ident]
    fname = get_file_for_id(fileid)
    print(fname)
    try:
        return str(loop_file(ident, fname))
    except Exception as e:
        return "Something went wrong %s" % str(e), 403




@app.route('/channels/<ident>/volume/<vol>')
def set_volume(ident, vol):
    ident = int(ident)
    with SoundClient(ident) as mpc:
        mpc.setvol(vol)


@app.route('/channels/<ident>/stop')
def stop_sound(ident):
    ident = int(ident)
    try:
        with SoundClient(ident) as mpc:
            mpc.stop()
            mpc.clear()
        return '"ok"'
    except Exception as e:
        return '"failed... \'%s\'"' %str(e)


files = get_all_files(SOUND_FOLDER)


def init_mpds():
    for c in all_the_channels():
        print(c)
        mpd_path = MPD_FOLDER+"/"+str(c['id'])
        mpd_conf = mpd_path+'.conf'
        try:
            from time import sleep
            pid = int(open(mpd_path+'.pid').read())
            os.kill(pid, 3)
            sleep(1)
            print('%d killed' % pid)
        except Exception as e:
            print(e)
            pass
        with open(mpd_conf, 'w+') as conf:
            print('writing config %s.conf' % mpd_path)
            conf.write("""playlist_directory "{0}"
music_directory        "{1}"
db_file "{2}.db"
log_file           "{2}.log"
pid_file "{2}.pid"
state_file "{2}.state"
#user 'root'
port "{3}"
gapless_mp3_playback           "no"
zeroconf_enabled "no"
volume_normalization       "no"
bind_to_address "127.0.0.1"

audio_output {{
   type        "alsa"
   name        "My ALSA Device"
   device      "hw:{4},{5}"
#  format      "44100:16:2"    # optional
#  mixer_type      "hardware"  # optional
#  mixer_device    "default"   # optional
#  mixer_control   "PCM"       # optional
#  mixer_index "0"     # optional
}}""".format(SOUND_FOLDER+'/playlist', 
            SOUND_FOLDER, mpd_path,
            c['mpd_port'],
            c['card'], c['device']))
        os.system('mpd %s' % mpd_conf)
    

if __name__ == "__main__":
    #print(files)
    init_mpds()
    for value in all_the_channels():
        set_volume(str(value['id']), "100")
    app.debug = True
    app.run("0.0.0.0")
